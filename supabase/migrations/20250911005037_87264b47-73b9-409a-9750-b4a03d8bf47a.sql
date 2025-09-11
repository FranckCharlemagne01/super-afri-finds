-- Drop the existing admin_statistics view
DROP VIEW IF EXISTS public.admin_statistics;

-- Create a security definer function that returns admin statistics
-- This function will only execute if the user has superadmin role
CREATE OR REPLACE FUNCTION public.get_admin_statistics()
RETURNS TABLE (
  total_users bigint,
  total_sellers bigint, 
  total_buyers bigint,
  total_active_products bigint,
  total_orders bigint,
  total_revenue numeric,
  orders_today bigint,
  new_users_today bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Only allow superadmins to access this data
  SELECT 
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT count(*) FROM profiles)
      ELSE NULL
    END::bigint,
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT count(*) FROM user_roles WHERE role = 'seller'::user_role)
      ELSE NULL
    END::bigint,
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT count(*) FROM user_roles WHERE role = 'buyer'::user_role)
      ELSE NULL
    END::bigint,
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT count(*) FROM products WHERE is_active = true)
      ELSE NULL
    END::bigint,
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT count(*) FROM orders)
      ELSE NULL
    END::bigint,
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT COALESCE(sum(total_amount), 0::numeric) FROM orders WHERE status = 'completed')
      ELSE NULL
    END::numeric,
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT count(*) FROM orders WHERE created_at >= CURRENT_DATE)
      ELSE NULL
    END::bigint,
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT count(*) FROM profiles WHERE created_at >= CURRENT_DATE)
      ELSE NULL
    END::bigint
$$;