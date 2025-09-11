-- Create a function to assign superadmin role to the current user for testing
-- This is a temporary function for development/testing purposes
CREATE OR REPLACE FUNCTION public.assign_current_user_superadmin()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Get current user ID
  SELECT auth.uid() INTO _user_id;
  
  IF _user_id IS NULL THEN
    RETURN 'No authenticated user found';
  END IF;
  
  -- Insert or update to superadmin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'superadmin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN 'Superadmin role assigned to current user';
END;
$$;