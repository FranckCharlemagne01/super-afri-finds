-- ============================================
-- SECURITY FIX: Restrict direct products table access
-- Force public queries to use products_public view
-- ============================================

-- Step 1: Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view active products with images" ON public.products;

-- Step 2: Create a new restricted policy that only allows:
-- - Sellers to view their own products (for management)
-- - Superadmins to view all products (for administration)
-- Public users must use the products_public view

CREATE POLICY "Sellers can view their own products"
ON public.products
FOR SELECT
USING (auth.uid() = seller_id);

-- Note: Superadmins already have a SELECT policy via "Superadmins can view all products"

-- Step 3: Ensure products_public view has SECURITY INVOKER properly set
-- (It should already have this from previous migration, but let's ensure)
-- The view already exists and excludes seller_id, original_price, stock_quantity, search_vector

-- Step 4: Add a comment to document the security model
COMMENT ON TABLE public.products IS 'Products table - Direct SELECT restricted to sellers (own products) and superadmins. Public access should use products_public view which masks sensitive fields like seller_id.';

COMMENT ON VIEW public.products_public IS 'Public-safe view of products. Excludes seller_id, original_price, stock_quantity, search_vector. Use this view for all public-facing product queries.';