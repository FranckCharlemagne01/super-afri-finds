-- Update the get_seller_orders function to show full customer information to sellers for order fulfillment
CREATE OR REPLACE FUNCTION public.get_seller_orders()
 RETURNS TABLE(id uuid, product_id uuid, product_title text, product_price numeric, quantity integer, total_amount numeric, status text, seller_id uuid, customer_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, customer_name text, customer_phone text, delivery_location text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Vérifier que l'utilisateur est connecté
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

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
    -- Show full customer information to sellers for order fulfillment
    CASE 
      WHEN auth.uid() = o.customer_id THEN o.customer_name
      WHEN auth.uid() = o.seller_id THEN o.customer_name  -- Full name for sellers
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN o.customer_name
      ELSE 'Confidentiel'
    END::TEXT as customer_name,
    CASE 
      WHEN auth.uid() = o.customer_id THEN o.customer_phone
      WHEN auth.uid() = o.seller_id THEN o.customer_phone  -- Full phone for sellers
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN o.customer_phone
      ELSE 'Confidentiel'
    END::TEXT as customer_phone,
    CASE 
      WHEN auth.uid() = o.customer_id THEN o.delivery_location
      WHEN auth.uid() = o.seller_id THEN o.delivery_location  -- Full address for sellers
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN o.delivery_location
      ELSE 'Confidentiel'
    END::TEXT as delivery_location
  FROM public.orders o
  WHERE 
    auth.uid() = o.customer_id 
    OR auth.uid() = o.seller_id 
    OR has_role(auth.uid(), 'superadmin'::user_role);
END;
$function$