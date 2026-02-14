
-- Create security_logs table for real-time security monitoring
CREATE TABLE public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  description text,
  user_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON public.security_logs(severity);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read security logs
CREATE POLICY "Only superadmins can view security logs"
ON public.security_logs
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::user_role));

-- System can insert logs (via triggers/functions)
CREATE POLICY "System can insert security logs"
ON public.security_logs
FOR INSERT
WITH CHECK (true);

-- Prevent modification/deletion of security logs
CREATE POLICY "Prevent security log modification"
ON public.security_logs
FOR UPDATE
USING (false);

CREATE POLICY "Prevent security log deletion"
ON public.security_logs
FOR DELETE
USING (false);

-- RPC to get security stats for the dashboard
CREATE OR REPLACE FUNCTION public.get_security_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result json;
  _total_logs int;
  _critical_count int;
  _warning_count int;
  _today_logins int;
  _today_failures int;
  _suspicious_ips int;
BEGIN
  -- Verify superadmin
  IF NOT has_role(auth.uid(), 'superadmin'::user_role) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT count(*) INTO _total_logs FROM security_logs WHERE created_at > now() - interval '24 hours';
  SELECT count(*) INTO _critical_count FROM security_logs WHERE severity = 'critical' AND created_at > now() - interval '7 days';
  SELECT count(*) INTO _warning_count FROM security_logs WHERE severity = 'warning' AND created_at > now() - interval '7 days';
  
  SELECT count(*) INTO _today_logins FROM security_logs 
    WHERE event_type = 'auth_success' AND created_at > now() - interval '24 hours';
  SELECT count(*) INTO _today_failures FROM security_logs 
    WHERE event_type = 'auth_failure' AND created_at > now() - interval '24 hours';
  SELECT count(DISTINCT ip_address) INTO _suspicious_ips FROM security_logs 
    WHERE severity IN ('warning', 'critical') AND ip_address IS NOT NULL AND created_at > now() - interval '7 days';

  SELECT json_build_object(
    'total_events_24h', _total_logs,
    'critical_7d', _critical_count,
    'warnings_7d', _warning_count,
    'logins_today', _today_logins,
    'failures_today', _today_failures,
    'suspicious_ips', _suspicious_ips
  ) INTO _result;

  RETURN _result;
END;
$$;

-- RPC to get recent security logs
CREATE OR REPLACE FUNCTION public.get_recent_security_logs(_limit int DEFAULT 50)
RETURNS SETOF security_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'superadmin'::user_role) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  RETURN QUERY
    SELECT * FROM security_logs
    ORDER BY created_at DESC
    LIMIT _limit;
END;
$$;
