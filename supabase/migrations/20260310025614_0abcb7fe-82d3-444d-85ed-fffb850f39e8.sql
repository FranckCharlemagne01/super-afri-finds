
-- 1. Create seller_type enum
DO $$ BEGIN
  CREATE TYPE public.seller_type AS ENUM ('particulier', 'pro', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add seller_type column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS seller_type public.seller_type DEFAULT 'particulier';

-- 3. Add wallet_balance_fcfa to seller_tokens for FCFA-based Compte Djassa
ALTER TABLE public.seller_tokens 
ADD COLUMN IF NOT EXISTS wallet_balance_fcfa numeric DEFAULT 0 NOT NULL;

-- 4. Create product_price_tiers table for bulk/wholesale pricing
CREATE TABLE IF NOT EXISTS public.product_price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity integer NOT NULL CHECK (min_quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (product_id, min_quantity)
);

ALTER TABLE public.product_price_tiers ENABLE ROW LEVEL SECURITY;

-- RLS for product_price_tiers: anyone can view, sellers can manage their own
CREATE POLICY "Anyone can view price tiers" ON public.product_price_tiers
  FOR SELECT USING (true);

CREATE POLICY "Sellers can manage their product price tiers" ON public.product_price_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_price_tiers.product_id 
      AND products.seller_id = auth.uid()
    )
  );

-- 5. Add cancellation tracking columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS commission_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_status text DEFAULT 'none';

-- 6. Create index on product_price_tiers
CREATE INDEX IF NOT EXISTS idx_product_price_tiers_product_id ON public.product_price_tiers(product_id);

-- 7. Create function to get seller commission rate based on seller_type
CREATE OR REPLACE FUNCTION public.get_seller_commission_rate(_seller_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN p.seller_type = 'premium' THEN 5
    WHEN p.seller_type = 'pro' THEN 10
    ELSE 15
  END::numeric
  FROM public.profiles p
  WHERE p.user_id = _seller_id
  LIMIT 1;
$$;
