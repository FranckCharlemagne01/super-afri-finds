import { useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'buyer' | 'seller' | 'admin' | 'superadmin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useStableAuth();
  const { role, loading: roleLoading } = useStableRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth and role to load
    if (authLoading || roleLoading) return;

    // If no user, redirect to auth
    if (!user) {
      navigate('/auth', { replace: true });
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
  }, [user, role, authLoading, roleLoading, requiredRole, navigate]);

  // Show nothing while loading
  if (authLoading || roleLoading) {
    return null;
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  return <>{children}</>;
};
