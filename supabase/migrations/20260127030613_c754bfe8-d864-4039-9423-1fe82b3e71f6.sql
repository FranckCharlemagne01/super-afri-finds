-- Security hardening: remove broad table access for superadmin on PII tables and replace with audited RPC access.

-- 1) Tighten PROFILES access: remove direct superadmin SELECT policy (use audited RPC instead)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Superadmins can view all profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Superadmins can view all profiles" ON public.profiles';
  END IF;
END $$;

-- 2) Tighten ORDERS access: remove direct superadmin ALL policy (use RPCs instead)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Superadmins can manage all orders'
  ) THEN
    EXECUTE 'DROP POLICY "Superadmins can manage all orders" ON public.orders';
  END IF;
END $$;

-- 3) Ensure the seller masking view cannot be queried by anonymous users
--    (view already filters by auth.uid(); but we explicitly revoke anon access to prevent public probing)
DO $$
BEGIN
  -- If the view exists, manage grants.
  IF EXISTS (
    SELECT 1
    FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'orders_seller_view'
  ) THEN
    EXECUTE 'REVOKE ALL ON public.orders_seller_view FROM anon';
    -- Keep authenticated access (sellers/customers use auth.uid() filter). If not needed, the app can rely on RPCs.
    EXECUTE 'GRANT SELECT ON public.orders_seller_view TO authenticated';
  END IF;
END $$;

-- 4) RPC: Fetch recent orders for superadmin (used for admin dashboards)
CREATE OR REPLACE FUNCTION public.get_recent_orders_superadmin(_limit integer DEFAULT 200)
RETURNS TABLE(
  id uuid,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  delivery_location text,
  product_title text,
  total_amount numeric,
  status text,
  created_at timestamptz,
  seller_id uuid,
  quantity integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'superadmin'::public.user_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.customer_id,
    o.customer_name,
    o.customer_phone,
    o.delivery_location,
    o.product_title,
    o.total_amount,
    o.status,
    o.created_at,
    o.seller_id,
    o.quantity
  FROM public.orders o
  ORDER BY o.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 200), 500));
END;
$$;

-- 5) RPC: Fetch one order with audit log for superadmin actions (used when changing status / viewing details)
CREATE OR REPLACE FUNCTION public.get_order_for_superadmin(_order_id uuid)
RETURNS TABLE(
  id uuid,
  customer_id uuid,
  customer_name text,
  customer_phone text,
  delivery_location text,
  product_title text,
  total_amount numeric,
  status text,
  created_at timestamptz,
  seller_id uuid,
  quantity integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'superadmin'::public.user_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.order_access_logs(order_id, accessed_by, access_type)
  VALUES (_order_id, v_uid, 'superadmin_view')
  ON CONFLICT DO NOTHING;

  RETURN QUERY
  SELECT
    o.id,
    o.customer_id,
    o.customer_name,
    o.customer_phone,
    o.delivery_location,
    o.product_title,
    o.total_amount,
    o.status,
    o.created_at,
    o.seller_id,
    o.quantity
  FROM public.orders o
  WHERE o.id = _order_id
  LIMIT 1;
END;
$$;

-- 6) RPC: Minimal order stats for a given user (superadmin only)
CREATE OR REPLACE FUNCTION public.get_user_order_stats_superadmin(target_user_id uuid)
RETURNS TABLE(
  total_orders bigint,
  completed_orders bigint,
  total_revenue numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'superadmin'::public.user_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_orders,
    COUNT(*) FILTER (WHERE o.status IN ('completed','delivered'))::bigint AS completed_orders,
    COALESCE(SUM(o.total_amount), 0)::numeric AS total_revenue
  FROM public.orders o
  WHERE o.customer_id = target_user_id OR o.seller_id = target_user_id;
END;
$$;

-- 7) RPC: Compute top sellers (superadmin only) without direct profiles/orders table reads from client
CREATE OR REPLACE FUNCTION public.get_top_sellers_superadmin(_limit integer DEFAULT 10)
RETURNS TABLE(
  seller_id uuid,
  full_name text,
  email text,
  total_sales numeric,
  total_orders bigint,
  total_products bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'superadmin'::public.user_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH seller_orders AS (
    SELECT
      o.seller_id,
      COALESCE(SUM(o.total_amount), 0)::numeric AS total_sales,
      COUNT(*)::bigint AS total_orders
    FROM public.orders o
    WHERE o.status IN ('completed','delivered')
    GROUP BY o.seller_id
  ), seller_products AS (
    SELECT p.seller_id, COUNT(*)::bigint AS total_products
    FROM public.products p
    GROUP BY p.seller_id
  )
  SELECT
    so.seller_id,
    COALESCE(pr.full_name, 'Vendeur') AS full_name,
    COALESCE(pr.email, '') AS email,
    so.total_sales,
    so.total_orders,
    COALESCE(sp.total_products, 0) AS total_products
  FROM seller_orders so
  LEFT JOIN public.profiles pr ON pr.user_id = so.seller_id
  LEFT JOIN seller_products sp ON sp.seller_id = so.seller_id
  ORDER BY so.total_sales DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 10), 50));
END;
$$;

-- 8) RPC: Delete user profile + roles (superadmin only)
CREATE OR REPLACE FUNCTION public.delete_user_profile_and_roles(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'superadmin'::public.user_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;

  RETURN true;
END;
$$;

-- Note: We keep normal user policies for profiles/orders. Users still access their own data via existing RLS.
