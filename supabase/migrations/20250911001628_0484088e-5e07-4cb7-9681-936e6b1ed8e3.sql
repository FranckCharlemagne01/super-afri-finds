-- Create user_roles table using existing user_role enum
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'buyer',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'superadmin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'seller' THEN 3
      WHEN 'buyer' THEN 4
    END
  LIMIT 1
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage non-superadmin roles" ON public.user_roles;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'));

-- Function to automatically assign buyer role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Create view for easy user management with profiles and roles
CREATE OR REPLACE VIEW public.users_with_profiles AS
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

-- Create a statistics view for admin dashboard
CREATE OR REPLACE VIEW public.admin_statistics AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'seller') as total_sellers,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'buyer') as total_buyers,
  (SELECT COUNT(*) FROM public.products WHERE is_active = true) as total_active_products,
  (SELECT COUNT(*) FROM public.orders) as total_orders,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status = 'completed') as total_revenue,
  (SELECT COUNT(*) FROM public.orders WHERE created_at >= CURRENT_DATE) as orders_today,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE) as new_users_today;

-- Allow superadmins to view all profiles, products and orders
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
CREATE POLICY "Superadmins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Superadmins can view all products" ON public.products;
CREATE POLICY "Superadmins can view all products" ON public.products
  FOR SELECT USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Superadmins can view all orders" ON public.orders;
CREATE POLICY "Superadmins can view all orders" ON public.orders
  FOR SELECT USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Superadmins can manage all products" ON public.products;
CREATE POLICY "Superadmins can manage all products" ON public.products
  FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Superadmins can manage all orders" ON public.orders;
CREATE POLICY "Superadmins can manage all orders" ON public.orders
  FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));