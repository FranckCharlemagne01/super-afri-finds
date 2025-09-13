-- Add missing RLS policy for sellers to view their orders
-- This fixes the security gap where sellers couldn't access orders they're involved in
-- while maintaining proper data protection through the get_seller_orders() function

CREATE POLICY "Sellers can view their orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = seller_id);

-- Add policy for sellers to update order status (they need this for order management)
CREATE POLICY "Sellers can update order status" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = seller_id) 
WITH CHECK (auth.uid() = seller_id);