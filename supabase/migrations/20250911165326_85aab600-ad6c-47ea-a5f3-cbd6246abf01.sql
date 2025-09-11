-- Fix security definer view issue
-- Remove SECURITY DEFINER from get_user_role function and update the view approach

-- Drop the existing view
DROP VIEW IF EXISTS public.users_with_profiles;

-- Update the get_user_role function to remove SECURITY DEFINER
-- and make it a simple SQL function that respects RLS
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SET search_path TO 'public'
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

-- Recreate the view without SECURITY DEFINER dependencies
-- This view will now respect the RLS policies of the querying user
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
  COALESCE(ur.role, 'buyer'::user_role) AS role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id;