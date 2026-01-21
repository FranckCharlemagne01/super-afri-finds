-- =====================================================
-- SECURITY FIX: Create secure views for sensitive data
-- =====================================================

-- 1. Create a secure view for orders that masks customer PII for sellers
-- Sellers can see order details but customer contact info is partially masked
CREATE OR REPLACE VIEW public.orders_seller_view
WITH (security_invoker = on) AS
SELECT 
    o.id,
    o.created_at,
    o.updated_at,
    o.customer_id,
    -- Mask customer name: show first name only
    CASE 
        WHEN auth.uid() = o.seller_id THEN 
            SPLIT_PART(o.customer_name, ' ', 1) || ' ***'
        WHEN auth.uid() = o.customer_id OR has_role(auth.uid(), 'superadmin') THEN 
            o.customer_name
        ELSE '***'
    END AS customer_name,
    -- Mask phone: show only last 4 digits for sellers
    CASE 
        WHEN auth.uid() = o.seller_id THEN 
            '****' || RIGHT(o.customer_phone, 4)
        WHEN auth.uid() = o.customer_id OR has_role(auth.uid(), 'superadmin') THEN 
            o.customer_phone
        ELSE '****'
    END AS customer_phone,
    -- Mask delivery location: show city/area only for sellers
    CASE 
        WHEN auth.uid() = o.seller_id THEN 
            SPLIT_PART(o.delivery_location, ',', 1) || ', ***'
        WHEN auth.uid() = o.customer_id OR has_role(auth.uid(), 'superadmin') THEN 
            o.delivery_location
        ELSE '***'
    END AS delivery_location,
    o.product_id,
    o.product_title,
    o.product_price,
    o.quantity,
    o.total_amount,
    o.seller_id,
    o.status,
    o.is_confirmed_by_seller
FROM public.orders o
WHERE 
    auth.uid() = o.customer_id 
    OR auth.uid() = o.seller_id 
    OR has_role(auth.uid(), 'superadmin');

-- Grant access to authenticated users
GRANT SELECT ON public.orders_seller_view TO authenticated;

-- 2. Create a function to get full order details (for confirmed orders only)
-- This allows sellers to get full contact info ONLY after they confirm the order
CREATE OR REPLACE FUNCTION public.get_confirmed_order_details(order_id uuid)
RETURNS TABLE (
    id uuid,
    customer_name text,
    customer_phone text,
    delivery_location text,
    product_title text,
    quantity int,
    total_amount numeric,
    status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    order_record orders%ROWTYPE;
    caller_id uuid := auth.uid();
BEGIN
    -- Get the order
    SELECT * INTO order_record FROM orders o WHERE o.id = order_id;
    
    IF order_record IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    
    -- Check authorization: must be seller, customer, or superadmin
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    IF caller_id != order_record.seller_id 
       AND caller_id != order_record.customer_id 
       AND NOT has_role(caller_id, 'superadmin') THEN
        RAISE EXCEPTION 'Not authorized to view this order';
    END IF;
    
    -- For sellers: only show full details if order is confirmed
    IF caller_id = order_record.seller_id 
       AND order_record.is_confirmed_by_seller IS NOT TRUE 
       AND order_record.status NOT IN ('confirmed', 'shipped', 'delivered') THEN
        -- Return masked data
        RETURN QUERY SELECT 
            order_record.id,
            SPLIT_PART(order_record.customer_name, ' ', 1) || ' ***',
            '****' || RIGHT(order_record.customer_phone, 4),
            SPLIT_PART(order_record.delivery_location, ',', 1) || ', ***',
            order_record.product_title,
            order_record.quantity,
            order_record.total_amount,
            order_record.status;
        RETURN;
    END IF;
    
    -- Customer, superadmin, or seller with confirmed order gets full details
    RETURN QUERY SELECT 
        order_record.id,
        order_record.customer_name,
        order_record.customer_phone,
        order_record.delivery_location,
        order_record.product_title,
        order_record.quantity,
        order_record.total_amount,
        order_record.status;
END;
$$;

-- 3. Add a comment explaining the security model
COMMENT ON VIEW public.orders_seller_view IS 
'Secure view that masks customer PII for sellers until order is confirmed. 
Customers and superadmins see full details. Use get_confirmed_order_details() for full access after confirmation.';

-- 4. Update profiles table RLS to add extra logging for superadmin access
-- (The current policy is acceptable but we add audit capability)
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_at timestamptz NOT NULL DEFAULT now(),
    accessed_by uuid NOT NULL,
    profile_id uuid NOT NULL,
    access_type text NOT NULL,
    ip_address text,
    user_agent text
);

-- Enable RLS on access logs
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view access logs
CREATE POLICY "Only superadmins can view profile access logs"
ON public.profile_access_logs FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

-- System can insert logs
CREATE POLICY "System can insert profile access logs"
ON public.profile_access_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to log and retrieve profiles for superadmins
CREATE OR REPLACE FUNCTION public.get_profile_with_audit(target_user_id uuid)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result profiles%ROWTYPE;
    caller_id uuid := auth.uid();
BEGIN
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Get the profile
    SELECT * INTO result FROM profiles WHERE user_id = target_user_id;
    
    IF result IS NULL THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;
    
    -- If accessing another user's profile as superadmin, log it
    IF caller_id != target_user_id AND has_role(caller_id, 'superadmin') THEN
        INSERT INTO profile_access_logs (accessed_by, profile_id, access_type)
        VALUES (caller_id, result.id, 'superadmin_view');
    END IF;
    
    -- Check authorization
    IF caller_id != target_user_id AND NOT has_role(caller_id, 'superadmin') THEN
        RAISE EXCEPTION 'Not authorized to view this profile';
    END IF;
    
    RETURN result;
END;
$$;