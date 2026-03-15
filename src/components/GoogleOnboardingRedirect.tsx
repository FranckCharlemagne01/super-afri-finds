import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

/**
 * Global component that redirects new Google users to /auth/complete-profile
 * if their profile is incomplete (missing country, city, or role).
 * Runs on every page, not just protected routes.
 */
export const GoogleOnboardingRedirect = () => {
  const { user, loading: authLoading } = useStableAuth();
  const profileStatus = useProfileCompletion(user);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || profileStatus.isLoading) return;
    if (!user) return;

    // Only redirect if Google user needs onboarding
    if (!profileStatus.needsOnboarding) return;

    // Don't redirect if already on the complete-profile or auth pages
    const exemptPaths = ['/auth/complete-profile', '/auth', '/auth/callback', '/auth/welcome'];
    if (exemptPaths.some(p => location.pathname.startsWith(p))) return;

    console.log('[GoogleOnboardingRedirect] New Google user detected, redirecting to complete-profile');
    navigate('/auth/complete-profile', { replace: true });
  }, [user, authLoading, profileStatus.isLoading, profileStatus.needsOnboarding, location.pathname, navigate]);

  return null;
};
