-- Strengthen get_seller_orders function with explicit authentication check
CREATE OR REPLACE FUNCTION public.get_seller_orders()
RETURNS TABLE(
  id uuid,
  product_id uuid,
  product_title text,
  product_price numeric,
  quantity integer,
  total_amount numeric,
  status text,
  seller_id uuid,
  customer_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  customer_name text,
  customer_phone text,
  delivery_location text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_superadmin boolean;
BEGIN
  -- SECURITY: Verify authentication before processing
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- Check superadmin status
  is_superadmin := has_role(current_user_id, 'superadmin'::user_role);
  
  -- Return orders with strict access control and data masking
  RETURN QUERY
  SELECT 
    o.id,
    o.product_id,
    o.product_title,
    o.product_price,
    o.quantity,
    o.total_amount,
    o.status,
    o.seller_id,
    o.customer_id,
    o.created_at,
    o.updated_at,
    -- SECURITY: Mask customer name for unauthorized access
    CASE 
      WHEN current_user_id = o.customer_id THEN o.customer_name
      WHEN current_user_id = o.seller_id THEN o.customer_name
      WHEN is_superadmin THEN o.customer_name
      ELSE 'Confidentiel'
    END::TEXT as customer_name,
    -- SECURITY: Mask customer phone for unauthorized access
    CASE 
      WHEN current_user_id = o.customer_id THEN o.customer_phone
      WHEN current_user_id = o.seller_id THEN o.customer_phone
      WHEN is_superadmin THEN o.customer_phone
      ELSE 'Confidentiel'
    END::TEXT as customer_phone,
    -- SECURITY: Mask delivery location for unauthorized access
    CASE 
      WHEN current_user_id = o.customer_id THEN o.delivery_location
      WHEN current_user_id = o.seller_id THEN o.delivery_location
      WHEN is_superadmin THEN o.delivery_location
      ELSE 'Confidentiel'
    END::TEXT as delivery_location
  FROM public.orders o
  WHERE 
    -- SECURITY: Strict row filtering - only return orders user has access to
    current_user_id = o.customer_id 
    OR current_user_id = o.seller_id 
    OR is_superadmin;
END;
$$;

-- Strengthen update_order_status with input validation and authorization checks
CREATE OR REPLACE FUNCTION public.update_order_status(order_id uuid, new_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_seller_id UUID;
  current_user_id UUID;
  is_superadmin BOOLEAN;
BEGIN
  -- SECURITY: Verify authentication
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- SECURITY: Input validation to prevent injection attacks
  IF new_status NOT IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status USING ERRCODE = 'PGRST';
  END IF;
  
  -- SECURITY: Validate order exists and get seller_id
  SELECT seller_id INTO order_seller_id
  FROM orders
  WHERE id = order_id;
  
  IF order_seller_id IS NULL THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'PGRST';
  END IF;
  
  -- SECURITY: Check authorization - only seller or superadmin can update
  is_superadmin := has_role(current_user_id, 'superadmin'::user_role);
  
  IF order_seller_id != current_user_id AND NOT is_superadmin THEN
    RAISE EXCEPTION 'Unauthorized: You can only update your own orders' USING ERRCODE = 'PGRST';
  END IF;
  
  -- Update order status
  UPDATE orders 
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = order_id;
  
  RETURN TRUE;
END;
$$;

-- Strengthen cancel_order_by_customer with additional security checks
CREATE OR REPLACE FUNCTION public.cancel_order_by_customer(order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record RECORD;
  result json;
  current_user_id UUID;
BEGIN
  -- SECURITY: Verify authentication
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
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
$$;