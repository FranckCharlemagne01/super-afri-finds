-- SECURITY FIX: Prevent role enumeration via has_role() function
-- This fixes the DEFINER_OR_RPC_BYPASS vulnerability where any user could
-- check if arbitrary user_ids are superadmins or have other roles

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY: Only allow checking own role OR if caller is superadmin checking others
  IF _user_id != auth.uid() THEN
    -- Check if caller is superadmin before allowing role check of others
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'superadmin'
    ) THEN
      -- Deny non-superadmins from checking others' roles
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Now perform the actual role check
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$function$;