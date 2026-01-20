import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableRole } from './useStableRole';
import { useStableAuth } from './useStableAuth';
import { prefetchSellerDashboard, prefetchBuyerDashboard } from './useDashboardPrefetch';

/**
 * Smart navigation hook that routes users to the correct dashboard
 * based on their current role (seller vs buyer)
 * Eliminates hesitation/glitches when role changes
 */
export const useSmartNavigation = () => {
  const navigate = useNavigate();
  const { role, isSeller, isSuperAdmin, loading: roleLoading } = useStableRole();
  const { userId, isAuthenticated } = useStableAuth();

  // Determine the correct dashboard path based on role
  const dashboardPath = useMemo(() => {
    if (isSuperAdmin) return '/superadmin';
    if (isSeller) return '/seller-dashboard';
    return '/buyer-dashboard';
  }, [isSeller, isSuperAdmin]);

  // Navigate to the correct dashboard instantly
  const navigateToDashboard = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    // Navigate immediately to the correct dashboard
    navigate(dashboardPath);
  }, [isAuthenticated, dashboardPath, navigate]);

  // Prefetch the correct dashboard data based on role
  const prefetchDashboard = useCallback(() => {
    if (!userId) return;
    
    if (isSuperAdmin || isSeller) {
      prefetchSellerDashboard(userId);
    } else {
      prefetchBuyerDashboard(userId);
    }
  }, [userId, isSeller, isSuperAdmin]);

  return {
    dashboardPath,
    navigateToDashboard,
    prefetchDashboard,
    role,
    roleLoading,
    isSeller,
    isSuperAdmin,
    isAuthenticated
  };
};
