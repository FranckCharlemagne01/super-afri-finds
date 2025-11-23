-- Security Fix: Add NULL checks to SECURITY DEFINER functions
-- This prevents bypassing authentication by ensuring all privileged functions verify user authentication

-- Fix has_role function to explicitly check for NULL
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_record RECORD;
BEGIN
  -- SECURITY: Explicitly verify authentication
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Hierarchy: superadmin > admin > seller > buyer
  -- If the user has a higher role, they implicitly have lower roles
  FOR user_role_record IN 
    SELECT role 
    FROM user_roles 
    WHERE user_id = _user_id
  LOOP
    -- Check exact match first
    IF user_role_record.role = _role THEN
      RETURN TRUE;
    END IF;
    
    -- Check hierarchy
    IF _role = 'buyer' THEN
      -- Everyone is at least a buyer
      RETURN TRUE;
    ELSIF _role = 'seller' AND user_role_record.role IN ('seller', 'admin', 'superadmin') THEN
      RETURN TRUE;
    ELSIF _role = 'admin' AND user_role_record.role IN ('admin', 'superadmin') THEN
      RETURN TRUE;
    ELSIF _role = 'superadmin' AND user_role_record.role = 'superadmin' THEN
      RETURN TRUE;
    END IF;
  END LOOP;
  
  -- Default: user is a buyer if they have auth
  IF _role = 'buyer' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Fix get_user_role to add explicit NULL check
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result user_role;
BEGIN
  -- SECURITY: Explicitly verify authentication
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  SELECT role INTO result
  FROM user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'superadmin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'seller' THEN 3
      WHEN 'buyer' THEN 4
    END
  LIMIT 1;
  
  RETURN COALESCE(result, 'buyer');
END;
$$;

-- Security Fix: Add message content length constraint
-- Prevents storage exhaustion and performance degradation from extremely long messages
ALTER TABLE public.messages 
ADD CONSTRAINT message_content_length_check 
CHECK (char_length(content) <= 5000);

COMMENT ON CONSTRAINT message_content_length_check ON public.messages IS 
'Security: Prevents storage exhaustion and DoS attacks via extremely long messages. Maximum 5000 characters per message.';

-- Security Fix: Add rate limiting policy for messages
-- Prevents spam by limiting users to 50 messages per hour
CREATE POLICY "Rate limit messages per hour"
ON public.messages
FOR INSERT
WITH CHECK (
  (SELECT COUNT(*) 
   FROM messages 
   WHERE sender_id = auth.uid() 
   AND created_at > now() - interval '1 hour') < 50
);