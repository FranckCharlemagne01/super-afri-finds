-- Modifier get_seller_orders pour afficher les infos complètes au vendeur
CREATE OR REPLACE FUNCTION public.get_seller_orders()
 RETURNS TABLE(id uuid, product_id uuid, product_title text, product_price numeric, quantity integer, total_amount numeric, status text, seller_id uuid, customer_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, customer_name text, customer_phone text, delivery_location text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
  
  -- Return orders with full data for sellers and their own orders
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
    -- SECURITY: Show full customer name to seller and customer themselves
    CASE 
      WHEN current_user_id = o.customer_id THEN o.customer_name
      WHEN current_user_id = o.seller_id THEN o.customer_name
      WHEN is_superadmin THEN o.customer_name
      ELSE 'Confidentiel'
    END::TEXT as customer_name,
    -- SECURITY: Show full phone to seller and customer themselves
    CASE 
      WHEN current_user_id = o.customer_id THEN o.customer_phone
      WHEN current_user_id = o.seller_id THEN o.customer_phone
      WHEN is_superadmin THEN o.customer_phone
      ELSE 'Confidentiel'
    END::TEXT as customer_phone,
    -- SECURITY: Show full delivery location to seller and customer themselves
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
END;
$function$;

-- Modifier get_order_details pour afficher les infos complètes au vendeur
CREATE OR REPLACE FUNCTION public.get_order_details(order_id uuid)
 RETURNS TABLE(id uuid, product_id uuid, product_title text, product_price numeric, quantity integer, total_amount numeric, status text, seller_id uuid, customer_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, customer_name text, customer_phone text, delivery_location text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
  
  -- Return order with full data for sellers and customers
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
    -- SECURITY: Show full customer name to seller and customer themselves
    CASE 
      WHEN current_user_id = order_record.customer_id THEN order_record.customer_name
      WHEN current_user_id = order_record.seller_id THEN order_record.customer_name
      WHEN is_superadmin THEN order_record.customer_name
      ELSE 'Confidentiel'
    END::TEXT as customer_name,
    -- SECURITY: Show full phone to seller and customer themselves
    CASE 
      WHEN current_user_id = order_record.customer_id THEN order_record.customer_phone
      WHEN current_user_id = order_record.seller_id THEN order_record.customer_phone
      WHEN is_superadmin THEN order_record.customer_phone
      ELSE 'Confidentiel'
    END::TEXT as customer_phone,
    -- SECURITY: Show full delivery location to seller and customer themselves
    CASE 
      WHEN current_user_id = order_record.customer_id THEN order_record.delivery_location
      WHEN current_user_id = order_record.seller_id THEN order_record.delivery_location
      WHEN is_superadmin THEN order_record.delivery_location
      ELSE 'Confidentiel'
    END::TEXT as delivery_location;
END;
$function$;