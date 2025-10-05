-- 1. Ajouter les colonnes pour gérer les jetons gratuits avec expiration
ALTER TABLE public.seller_tokens
ADD COLUMN IF NOT EXISTS free_tokens_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_tokens_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paid_tokens_count INTEGER DEFAULT 0;

-- 2. Migrer les jetons existants vers paid_tokens_count
UPDATE public.seller_tokens
SET paid_tokens_count = token_balance,
    free_tokens_count = 0
WHERE paid_tokens_count = 0;

-- 3. Fonction pour attribuer 50 jetons gratuits à tous les vendeurs existants
CREATE OR REPLACE FUNCTION public.grant_free_tokens_to_existing_sellers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_record RECORD;
BEGIN
  -- Pour chaque vendeur existant
  FOR seller_record IN 
    SELECT DISTINCT ur.user_id
    FROM user_roles ur
    WHERE ur.role = 'seller'
  LOOP
    -- Initialiser les jetons si nécessaire
    INSERT INTO public.seller_tokens (seller_id, token_balance, free_tokens_count, free_tokens_expires_at, paid_tokens_count)
    VALUES (
      seller_record.user_id, 
      50, 
      50, 
      now() + INTERVAL '28 days',
      0
    )
    ON CONFLICT (seller_id) 
    DO UPDATE SET
      free_tokens_count = seller_tokens.free_tokens_count + 50,
      free_tokens_expires_at = now() + INTERVAL '28 days',
      token_balance = seller_tokens.token_balance + 50,
      updated_at = now();
    
    -- Enregistrer la transaction
    INSERT INTO public.token_transactions (
      seller_id,
      transaction_type,
      tokens_amount,
      status
    ) VALUES (
      seller_record.user_id,
      'trial_bonus',
      50,
      'completed'
    );
  END LOOP;
END;
$$;

-- 4. Exécuter la fonction pour attribuer les jetons aux vendeurs existants
SELECT public.grant_free_tokens_to_existing_sellers();

