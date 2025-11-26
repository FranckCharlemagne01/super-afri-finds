import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VISITOR_COOKIE_NAME = 'djassa_visitor_id';
const VISIT_TRACKED_KEY = 'djassa_visit_tracked';

/**
 * Hook to track unique visitors and their first visits
 * Uses user_id if authenticated, otherwise generates anonymous visitor_id
 */
export const useVisitorTracking = () => {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Check if visit already tracked in this session
        const sessionTracked = sessionStorage.getItem(VISIT_TRACKED_KEY);
        if (sessionTracked) {
          return;
        }

        // Get or create visitor ID
        let visitorId = getCookie(VISITOR_COOKIE_NAME);
        if (!visitorId) {
          visitorId = generateVisitorId();
          setCookie(VISITOR_COOKIE_NAME, visitorId, 365); // 1 year
        }

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || null;

        // If authenticated, use user_id as visitor_id
        const finalVisitorId = userId || visitorId;

        // Check if this is first visit for this visitor
        const { data: existingVisits } = await supabase
          .from('site_visits')
          .select('id')
          .eq('visitor_id', finalVisitorId)
          .limit(1);

        const isFirstVisit = !existingVisits || existingVisits.length === 0;

        // Record the visit
        await supabase.from('site_visits').insert({
          visitor_id: finalVisitorId,
          user_id: userId,
          is_first_visit: isFirstVisit,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });

        // Mark as tracked in this session
        sessionStorage.setItem(VISIT_TRACKED_KEY, 'true');
      } catch (error) {
        console.error('Error tracking visit:', error);
      }
    };

    trackVisit();
  }, []);
};

// Helper functions for cookie management
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function generateVisitorId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
