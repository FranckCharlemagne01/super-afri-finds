-- Create admin statistics view
CREATE OR REPLACE VIEW admin_statistics AS
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM user_roles WHERE role = 'seller') as total_sellers,
  (SELECT COUNT(*) FROM user_roles WHERE role = 'buyer') as total_buyers,
  (SELECT COUNT(*) FROM products WHERE is_active = true) as total_active_products,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed') as total_revenue,
  (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as orders_today,
  (SELECT COUNT(*) FROM auth.users WHERE DATE(created_at) = CURRENT_DATE) as new_users_today;

-- Create users with profiles view for admin dashboard
CREATE OR REPLACE VIEW users_with_profiles AS
SELECT 
  p.id,
  p.user_id,
  p.email,
  p.full_name,
  p.phone,
  p.city,
  p.country,
  p.created_at,
  COALESCE(ur.role, 'buyer') as role
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id;

-- Grant necessary permissions
GRANT SELECT ON admin_statistics TO authenticated;
GRANT SELECT ON users_with_profiles TO authenticated;

-- Add RLS policies for superadmin access
CREATE POLICY "Superadmins can view admin_statistics" ON admin_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can view users_with_profiles" ON users_with_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );