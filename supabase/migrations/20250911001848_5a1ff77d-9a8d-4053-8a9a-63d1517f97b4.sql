-- Create a function to assign superadmin role to a specific user (you'll need to do this manually)
-- This function can be called once to make yourself a superadmin

CREATE OR REPLACE FUNCTION public.assign_superadmin_role(_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Find user by email
  SELECT auth.users.id INTO _user_id
  FROM auth.users
  WHERE auth.users.email = _email;
  
  IF _user_id IS NULL THEN
    RETURN 'User not found with email: ' || _email;
  END IF;
  
  -- Insert or update to superadmin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'superadmin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN 'Superadmin role assigned to user: ' || _email;
END;
$$;

-- To use this function, run: SELECT public.assign_superadmin_role('your_email@example.com');

-- Add a comment to indicate this is for initial setup only
COMMENT ON FUNCTION public.assign_superadmin_role IS 'One-time function to assign superadmin role. Use: SELECT assign_superadmin_role(''your_email@example.com'');';