-- Fix security linter warnings from previous migration

-- 1. Drop the security definer view and recreate as a secure function instead
DROP VIEW IF EXISTS public.suspicious_order_access;

-- Create as a security definer function accessible only to superadmins
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
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow superadmins to access this security monitoring data
  SELECT 
    accessed_by,
    COUNT(*) as access_count,
    COUNT(DISTINCT order_id) as unique_orders_accessed,
    MIN(accessed_at) as first_access,
    MAX(accessed_at) as last_access,
    array_agg(DISTINCT access_type) as access_types
  FROM order_access_logs
  WHERE accessed_at > now() - INTERVAL '1 hour'
    AND has_role(auth.uid(), 'superadmin'::user_role) -- Only superadmins can query
  GROUP BY accessed_by
  HAVING COUNT(*) > 50 -- Flag users accessing more than 50 orders per hour
  ORDER BY access_count DESC;
$$;

-- Add documentation
COMMENT ON FUNCTION get_suspicious_order_access() IS 'Security monitoring function accessible only to superadmins. Returns users with suspicious order access patterns in the last hour.';