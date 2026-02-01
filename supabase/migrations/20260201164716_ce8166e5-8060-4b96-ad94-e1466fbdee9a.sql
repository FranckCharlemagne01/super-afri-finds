-- Part 2: Create business tables and functions (after enum values are committed)

-- Create business_commissions table for tracking marketplace commissions
CREATE TABLE IF NOT EXISTS public.business_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  order_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.05,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Create business_config table for global business settings
CREATE TABLE IF NOT EXISTS public.business_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default business configurations
INSERT INTO public.business_config (config_key, config_value, description) VALUES
  ('commission_rate', '{"default": 0.05, "premium": 0.03}', 'Taux de commission marketplace'),
  ('subscription_prices', '{"basic": 5000, "premium": 15000, "enterprise": 50000}', 'Prix des abonnements vendeurs'),
  ('delivery_fees', '{"abidjan": 1500, "cote_ivoire": 3000, "international": 10000}', 'Frais de livraison par zone'),
  ('boost_prices', '{"1_day": 500, "7_days": 2500, "30_days": 8000}', 'Prix des boosts produits')
ON CONFLICT (config_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.business_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_commissions
CREATE POLICY "Business admins can view all commissions"
ON public.business_commissions FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::user_role) OR
  has_role(auth.uid(), 'super_admin_business'::user_role) OR
  has_role(auth.uid(), 'admin_finance'::user_role)
);

CREATE POLICY "Sellers can view their own commissions"
ON public.business_commissions FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Finance admins can update commissions"
ON public.business_commissions FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin'::user_role) OR
  has_role(auth.uid(), 'super_admin_business'::user_role) OR
  has_role(auth.uid(), 'admin_finance'::user_role)
);

CREATE POLICY "Finance admins can insert commissions"
ON public.business_commissions FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::user_role) OR
  has_role(auth.uid(), 'super_admin_business'::user_role) OR
  has_role(auth.uid(), 'admin_finance'::user_role)
);

-- RLS Policies for business_config
CREATE POLICY "Business admins can view config"
ON public.business_config FOR SELECT
USING (
  has_role(auth.uid(), 'superadmin'::user_role) OR
  has_role(auth.uid(), 'super_admin_business'::user_role)
);

CREATE POLICY "Only super admin business can update config"
ON public.business_config FOR UPDATE
USING (
  has_role(auth.uid(), 'superadmin'::user_role) OR
  has_role(auth.uid(), 'super_admin_business'::user_role)
);

-- Create function to check business admin access
CREATE OR REPLACE FUNCTION public.has_business_admin_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('superadmin', 'super_admin_business', 'admin_finance', 'admin_vendeurs', 'admin_marketing')
  );
$$;

-- Create function to get business dashboard stats
CREATE OR REPLACE FUNCTION public.get_business_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  today DATE := CURRENT_DATE;
  week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
  month_ago DATE := CURRENT_DATE - INTERVAL '30 days';
BEGIN
  IF NOT has_business_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Business admin role required';
  END IF;

  SELECT json_build_object(
    'total_revenue', COALESCE((SELECT SUM(total_amount) FROM orders WHERE status IN ('completed', 'delivered')), 0),
    'revenue_today', COALESCE((SELECT SUM(total_amount) FROM orders WHERE status IN ('completed', 'delivered') AND created_at::date = today), 0),
    'revenue_week', COALESCE((SELECT SUM(total_amount) FROM orders WHERE status IN ('completed', 'delivered') AND created_at::date >= week_ago), 0),
    'revenue_month', COALESCE((SELECT SUM(total_amount) FROM orders WHERE status IN ('completed', 'delivered') AND created_at::date >= month_ago), 0),
    'total_commissions', COALESCE((SELECT SUM(total_amount) * 0.05 FROM orders WHERE status IN ('completed', 'delivered')), 0),
    'commissions_month', COALESCE((SELECT SUM(total_amount) * 0.05 FROM orders WHERE status IN ('completed', 'delivered') AND created_at::date >= month_ago), 0),
    'total_orders', COALESCE((SELECT COUNT(*) FROM orders), 0),
    'orders_today', COALESCE((SELECT COUNT(*) FROM orders WHERE created_at::date = today), 0),
    'orders_week', COALESCE((SELECT COUNT(*) FROM orders WHERE created_at::date >= week_ago), 0),
    'orders_month', COALESCE((SELECT COUNT(*) FROM orders WHERE created_at::date >= month_ago), 0),
    'orders_pending', COALESCE((SELECT COUNT(*) FROM orders WHERE status = 'pending'), 0),
    'orders_delivered', COALESCE((SELECT COUNT(*) FROM orders WHERE status IN ('completed', 'delivered')), 0),
    'orders_cancelled', COALESCE((SELECT COUNT(*) FROM orders WHERE status = 'cancelled'), 0),
    'total_shops', COALESCE((SELECT COUNT(*) FROM seller_shops WHERE is_active = true), 0),
    'shops_with_subscription', COALESCE((SELECT COUNT(*) FROM seller_shops WHERE subscription_active = true), 0),
    'new_shops_month', COALESCE((SELECT COUNT(*) FROM seller_shops WHERE created_at::date >= month_ago), 0),
    'total_customers', COALESCE((SELECT COUNT(DISTINCT customer_id) FROM orders), 0),
    'active_customers_month', COALESCE((SELECT COUNT(DISTINCT customer_id) FROM orders WHERE created_at::date >= month_ago), 0),
    'average_order_value', COALESCE((SELECT AVG(total_amount) FROM orders WHERE status IN ('completed', 'delivered')), 0),
    'total_products', COALESCE((SELECT COUNT(*) FROM products WHERE is_active = true), 0),
    'boosted_products', COALESCE((SELECT COUNT(*) FROM products WHERE is_boosted = true AND boosted_until > now()), 0),
    'token_revenue', COALESCE((SELECT SUM(price_paid) FROM token_transactions WHERE status = 'completed'), 0),
    'subscription_revenue', COALESCE((SELECT SUM(amount) FROM subscriptions WHERE status = 'active'), 0),
    'total_visitors', COALESCE((SELECT COUNT(DISTINCT visitor_id) FROM site_visits), 0),
    'visitors_today', COALESCE((SELECT COUNT(DISTINCT visitor_id) FROM site_visits WHERE visit_date::date = today), 0),
    'visitors_month', COALESCE((SELECT COUNT(DISTINCT visitor_id) FROM site_visits WHERE visit_date::date >= month_ago), 0)
  ) INTO result;

  RETURN result;
