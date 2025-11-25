-- Security Fix: Add rate limiting for message spam prevention
-- Limit users to 50 messages per hour

DROP POLICY IF EXISTS "Rate limit messages per hour" ON public.messages;

CREATE POLICY "Rate limit messages per hour"
ON public.messages 
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT COUNT(*) 
   FROM public.messages 
   WHERE sender_id = auth.uid() 
   AND created_at > now() - interval '1 hour') < 50
);

-- Security Fix: Update has_role function with NULL checks
-- Prevents potential bypass via NULL user_id

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- SECURITY: Explicit NULL check to prevent auth bypass
  SELECT CASE 
    WHEN _user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
  END
$$;

-- Security Fix: Update get_user_role function with NULL checks
-- Returns NULL for unauthenticated requests instead of random role

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- SECURITY: Explicit NULL check to prevent unauthorized role assignment
  SELECT CASE
    WHEN _user_id IS NULL THEN NULL
    ELSE (
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
    )
  END
$$;