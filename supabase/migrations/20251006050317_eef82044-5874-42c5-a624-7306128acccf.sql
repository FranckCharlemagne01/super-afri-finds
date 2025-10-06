-- ============================================
-- SECURITY FIX: Enhanced Protection for Customer PII in Orders Table
-- Part 1: Database Functions and Audit Logging
-- ============================================

-- 1. Enhanced get_seller_orders function with stricter validation and audit logging
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
AS $function$
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
  
  -- SECURITY: Log this access for audit trail
  INSERT INTO public.order_access_logs (
    order_id,
    accessed_by,
    access_type,
    accessed_at
  )
  SELECT 
    o.id,
    current_user_id,
    'bulk_view',
    now()
  FROM public.orders o
  WHERE 
    current_user_id = o.customer_id 
    OR current_user_id = o.seller_id 
    OR is_superadmin
  LIMIT 1; -- Just log once that they accessed their orders
  
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
$function$;

-- 2. Enhanced update_order_status with audit logging
CREATE OR REPLACE FUNCTION public.update_order_status(
  order_id uuid,
  new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  
  -- SECURITY: Log this status change
  INSERT INTO public.order_access_logs (
    order_id,
    accessed_by,
    access_type,
    accessed_at
  ) VALUES (
    order_id,
    current_user_id,
    'status_update_' || new_status,
    now()
  );
  
  RETURN TRUE;
END;
$function$;

-- 3. Add function to get order details with audit logging
CREATE OR REPLACE FUNCTION public.get_order_details(
  order_id uuid
)
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
AS $function$
DECLARE
  current_user_id uuid;
  is_superadmin boolean;
  order_record RECORD;
BEGIN
  -- SECURITY: Verify authentication
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'PGRST';
  END IF;
  
  -- Validate order exists
  SELECT * INTO order_record
  FROM orders o
  WHERE o.id = order_id;
  
  IF order_record.id IS NULL THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'PGRST';
  END IF;
  
  -- Check authorization
  is_superadmin := has_role(current_user_id, 'superadmin'::user_role);
  
  IF order_record.customer_id != current_user_id 
     AND order_record.seller_id != current_user_id 
     AND NOT is_superadmin THEN
    RAISE EXCEPTION 'Unauthorized access to order' USING ERRCODE = 'PGRST';
  END IF;
  
  -- SECURITY: Log this access
  INSERT INTO public.order_access_logs (
    order_id,
    accessed_by,
    access_type,
    accessed_at
  ) VALUES (
    order_id,
    current_user_id,
    'detail_view',
    now()
  );
  
  -- Return order with appropriate data masking (none needed since user is authorized)
  RETURN QUERY
  SELECT 
    order_record.id,
    order_record.product_id,
    order_record.product_title,
    order_record.product_price,
    order_record.quantity,
    order_record.total_amount,
    order_record.status,
    order_record.seller_id,
    order_record.customer_id,
    order_record.created_at,
    order_record.updated_at,
    order_record.customer_name,
    order_record.customer_phone,
    order_record.delivery_location;
END;
$function$;

-- 4. Add rate limiting view to detect suspicious access patterns
CREATE OR REPLACE VIEW public.suspicious_order_access AS
SELECT 
  accessed_by,
  COUNT(*) as access_count,
  COUNT(DISTINCT order_id) as unique_orders_accessed,
  MIN(accessed_at) as first_access,
  MAX(accessed_at) as last_access,
  array_agg(DISTINCT access_type) as access_types
FROM order_access_logs
WHERE accessed_at > now() - INTERVAL '1 hour'
GROUP BY accessed_by
HAVING COUNT(*) > 50 -- Flag users accessing more than 50 orders per hour
ORDER BY access_count DESC;

-- Grant access to monitoring view
GRANT SELECT ON suspicious_order_access TO authenticated;

-- 5. Add comments for security documentation
COMMENT ON TABLE orders IS 'Contains customer orders with PII protection via RLS policies and audit logging. Customer data (name, phone, delivery_location) is considered sensitive PII and access is logged in order_access_logs.';
COMMENT ON FUNCTION get_seller_orders() IS 'Returns orders with automatic PII masking for unauthorized users and audit logging of access.';
COMMENT ON FUNCTION get_order_details(uuid) IS 'Returns single order details with strict authorization checks and audit logging.';
COMMENT ON VIEW suspicious_order_access IS 'Monitors for suspicious patterns in order access for security alerts.';