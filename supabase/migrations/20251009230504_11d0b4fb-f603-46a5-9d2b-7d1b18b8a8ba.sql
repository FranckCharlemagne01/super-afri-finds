-- Drop overly permissive SELECT policies that allow sellers to see unmasked customer data
DROP POLICY IF EXISTS "Prevent cross-seller order access" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view their orders strict" ON public.orders;

-- Keep the customer and superadmin policies as they are legitimate
-- Customers should see their full order data
-- "Customers can view own orders strict" policy remains
-- "Superadmins can manage all orders" policy remains

-- The "Sellers can update order status" UPDATE policy remains as it only checks auth.uid() = seller_id
-- which is appropriate for status updates

-- Sellers will now be REQUIRED to use the get_seller_orders() and get_order_details() 
-- security definer functions which implement proper data masking
-- This prevents direct table access that could expose customer phone numbers and addresses

-- Add a comment to document this security measure
COMMENT ON TABLE public.orders IS 'Customer PII is protected. Sellers must use get_seller_orders() or get_order_details() RPC functions to access orders with masked customer data.';