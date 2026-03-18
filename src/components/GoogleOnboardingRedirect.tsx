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

    // Don't redirect if already on the complete-profile or auth/callback pages
    const exemptPaths = ['/auth/complete-profile', '/auth/callback'];
    if (exemptPaths.some(p => location.pathname.startsWith(p))) return;

    console.log('[GoogleOnboardingRedirect] Google user with incomplete profile detected, redirecting to complete-profile');
    navigate('/auth/complete-profile', { replace: true });
  }, [user, authLoading, profileStatus.isLoading, profileStatus.needsOnboarding, location.pathname, navigate]);

  // Block rendering while checking for Google users that need onboarding
  if (!authLoading && !profileStatus.isLoading && user && profileStatus.needsOnboarding) {
    const exemptPaths = ['/auth/complete-profile', '/auth/callback'];
    if (!exemptPaths.some(p => location.pathname.startsWith(p))) {
      return (
        <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      );
    }
  }

  return null;
};
