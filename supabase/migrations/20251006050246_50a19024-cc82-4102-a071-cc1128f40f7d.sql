-- Fix SECURITY DEFINER view issue
-- The suspicious_order_access view doesn't need SECURITY DEFINER
-- Recreate it as a regular view with proper RLS

DROP VIEW IF EXISTS public.suspicious_order_access;

-- Create regular view (no security definer)
CREATE VIEW public.suspicious_order_access AS
SELECT 
  accessed_by,
  COUNT(*) as access_count,
  COUNT(DISTINCT order_id) as unique_orders_accessed,
  MIN(accessed_at) as first_access,
  MAX(accessed_at) as last_access,
  array_agg(DISTINCT access_type) as access_types
FROM order_access_logs
WHERE accessed_at > now() - INTERVAL '1 hour'
GROUP BY accessed_by
HAVING COUNT(*) > 50;

-- Add RLS policy for the view - only superadmins can see suspicious patterns
CREATE POLICY "Only superadmins can view suspicious access patterns"
ON order_access_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::user_role));