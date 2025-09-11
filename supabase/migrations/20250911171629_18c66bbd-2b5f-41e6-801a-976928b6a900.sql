-- Fix order creation security issue
-- Add customer_id to link orders to authenticated users and secure order creation

-- Add customer_id column to orders table
ALTER TABLE public.orders ADD COLUMN customer_id uuid REFERENCES auth.users(id);

-- Update existing orders to have a customer_id (set to seller_id for existing data)
-- This is temporary for existing data - in practice, customer_id should be different from seller_id
UPDATE public.orders SET customer_id = seller_id WHERE customer_id IS NULL;

-- Make customer_id NOT NULL after setting existing data
ALTER TABLE public.orders ALTER COLUMN customer_id SET NOT NULL;

-- Drop the insecure policy that allows anyone to create orders
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

-- Create secure policy: users can only create orders for themselves
CREATE POLICY "Users can create orders for themselves" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

-- Add policy for customers to view their own orders
CREATE POLICY "Customers can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = customer_id);

-- Add policy for customers to update their own orders (for status tracking)
CREATE POLICY "Customers can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = customer_id);

-- Create index for better performance on customer_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);