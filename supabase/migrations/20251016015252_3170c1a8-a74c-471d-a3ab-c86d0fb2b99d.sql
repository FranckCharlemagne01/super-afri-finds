-- Modifier la fonction boost_product pour accepter une durée
CREATE OR REPLACE FUNCTION public.boost_product(_seller_id uuid, _product_id uuid, _duration_hours integer DEFAULT 168)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Activer le boost sur le produit avec la durée spécifiée
  UPDATE public.products
  SET is_boosted = TRUE,
      boosted_at = now(),
      boosted_until = now() + (_duration_hours || ' hours')::INTERVAL,
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
$function$;