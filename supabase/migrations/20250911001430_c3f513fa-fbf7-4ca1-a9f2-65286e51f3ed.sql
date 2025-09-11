-- Drop the existing views
DROP VIEW IF EXISTS public.users_with_profiles;
DROP VIEW IF EXISTS public.admin_statistics;

-- Create users_with_profiles view (simpler approach)
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
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id;

-- Create admin_statistics view (simpler approach)
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