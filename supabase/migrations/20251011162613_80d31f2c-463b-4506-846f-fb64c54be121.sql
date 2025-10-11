-- Fix for: Order Access Logs Missing Write Protection
-- Add RLS policy to prevent direct INSERT operations on order_access_logs
-- Only SECURITY DEFINER functions should be able to write audit logs

CREATE POLICY "Prevent direct audit log insertion"
ON order_access_logs FOR INSERT
WITH CHECK (false);

-- Add additional protection: prevent UPDATE and DELETE on audit logs
-- Audit logs should be immutable once written
CREATE POLICY "Prevent audit log modification"
ON order_access_logs FOR UPDATE
WITH CHECK (false);

CREATE POLICY "Prevent audit log deletion"
ON order_access_logs FOR DELETE
USING (false);