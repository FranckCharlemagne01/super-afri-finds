-- Remove duplicate superadmin SELECT policy since ALL command covers it
DROP POLICY IF EXISTS "Superadmins can view all orders" ON public.orders;

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Add comments to document the security model
COMMENT ON TABLE public.orders IS 'Orders table with strict RLS: customers see only their orders, sellers see only orders for their products, superadmins see all';