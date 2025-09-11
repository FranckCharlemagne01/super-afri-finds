-- Address security definer concerns while maintaining necessary functionality
-- Some SECURITY DEFINER functions are required for auth triggers and admin functions
-- We'll keep those but review and optimize where possible

-- The has_role function can be updated to be more restrictive
-- Only allow checking roles for the current user or for superadmins
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      -- Only allow checking roles for current user or if current user is superadmin
      AND (
        _user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'superadmin'
        )
      )
  )
$$;

-- Add a comment to explain why SECURITY DEFINER is needed for certain functions
COMMENT ON FUNCTION public.handle_new_user() IS 
'SECURITY DEFINER required for auth trigger to insert into profiles table';

COMMENT ON FUNCTION public.handle_new_user_role() IS 
'SECURITY DEFINER required for auth trigger to assign default buyer role';

COMMENT ON FUNCTION public.assign_superadmin_role(_email text) IS 
'SECURITY DEFINER required for admin functions to manage user roles';

COMMENT ON FUNCTION public.assign_current_user_superadmin() IS 
'SECURITY DEFINER required for initial superadmin setup';

COMMENT ON FUNCTION public.get_admin_statistics() IS 
'SECURITY DEFINER required to access admin statistics with proper authorization';

COMMENT ON FUNCTION public.has_role(_user_id uuid, _role user_role) IS 
'SECURITY DEFINER required for RLS policies with restricted access';

-- Create a more secure version of get_user_role that doesn't need SECURITY DEFINER
-- by making it only work for the current user
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role
      WHEN 'superadmin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'seller' THEN 3
      WHEN 'buyer' THEN 4
    END
  LIMIT 1
$$;