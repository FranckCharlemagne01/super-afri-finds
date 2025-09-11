-- Fix security vulnerability: Restrict order creation to authenticated users only
-- This prevents anonymous users from creating fake orders to harvest customer data

-- Drop the insecure policy that allows anyone to create orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create a new secure policy that requires authentication
CREATE POLICY "Authenticated users can create orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Ensure we also have proper policies for viewing orders
-- Keep existing seller and superadmin policies intact