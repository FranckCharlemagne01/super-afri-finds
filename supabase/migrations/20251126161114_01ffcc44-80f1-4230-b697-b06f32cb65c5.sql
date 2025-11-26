-- Create site_visits table for tracking unique visitors
CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL, -- user_id or anonymous cookie
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_first_visit BOOLEAN NOT NULL DEFAULT true,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_site_visits_visitor_id ON public.site_visits(visitor_id);
CREATE INDEX idx_site_visits_user_id ON public.site_visits(user_id);
CREATE INDEX idx_site_visits_date ON public.site_visits(visit_date DESC);
CREATE INDEX idx_site_visits_first_visit ON public.site_visits(is_first_visit) WHERE is_first_visit = true;

-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view visitor data
CREATE POLICY "Superadmins can view all visits"
  ON public.site_visits
  FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::user_role));

-- Allow anonymous inserts for tracking (will be handled by edge function or client)
CREATE POLICY "Anyone can insert visit records"
  ON public.site_visits
  FOR INSERT
  WITH CHECK (true);

-- Function to get visitor statistics
CREATE OR REPLACE FUNCTION public.get_visitor_statistics()
RETURNS TABLE(
  total_unique_visitors BIGINT,
  new_visitors_24h BIGINT,
  new_visitors_7d BIGINT,
  total_visits_today BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow superadmins to access visitor statistics
  SELECT 
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT COUNT(DISTINCT visitor_id) FROM site_visits)
      ELSE NULL
    END::bigint as total_unique_visitors,
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT COUNT(DISTINCT visitor_id) FROM site_visits 
         WHERE is_first_visit = true 
         AND visit_date >= now() - INTERVAL '24 hours')
      ELSE NULL
    END::bigint as new_visitors_24h,
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT COUNT(DISTINCT visitor_id) FROM site_visits 
         WHERE is_first_visit = true 
         AND visit_date >= now() - INTERVAL '7 days')
      ELSE NULL
    END::bigint as new_visitors_7d,
    CASE 
      WHEN has_role(auth.uid(), 'superadmin'::user_role) THEN
        (SELECT COUNT(*) FROM site_visits 
         WHERE visit_date >= CURRENT_DATE)
      ELSE NULL
    END::bigint as total_visits_today;
$$;