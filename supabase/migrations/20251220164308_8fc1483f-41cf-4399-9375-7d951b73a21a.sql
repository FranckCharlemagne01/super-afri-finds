-- Drop existing public view policy and recreate with image requirement
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

-- Create strict policy: only products with valid images are visible publicly
CREATE POLICY "Public can view active products with images"
ON public.products
FOR SELECT
USING (
  is_active = true 
  AND is_sold = false
  AND images IS NOT NULL 
  AND array_length(images, 1) > 0
);

-- Update insert policy to require at least one image
DROP POLICY IF EXISTS "Sellers can insert products with trial, subscription, or tokens" ON public.products;

CREATE POLICY "Sellers can insert products with images and valid subscription"
ON public.products
FOR INSERT
WITH CHECK (
  auth.uid() = seller_id 
  AND can_insert_products(auth.uid())
  AND images IS NOT NULL 
  AND array_length(images, 1) > 0
);

-- Deactivate existing products without valid images
UPDATE public.products 
SET is_active = false 
WHERE images IS NULL 
   OR array_length(images, 1) IS NULL 
   OR array_length(images, 1) = 0;