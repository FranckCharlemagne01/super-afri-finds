-- ============================================
-- SECURITY FIX: Fix Security Definer View Warning
-- ============================================

-- Drop the security definer view and create a secure function instead
DROP VIEW IF EXISTS public.suspicious_order_access;

-- Create a secure function to check for suspicious order access patterns
-- Only accessible by superadmins
CREATE OR REPLACE FUNCTION public.get_suspicious_order_access()
RETURNS TABLE(
  accessed_by uuid,
  access_count bigint,
  unique_orders_accessed bigint,
  first_access timestamp with time zone,
  last_access timestamp with time zone,
  access_types text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- SECURITY: Only allow superadmins to view audit logs
  SELECT 
    accessed_by,
    COUNT(*)::bigint as access_count,
    COUNT(DISTINCT order_id)::bigint as unique_orders_accessed,
    MIN(accessed_at) as first_access,
    MAX(accessed_at) as last_access,
    array_agg(DISTINCT access_type) as access_types
  FROM order_access_logs
  WHERE accessed_at > now() - INTERVAL '1 hour'
    AND has_role(auth.uid(), 'superadmin'::user_role)
  GROUP BY accessed_by
  HAVING COUNT(*) > 50
  ORDER BY access_count DESC;
$$;

COMMENT ON FUNCTION public.get_suspicious_order_access() IS 'Returns suspicious order access patterns for security monitoring. Only accessible by superadmins.';