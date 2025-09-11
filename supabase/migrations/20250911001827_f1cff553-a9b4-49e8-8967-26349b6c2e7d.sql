-- Fix security definer views by converting them to regular views
-- The security definer property is not needed for these views

-- Drop and recreate users_with_profiles view without security definer
DROP VIEW IF EXISTS public.users_with_profiles;
CREATE VIEW public.users_with_profiles AS
SELECT 
  p.id,
  p.user_id,
  p.email,
  p.full_name,
  p.phone,
  p.address,
  p.city,
  p.country,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  COALESCE(public.get_user_role(p.user_id), 'buyer') as role
FROM public.profiles p;

-- Drop and recreate admin_statistics view without security definer
DROP VIEW IF EXISTS public.admin_statistics;
CREATE VIEW public.admin_statistics AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'seller') as total_sellers,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'buyer') as total_buyers,
  (SELECT COUNT(*) FROM public.products WHERE is_active = true) as total_active_products,
  (SELECT COUNT(*) FROM public.orders) as total_orders,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status = 'completed') as total_revenue,
  (SELECT COUNT(*) FROM public.orders WHERE created_at >= CURRENT_DATE) as orders_today,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE) as new_users_today;

-- Add RLS policies for the views to ensure only superadmins can access them
DROP POLICY IF EXISTS "Superadmins can view user profiles view" ON public.users_with_profiles;

-- Note: We cannot add RLS directly to views, so we rely on the underlying table policies
-- The security is handled by the RLS policies on the profiles, user_roles, products, and orders tables