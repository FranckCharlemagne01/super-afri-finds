-- ============================================================================
-- SECURITY FIX: Strengthen user_security_settings RLS Policies
-- Prevents any possibility of 2FA secrets being exposed to unauthorized users
-- ============================================================================

-- Step 1: Add table comment explaining the security model
COMMENT ON TABLE public.user_security_settings IS 
'CRITICAL SECURITY TABLE: Contains TOTP secrets, backup codes, and 2FA settings. 
RLS policies MUST ensure users can ONLY access their own security settings.
Any exposure could allow attackers to bypass 2FA completely.';

-- Step 2: Drop existing RLS policies to recreate them with stricter checks
DROP POLICY IF EXISTS "Users can view their own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can insert their own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can update their own security settings" ON public.user_security_settings;

-- Step 3: Create bulletproof RLS policies with strict authentication checks

-- DENY all access to unauthenticated users (critical security layer)
CREATE POLICY "Deny unauthenticated access to 2FA settings"
ON public.user_security_settings
FOR ALL
TO anon
USING (false);

-- SELECT: Users can ONLY view their own security settings
-- This policy includes multiple security checks to prevent any bypass
CREATE POLICY "Users can view only their own 2FA settings"
ON public.user_security_settings
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

-- INSERT: Users can ONLY insert their own security settings during 2FA setup
CREATE POLICY "Users can create only their own 2FA settings"
ON public.user_security_settings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
  -- Prevent inserting for other users
  AND user_id = auth.uid()
);

-- UPDATE: Users can ONLY update their own security settings
-- Prevent modification of user_id to prevent privilege escalation
CREATE POLICY "Users can update only their own 2FA settings"
ON public.user_security_settings
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
  -- CRITICAL: Prevent user_id from being changed
  AND user_id = auth.uid()
);

-- DELETE: Only users can delete their own 2FA settings (to disable 2FA)
CREATE POLICY "Users can delete only their own 2FA settings"
ON public.user_security_settings
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

-- Step 4: Create a security definer function for safe 2FA validation
-- This allows checking 2FA status without exposing secrets
CREATE OR REPLACE FUNCTION public.get_2fa_status(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings_record RECORD;
BEGIN
  -- SECURITY: Only allow users to check their own status
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Can only check your own 2FA status' USING ERRCODE = 'PGRST';
  END IF;

  SELECT 
    two_factor_enabled,
    failed_login_attempts,
    last_login_attempt,
    account_locked_until,
    recovery_codes_used,
    (backup_codes IS NOT NULL AND array_length(backup_codes, 1) > 0) as has_backup_codes
  INTO settings_record
  FROM public.user_security_settings
  WHERE user_id = _user_id;

  -- Return safe data without secrets
  RETURN jsonb_build_object(
    'two_factor_enabled', COALESCE(settings_record.two_factor_enabled, false),
    'failed_login_attempts', COALESCE(settings_record.failed_login_attempts, 0),
    'last_login_attempt', settings_record.last_login_attempt,
    'account_locked_until', settings_record.account_locked_until,
    'recovery_codes_used', COALESCE(settings_record.recovery_codes_used, 0),
    'has_backup_codes', COALESCE(settings_record.has_backup_codes, false),
    'is_locked', (settings_record.account_locked_until IS NOT NULL AND settings_record.account_locked_until > now())
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_2fa_status(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_2fa_status IS 
'Safely retrieves 2FA status without exposing secrets (TOTP secret, backup codes).
Users can ONLY check their own 2FA status.';

-- Step 5: Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id 
ON public.user_security_settings(user_id);

-- Step 6: Ensure user_id is NOT NULL (critical security requirement)
ALTER TABLE public.user_security_settings 
ALTER COLUMN user_id SET NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ 2FA Security Settings table hardened successfully';
  RAISE NOTICE '✅ RLS policies now prevent ANY unauthorized access to TOTP secrets';
  RAISE NOTICE '✅ New function get_2fa_status() provides safe status checks';
  RAISE NOTICE '⚠️  IMPORTANT: Use get_2fa_status() function instead of direct SELECT queries';
END $$;