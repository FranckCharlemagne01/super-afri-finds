-- Security: Add explicit NULL checks to remaining critical SECURITY DEFINER functions

-- Update check_token_balance with explicit NULL check
CREATE OR REPLACE FUNCTION public.check_token_balance(_seller_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_balance INTEGER;
  free_tokens INTEGER;
  paid_tokens INTEGER;
  expires_at TIMESTAMP WITH TIME ZONE;
  current_user_id UUID;
BEGIN
  -- SECURITY: Explicit authentication check
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- SECURITY: Verify user owns this seller_id
  IF current_user_id != _seller_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only check your own token balance' USING ERRCODE = 'PGRST';
  END IF;
  
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

-- Update add_tokens_after_purchase with explicit NULL check
CREATE OR REPLACE FUNCTION public.add_tokens_after_purchase(_seller_id uuid, _tokens_amount integer, _price_paid numeric, _paystack_reference text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id UUID;
BEGIN
  -- SECURITY: Explicit authentication check
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- SECURITY: Verify user owns this seller_id
  IF current_user_id != _seller_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only add tokens to your own account' USING ERRCODE = 'PGRST';
  END IF;
  
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
$function$;