-- Modification du système de jetons : 100 jetons gratuits à l'inscription, valables 28 jours, une seule fois

-- 1. Supprimer les fonctions qui permettent d'obtenir des jetons gratuits après l'inscription
DROP FUNCTION IF EXISTS public.grant_trial_bonus_tokens(_user_id uuid);
DROP FUNCTION IF EXISTS public.grant_free_tokens_to_existing_sellers();

-- 2. Modifier la fonction handle_new_user pour donner 100 jetons gratuits au lieu de 50
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_shop_name TEXT;
  new_shop_slug TEXT;
BEGIN
  -- Insert profile avec période d'essai de 28 jours pour les nouveaux utilisateurs
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    phone,
    country,
    city,
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
    NEW.raw_user_meta_data ->> 'city',
    now(),
    now() + interval '28 days',
    false,
    true  -- Marquer comme déjà reçu pour éviter toute nouvelle attribution
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

  -- Si c'est un vendeur, créer automatiquement sa boutique et donner 100 jetons
  IF (NEW.raw_user_meta_data ->> 'user_role' = 'seller') THEN
    -- Récupérer le nom de la boutique depuis les métadonnées ou utiliser "Djassa Boutique" par défaut
    new_shop_name := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'shop_name'), ''),
      'Djassa Boutique'
    );
    
    -- Générer un slug unique
    new_shop_slug := public.generate_shop_slug(new_shop_name);
    
    -- Créer la boutique
    INSERT INTO public.seller_shops (
      seller_id,
      shop_name,
      shop_slug,
      shop_description,
      is_active,
      subscription_active
    ) VALUES (
      NEW.id,
      new_shop_name,
      new_shop_slug,
      'Bienvenue sur ma boutique ! Découvrez mes produits de qualité.',
      true,
      true
    );

    -- Initialiser le solde de jetons avec 100 jetons gratuits (au lieu de 50)
    -- Ces jetons expirent après 28 jours
    INSERT INTO public.seller_tokens (
      seller_id, 
      token_balance, 
      free_tokens_count, 
      free_tokens_expires_at,
      paid_tokens_count
    )
    VALUES (
      NEW.id, 
      100,  -- 100 jetons gratuits au lieu de 50
      100,  -- 100 jetons gratuits au lieu de 50
      now() + INTERVAL '28 days',  -- Expiration dans 28 jours
      0     -- Aucun jeton payant au départ
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
      100,  -- 100 jetons gratuits
      'completed'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Vérifier que la fonction expire_free_tokens fonctionne correctement
-- Cette fonction nettoie automatiquement les jetons gratuits expirés
CREATE OR REPLACE FUNCTION public.expire_free_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Nettoyer les jetons gratuits expirés
  UPDATE public.seller_tokens
  SET 
    free_tokens_count = 0,
    token_balance = paid_tokens_count,  -- Ne garder que les jetons payants
    updated_at = now()
  WHERE free_tokens_expires_at < now() 
    AND free_tokens_count > 0;
END;
$function$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Attribue 100 jetons gratuits à l''inscription, valables 28 jours, une seule fois';
COMMENT ON FUNCTION public.expire_free_tokens() IS 'Nettoie automatiquement les jetons gratuits expirés';