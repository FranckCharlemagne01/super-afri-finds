-- Amélioration de la fonction de consommation de jetons pour publication
-- Cette version vérifie ET déduit les jetons de manière atomique AVANT la publication

CREATE OR REPLACE FUNCTION public.consume_token_for_publication(_seller_id uuid, _product_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_balance INTEGER;
  free_tokens INTEGER;
  paid_tokens INTEGER;
BEGIN
  -- Nettoyer les jetons expirés d'abord
  PERFORM public.expire_free_tokens();
  
  -- Vérifier le solde de jetons avec un verrou pour éviter les race conditions
  SELECT token_balance, free_tokens_count, paid_tokens_count 
  INTO current_balance, free_tokens, paid_tokens
  FROM public.seller_tokens
  WHERE seller_id = _seller_id
  FOR UPDATE; -- Verrou pour transaction atomique
  
  -- Si pas assez de jetons, retourner false
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
  
  -- Enregistrer la transaction seulement si un product_id est fourni
  IF _product_id IS NOT NULL THEN
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
  ELSE
    -- Transaction sans product_id (vérification préalable)
    INSERT INTO public.token_transactions (
      seller_id,
      transaction_type,
      tokens_amount,
      status
    ) VALUES (
      _seller_id,
      'usage',
      -1,
      'completed'
    );
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- Fonction pour vérifier les jetons disponibles sans les consommer
CREATE OR REPLACE FUNCTION public.check_token_balance(_seller_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_balance INTEGER;
  free_tokens INTEGER;
  paid_tokens INTEGER;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Nettoyer les jetons expirés d'abord
  PERFORM public.expire_free_tokens();
  
  -- Récupérer le solde actuel
  SELECT token_balance, free_tokens_count, paid_tokens_count, free_tokens_expires_at
  INTO current_balance, free_tokens, paid_tokens, expires_at
  FROM public.seller_tokens
  WHERE seller_id = _seller_id;
  
  -- Si aucun enregistrement n'existe, initialiser
  IF current_balance IS NULL THEN
    INSERT INTO public.seller_tokens (seller_id, token_balance, free_tokens_count, paid_tokens_count)
    VALUES (_seller_id, 0, 0, 0)
    ON CONFLICT (seller_id) DO NOTHING;
    
    RETURN jsonb_build_object(
      'has_tokens', false,
      'token_balance', 0,
      'free_tokens', 0,
      'paid_tokens', 0,
      'expires_at', null
    );
  END IF;
  
  RETURN jsonb_build_object(
    'has_tokens', current_balance > 0,
    'token_balance', current_balance,
    'free_tokens', free_tokens,
    'paid_tokens', paid_tokens,
    'expires_at', expires_at
  );
END;
$function$;