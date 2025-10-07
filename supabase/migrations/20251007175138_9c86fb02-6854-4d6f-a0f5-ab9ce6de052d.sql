-- SECURITY FIX: Mask customer personal information in get_seller_orders function
-- This prevents sellers from harvesting customer data for misuse

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
  
  -- Return orders with strict access control and enhanced data masking
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
    -- SECURITY: Mask customer name - show only first initial + last name for sellers
    CASE 
      WHEN current_user_id = o.customer_id THEN o.customer_name
      WHEN current_user_id = o.seller_id THEN
        CASE 
          WHEN o.customer_name ~ '\s' THEN
            substring(o.customer_name from 1 for 1) || '. ' || 
            substring(o.customer_name from '.*\s(.+)$')
          ELSE substring(o.customer_name from 1 for 1) || '***'
        END
      WHEN is_superadmin THEN o.customer_name
      ELSE 'Confidentiel'
    END::TEXT as customer_name,
    -- SECURITY: Mask customer phone - show only last 4 digits for sellers
    CASE 
      WHEN current_user_id = o.customer_id THEN o.customer_phone
      WHEN current_user_id = o.seller_id THEN
        '***-***-' || right(regexp_replace(o.customer_phone, '[^0-9]', '', 'g'), 4)
      WHEN is_superadmin THEN o.customer_phone
      ELSE 'Confidentiel'
    END::TEXT as customer_phone,
    -- SECURITY: Mask delivery location - show only city/commune for sellers
    CASE 
      WHEN current_user_id = o.customer_id THEN o.delivery_location
      WHEN current_user_id = o.seller_id THEN
        split_part(o.delivery_location, ',', 1) || ' (adresse complète masquée)'
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

-- SECURITY FIX: Mask customer personal information in get_order_details function
-- This prevents sellers from harvesting customer data for misuse

CREATE OR REPLACE FUNCTION public.get_order_details(order_id uuid)
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
  
  -- Return order with enhanced data masking
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
    -- SECURITY: Mask customer name - show only first initial + last name for sellers
    CASE 
      WHEN current_user_id = order_record.customer_id THEN order_record.customer_name
      WHEN current_user_id = order_record.seller_id THEN
        CASE 
          WHEN order_record.customer_name ~ '\s' THEN
            substring(order_record.customer_name from 1 for 1) || '. ' || 
            substring(order_record.customer_name from '.*\s(.+)$')
          ELSE substring(order_record.customer_name from 1 for 1) || '***'
        END
      WHEN is_superadmin THEN order_record.customer_name
      ELSE 'Confidentiel'
    END::TEXT as customer_name,
    -- SECURITY: Mask customer phone - show only last 4 digits for sellers
    CASE 
      WHEN current_user_id = order_record.customer_id THEN order_record.customer_phone
      WHEN current_user_id = order_record.seller_id THEN
        '***-***-' || right(regexp_replace(order_record.customer_phone, '[^0-9]', '', 'g'), 4)
      WHEN is_superadmin THEN order_record.customer_phone
      ELSE 'Confidentiel'
    END::TEXT as customer_phone,
    -- SECURITY: Mask delivery location - show only city/commune for sellers
    CASE 
      WHEN current_user_id = order_record.customer_id THEN order_record.delivery_location
      WHEN current_user_id = order_record.seller_id THEN
        split_part(order_record.delivery_location, ',', 1) || ' (adresse complète masquée)'
      WHEN is_superadmin THEN order_record.delivery_location
      ELSE 'Confidentiel'
    END::TEXT as delivery_location;
END;
$function$;