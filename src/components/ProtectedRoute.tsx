import { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'buyer' | 'seller' | 'admin' | 'superadmin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useStableAuth();
  const { role, loading: roleLoading } = useStableRole();
  const profileStatus = useProfileCompletion(user);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for auth and role to load
    if (authLoading || roleLoading || profileStatus.isLoading) return;

    // If no user, redirect to auth
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // If Google user needs onboarding, redirect to complete-profile
    // (except if already on that page)
    if (profileStatus.needsOnboarding && location.pathname !== '/auth/complete-profile') {
      console.log('[ProtectedRoute] Google user needs profile completion, redirecting...');
      navigate('/auth/complete-profile', { replace: true });
      return;
    }

    // Partners should always go to their dashboard (except if already there)
    if (role === 'partner' && location.pathname !== '/partner-dashboard') {
      navigate('/partner-dashboard', { replace: true });
      return;
    }

    // If role is required and user doesn't have it, redirect appropriately
    if (requiredRole && role !== requiredRole) {
      // Redirect superadmins to their dashboard
      if (role === 'superadmin') {
        navigate('/superadmin', { replace: true });
        return;
      }

      // Redirect sellers to seller dashboard
      if (role === 'seller' && requiredRole === 'buyer') {
        navigate('/seller-dashboard', { replace: true });
        return;
      }

      // Redirect buyers to buyer dashboard
      if (role === 'buyer' && requiredRole === 'seller') {
        navigate('/buyer-dashboard', { replace: true });
        return;
      }
    }
  }, [user, role, authLoading, roleLoading, requiredRole, navigate, profileStatus.isLoading, profileStatus.needsOnboarding, location.pathname]);

  // Show nothing while loading
  if (authLoading || roleLoading || profileStatus.isLoading) {
    return null;
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  // Don't render if Google user needs onboarding
  if (profileStatus.needsOnboarding) {
    return null;
  }

  return <>{children}</>;
};