END;
$$;

-- Create function to get revenue chart data
CREATE OR REPLACE FUNCTION public.get_business_revenue_chart(_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT has_business_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Business admin role required';
  END IF;

  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT 
      d.date::date as date,
      COALESCE(SUM(o.total_amount), 0) as revenue,
      COALESCE(COUNT(o.id), 0) as orders,
      COALESCE(SUM(o.total_amount) * 0.05, 0) as commissions
    FROM generate_series(
      CURRENT_DATE - (_days || ' days')::interval,
      CURRENT_DATE,
      '1 day'
    ) d(date)
    LEFT JOIN orders o ON o.created_at::date = d.date AND o.status IN ('completed', 'delivered')
    GROUP BY d.date
    ORDER BY d.date
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Create function to get top performing shops
CREATE OR REPLACE FUNCTION public.get_top_performing_shops(_limit INTEGER DEFAULT 10)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT has_business_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Business admin role required';
  END IF;

  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT 
      s.id,
      s.shop_name,
      s.logo_url,
      s.is_active,
      s.subscription_active,
      COALESCE(SUM(o.total_amount), 0) as total_revenue,
      COALESCE(COUNT(o.id), 0) as total_orders,
      COALESCE(COUNT(DISTINCT p.id), 0) as total_products
    FROM seller_shops s
    LEFT JOIN products p ON p.shop_id = s.id AND p.is_active = true
    LEFT JOIN orders o ON o.seller_id = s.seller_id AND o.status IN ('completed', 'delivered')
    WHERE s.is_active = true
    GROUP BY s.id, s.shop_name, s.logo_url, s.is_active, s.subscription_active
    ORDER BY total_revenue DESC
    LIMIT _limit
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Create function to get top selling products
CREATE OR REPLACE FUNCTION public.get_top_selling_products(_limit INTEGER DEFAULT 10)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT has_business_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Business admin role required';
  END IF;

  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT 
      p.id,
      p.title,
      p.price,
      p.category,
      p.images[1] as image,
      COALESCE(COUNT(o.id), 0) as total_sales,
      COALESCE(SUM(o.total_amount), 0) as total_revenue
    FROM products p
    LEFT JOIN orders o ON o.product_id = p.id AND o.status IN ('completed', 'delivered')
    WHERE p.is_active = true
    GROUP BY p.id, p.title, p.price, p.category, p.images
    ORDER BY total_sales DESC
    LIMIT _limit
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Create function to get category performance
CREATE OR REPLACE FUNCTION public.get_category_performance()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT has_business_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Business admin role required';
  END IF;

  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT 
      p.category,
      COUNT(DISTINCT p.id) as product_count,
      COALESCE(COUNT(o.id), 0) as order_count,
      COALESCE(SUM(o.total_amount), 0) as revenue
    FROM products p
    LEFT JOIN orders o ON o.product_id = p.id AND o.status IN ('completed', 'delivered')
    WHERE p.is_active = true
    GROUP BY p.category
    ORDER BY revenue DESC
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;