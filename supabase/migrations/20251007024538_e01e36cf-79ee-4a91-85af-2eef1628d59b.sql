-- ============================================
-- DJASSA SELLER SHOPS SYSTEM
-- ============================================

-- Create seller shops table
CREATE TABLE IF NOT EXISTS public.seller_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  shop_name TEXT NOT NULL,
  shop_slug TEXT NOT NULL UNIQUE,
  shop_description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_active BOOLEAN DEFAULT false,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  monthly_fee NUMERIC DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add shop_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.seller_shops(id) ON DELETE SET NULL;

-- Enable RLS on seller_shops
ALTER TABLE public.seller_shops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_shops

-- Everyone can view active shops
CREATE POLICY "Active shops are viewable by everyone"
ON public.seller_shops
FOR SELECT
USING (is_active = true);

-- Sellers can view their own shops (active or not)
CREATE POLICY "Sellers can view their own shops"
ON public.seller_shops
FOR SELECT
USING (auth.uid() = seller_id);

-- Sellers can create their own shop
CREATE POLICY "Sellers can create their own shop"
ON public.seller_shops
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own shop
CREATE POLICY "Sellers can update their own shop"
ON public.seller_shops
FOR UPDATE
USING (auth.uid() = seller_id);

-- Sellers can delete their own shop
CREATE POLICY "Sellers can delete their own shop"
ON public.seller_shops
FOR DELETE
USING (auth.uid() = seller_id);

-- Superadmins can manage all shops
CREATE POLICY "Superadmins can manage all shops"
ON public.seller_shops
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::user_role));

-- Create function to generate unique shop slug
CREATE OR REPLACE FUNCTION public.generate_shop_slug(shop_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(shop_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check if slug exists, if so add counter
  WHILE EXISTS (SELECT 1 FROM public.seller_shops WHERE shop_slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_seller_shops_updated_at
BEFORE UPDATE ON public.seller_shops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on shop_slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_seller_shops_slug ON public.seller_shops(shop_slug);
CREATE INDEX IF NOT EXISTS idx_seller_shops_seller_id ON public.seller_shops(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);

COMMENT ON TABLE public.seller_shops IS 'Stores seller shop information with branding and subscription details';
COMMENT ON COLUMN public.seller_shops.shop_slug IS 'Unique URL-friendly identifier for the shop';
COMMENT ON COLUMN public.seller_shops.subscription_active IS 'Whether the shop subscription is currently active';
COMMENT ON COLUMN public.seller_shops.monthly_fee IS 'Monthly subscription fee in FCFA (default 5000)';