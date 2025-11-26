-- Security Enhancement: Add explicit authentication checks to SECURITY DEFINER functions
-- This prevents potential authorization bypass if auth.uid() returns NULL

-- Improve cancel_order_by_customer with better validation
CREATE OR REPLACE FUNCTION public.cancel_order_by_customer(order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  order_record RECORD;
  result json;
  current_user_id UUID;
BEGIN
  -- SECURITY: Explicit authentication check
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- SECURITY: Validate order_id parameter
  IF order_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order ID is required'
    );
  END IF;
  
  -- Get order information
  SELECT * INTO order_record
  FROM orders
  WHERE id = order_id;
  
  -- SECURITY: Validate order exists
  IF order_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Commande introuvable'
    );
  END IF;
  
  -- SECURITY: Verify user owns this order
  IF order_record.customer_id != current_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez annuler que vos propres commandes'
    );
  END IF;
  
  -- Validate order can be cancelled
  IF order_record.status IN ('shipped', 'delivered') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cette commande ne peut plus être annulée car elle a déjà été expédiée ou livrée'
    );
  END IF;
  
  -- Check if already cancelled
  IF order_record.status = 'cancelled' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cette commande est déjà annulée'
    );
  END IF;
  
  -- Update order status
  UPDATE orders 
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id = order_id;
  
  -- Return success with minimal data exposure
  RETURN json_build_object(
    'success', true,
    'seller_id', order_record.seller_id,
    'product_title', order_record.product_title,
    'customer_name', order_record.customer_name
  );
END;
$function$;

-- Improve boost_product with explicit auth check
CREATE OR REPLACE FUNCTION public.boost_product(_seller_id uuid, _product_id uuid, _duration_hours integer DEFAULT 168)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_balance INTEGER;
  free_tokens INTEGER;
  paid_tokens INTEGER;
  boost_cost INTEGER := 2;
  tokens_to_deduct_free INTEGER := 0;
  tokens_to_deduct_paid INTEGER := 0;
  current_user_id UUID;
BEGIN
  -- SECURITY: Explicit authentication check
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- SECURITY: Verify user owns this seller_id
  IF current_user_id != _seller_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only boost your own products' USING ERRCODE = 'PGRST';
  END IF;
  
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

-- Add database constraint for message length validation
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS message_content_length;

ALTER TABLE public.messages 
ADD CONSTRAINT message_content_length 
CHECK (char_length(content) <= 5000);

-- Add rate limiting policy for messages (prevent spam)
DROP POLICY IF EXISTS "Rate limit messages" ON public.messages;

CREATE POLICY "Rate limit messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT COUNT(*) 
   FROM public.messages 
   WHERE sender_id = auth.uid() 
   AND created_at > now() - interval '1 hour') < 50
);