-- 5. Modifier handle_new_user pour attribuer 50 jetons gratuits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile avec période d'essai de 28 jours pour les nouveaux utilisateurs
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    phone,
    country,
    trial_start_date,
    trial_end_date,
    trial_used,
    trial_bonus_tokens_given
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'phone'),
    NEW.raw_user_meta_data ->> 'country',
    now(),
    now() + interval '28 days',
    false,
    true
  );

  -- Insert user role based on signup data, default to buyer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'user_role' = 'seller' THEN 'seller'::user_role
      ELSE 'buyer'::user_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Initialiser le solde de jetons avec 50 jetons gratuits pour les vendeurs
  IF (NEW.raw_user_meta_data ->> 'user_role' = 'seller') THEN
    INSERT INTO public.seller_tokens (
      seller_id, 
      token_balance, 
      free_tokens_count, 
      free_tokens_expires_at,
      paid_tokens_count
    )
    VALUES (
      NEW.id, 
      50, 
      50, 
      now() + INTERVAL '28 days',
      0
    );

    -- Enregistrer la transaction de bonus d'inscription
    INSERT INTO public.token_transactions (
      seller_id,
      transaction_type,
      tokens_amount,
      status
    ) VALUES (
      NEW.id,
      'trial_bonus',
      50,
      'completed'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Fonction pour nettoyer automatiquement les jetons gratuits expirés
CREATE OR REPLACE FUNCTION public.expire_free_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.seller_tokens
  SET 
    free_tokens_count = 0,
    token_balance = paid_tokens_count,
    updated_at = now()
  WHERE free_tokens_expires_at < now() 
    AND free_tokens_count > 0;
END;
$$;

-- 7. Modifier consume_token_for_publication pour utiliser d'abord les jetons gratuits
CREATE OR REPLACE FUNCTION public.consume_token_for_publication(_seller_id uuid, _product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  free_tokens INTEGER;
  paid_tokens INTEGER;
BEGIN
  -- Nettoyer les jetons expirés d'abord
  PERFORM public.expire_free_tokens();
  
  -- Vérifier le solde de jetons
  SELECT token_balance, free_tokens_count, paid_tokens_count 
  INTO current_balance, free_tokens, paid_tokens
  FROM public.seller_tokens
  WHERE seller_id = _seller_id;
  
  -- Si pas de jetons disponibles, retourner false
  IF current_balance IS NULL OR current_balance < 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Déduire un jeton (gratuit en priorité, puis payant)
  IF free_tokens > 0 THEN
    UPDATE public.seller_tokens
    SET 
      free_tokens_count = free_tokens_count - 1,
      token_balance = token_balance - 1,
      updated_at = now()
    WHERE seller_id = _seller_id;
  ELSE
    UPDATE public.seller_tokens
    SET 
      paid_tokens_count = paid_tokens_count - 1,
      token_balance = token_balance - 1,
      updated_at = now()
    WHERE seller_id = _seller_id;
  END IF;
  
  -- Enregistrer la transaction
  INSERT INTO public.token_transactions (
    seller_id,
    transaction_type,
    tokens_amount,
    product_id,
    status
  ) VALUES (
    _seller_id,
    'usage',
    -1,
    _product_id,
    'completed'
  );
  
  RETURN TRUE;
END;
$$;

-- 8. Modifier boost_product pour utiliser d'abord les jetons gratuits
CREATE OR REPLACE FUNCTION public.boost_product(_seller_id uuid, _product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  free_tokens INTEGER;
  paid_tokens INTEGER;
  boost_cost INTEGER := 2;
  tokens_to_deduct_free INTEGER := 0;
  tokens_to_deduct_paid INTEGER := 0;
BEGIN
  -- Nettoyer les jetons expirés d'abord
  PERFORM public.expire_free_tokens();
  
  -- Vérifier le solde de jetons
  SELECT token_balance, free_tokens_count, paid_tokens_count 
  INTO current_balance, free_tokens, paid_tokens
  FROM public.seller_tokens
  WHERE seller_id = _seller_id;
  
  -- Si pas assez de jetons, retourner false
  IF current_balance IS NULL OR current_balance < boost_cost THEN
    RETURN FALSE;
  END IF;
  
  -- Calculer combien de jetons gratuits et payants utiliser
  IF free_tokens >= boost_cost THEN
    tokens_to_deduct_free := boost_cost;
    tokens_to_deduct_paid := 0;
  ELSIF free_tokens > 0 THEN
    tokens_to_deduct_free := free_tokens;
    tokens_to_deduct_paid := boost_cost - free_tokens;
  ELSE
    tokens_to_deduct_free := 0;
    tokens_to_deduct_paid := boost_cost;
  END IF;
  
  -- Déduire les jetons
  UPDATE public.seller_tokens
  SET 
    free_tokens_count = free_tokens_count - tokens_to_deduct_free,
    paid_tokens_count = paid_tokens_count - tokens_to_deduct_paid,
    token_balance = token_balance - boost_cost,
    updated_at = now()
  WHERE seller_id = _seller_id;
  
  -- Activer le boost sur le produit (7 jours)
  UPDATE public.products
  SET is_boosted = TRUE,
      boosted_at = now(),
      boosted_until = now() + INTERVAL '7 days',
      updated_at = now()
  WHERE id = _product_id AND seller_id = _seller_id;
  
  -- Enregistrer la transaction
  INSERT INTO public.token_transactions (
    seller_id,
    transaction_type,
    tokens_amount,
    product_id,
    status
  ) VALUES (
    _seller_id,
    'boost',
    -boost_cost,
    _product_id,
    'completed'
  );
  
  RETURN TRUE;
END;
$$;

-- 9. Modifier add_tokens_after_purchase pour ajouter aux jetons payants
CREATE OR REPLACE FUNCTION public.add_tokens_after_purchase(_seller_id uuid, _tokens_amount integer, _price_paid numeric, _paystack_reference text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Initialiser les jetons si nécessaire
  INSERT INTO public.seller_tokens (seller_id, token_balance, paid_tokens_count, free_tokens_count)
  VALUES (_seller_id, 0, 0, 0)
  ON CONFLICT (seller_id) DO NOTHING;
  
  -- Ajouter les jetons payants
  UPDATE public.seller_tokens
  SET 
    paid_tokens_count = paid_tokens_count + _tokens_amount,
    token_balance = token_balance + _tokens_amount,
    updated_at = now()
  WHERE seller_id = _seller_id;
  
  -- Marquer la transaction comme complétée
  UPDATE public.token_transactions
  SET status = 'completed'
  WHERE paystack_reference = _paystack_reference
    AND seller_id = _seller_id;
  
  RETURN TRUE;
END;
$$;