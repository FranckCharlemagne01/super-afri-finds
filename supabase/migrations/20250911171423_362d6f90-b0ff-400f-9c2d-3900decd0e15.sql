-- Fix Security Definer View issue by removing the problematic view
-- and updating code to use secure table queries instead

-- Drop the users_with_profiles view as it bypasses RLS policies
DROP VIEW IF EXISTS public.users_with_profiles;

-- Create a secure function for superadmins to get user profiles with roles
-- This replaces the view functionality but with proper authorization
CREATE OR REPLACE FUNCTION public.get_users_with_profiles()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  phone text,
  address text,
  city text,
  country text,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  role user_role
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Only allow superadmins to access this data
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
    COALESCE(ur.role, 'buyer'::user_role) AS role
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE has_role(auth.uid(), 'superadmin'::user_role);
$$;

-- Add comment explaining the security requirement
COMMENT ON FUNCTION public.get_users_with_profiles() IS 
'SECURITY DEFINER required for superadmin access to user profiles with roles - includes authorization check';