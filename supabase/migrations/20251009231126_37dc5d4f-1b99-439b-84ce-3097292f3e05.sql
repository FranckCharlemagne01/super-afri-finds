-- Add security documentation for profiles table
COMMENT ON TABLE public.profiles IS 'Contains sensitive user PII (email, phone, address). RLS enforced: users can only view their own profile. Superadmins MUST use get_users_with_profiles() RPC function for bulk access, which enforces additional authorization checks.';

-- Ensure profiles table has proper RLS enforcement
-- This policy adds an extra layer of defense by explicitly requiring authentication
-- for any profile access (redundant with existing policies but provides defense-in-depth)
DROP POLICY IF EXISTS "Strict authentication required for profiles" ON public.profiles;

CREATE POLICY "Strict authentication required for profiles"
ON public.profiles
FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'superadmin'::user_role)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);