-- =====================================================
-- SECURITY FIX: Data Masking Views & RLS Hardening
-- =====================================================

-- 1. Create secure view for products (hides seller_id, original_price, stock_quantity)
CREATE OR REPLACE VIEW public.products_public
WITH (security_invoker = on) AS
SELECT 
  id,
  title,
  description,
  price,
  CASE WHEN discount_percentage > 0 THEN discount_percentage ELSE NULL END as discount_percentage,
  category,
  images,
  badge,
  video_url,
  city,
  country,
  is_flash_sale,
  is_boosted,
  boosted_at,
  boosted_until,
  rating,
  reviews_count,
  shop_id,
  created_at,
  updated_at,
  CASE WHEN stock_quantity IS NULL OR stock_quantity > 0 THEN true ELSE false END as in_stock
FROM public.products
WHERE is_active = true AND is_sold = false;

-- 2. Create secure view for shops (hides seller_id, subscription details)
CREATE OR REPLACE VIEW public.shops_public
WITH (security_invoker = on) AS
SELECT 
  id,
  shop_name,
  shop_slug,
  shop_description,
  logo_url,
  banner_url,
  created_at,
  updated_at
FROM public.seller_shops
WHERE is_active = true;

-- 3. Fix push_subscriptions RLS - Remove NULL user access vulnerability
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.push_subscriptions;

-- Create strict authenticated-only policies
CREATE POLICY "Authenticated users can insert their subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4. Grant SELECT on views to authenticated and anon roles
GRANT SELECT ON public.products_public TO authenticated, anon;
GRANT SELECT ON public.shops_public TO authenticated, anon;