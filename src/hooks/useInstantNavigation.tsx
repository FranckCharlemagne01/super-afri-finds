/**
 * Ultra-optimized instant navigation system
 * - Prevents ANY loading state during navigation
 * - Caches route components on hover
 * - Prefetches data before navigation
 * - Auto-prefetches critical routes on app load
 */

import { useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prefetchProduct, getCachedProduct } from '@/hooks/useProductCache';
import { prefetchSellerDashboard, prefetchBuyerDashboard, isDashboardCached } from '@/hooks/useDashboardPrefetch';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';

// Track prefetched routes to avoid duplicate calls
const prefetchedRoutes = new Set<string>();
const prefetchedProducts = new Set<string>();

/**
 * Main hook for instant, glitch-free navigation
 */
export function useInstantNavigation() {
  const navigate = useNavigate();
  const { userId, isAuthenticated } = useStableAuth();
  const { isSeller, isSuperAdmin } = useStableRole();
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPrefetchedDashboard = useRef(false);

  // Get the correct dashboard path based on role
  const dashboardPath = useMemo(() => {
    if (isSuperAdmin) return '/superadmin';
    if (isSeller) return '/seller-dashboard';
    return '/buyer-dashboard';
  }, [isSeller, isSuperAdmin]);

  // ✅ Auto-prefetch dashboard when authenticated (for instant access later)
  useEffect(() => {
    if (!userId || !isAuthenticated || hasPrefetchedDashboard.current) return;
    
    hasPrefetchedDashboard.current = true;
    
    const prefetch = () => {
      if (!isDashboardCached(userId, isSeller)) {
        if (isSeller || isSuperAdmin) {
          prefetchSellerDashboard(userId);
        } else {
          prefetchBuyerDashboard(userId);
        }
      }
      prefetchedRoutes.add(dashboardPath);
    };
    
    // Delay prefetch to not block initial render
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetch, { timeout: 3000 });
    } else {
      setTimeout(prefetch, 1000);
    }
  }, [userId, isAuthenticated, isSeller, isSuperAdmin, dashboardPath]);

  // Prefetch product on hover (50ms delay to avoid over-fetching)
  const prefetchProductOnHover = useCallback((productId: string) => {
    if (prefetchedProducts.has(productId)) return;
    
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }

    touchTimeoutRef.current = setTimeout(() => {
      if (!getCachedProduct(productId)) {
        prefetchProduct(productId);
      }
      prefetchedProducts.add(productId);
    }, 50);
  }, []);

  // Instant navigation to product (data already cached)
  const navigateToProduct = useCallback((productId: string) => {
    // Prefetch immediately if not cached
    if (!getCachedProduct(productId)) {
      prefetchProduct(productId);
    }
    navigate(`/product/${productId}`);
  }, [navigate]);

  // Prefetch dashboard on hover
  const prefetchDashboardOnHover = useCallback(() => {
    if (!userId || !isAuthenticated) return;
    if (prefetchedRoutes.has(dashboardPath)) return;

    if (isSeller || isSuperAdmin) {
      prefetchSellerDashboard(userId);
    } else {
      prefetchBuyerDashboard(userId);
    }
    prefetchedRoutes.add(dashboardPath);
  }, [userId, isAuthenticated, isSeller, isSuperAdmin, dashboardPath]);

  // Instant navigation to dashboard
  const navigateToDashboard = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Start prefetch if not already done
    if (!isDashboardCached(userId!, isSeller)) {
      if (isSeller || isSuperAdmin) {
        prefetchSellerDashboard(userId!);
      } else {
        prefetchBuyerDashboard(userId!);
      }
    }

    navigate(dashboardPath);
  }, [isAuthenticated, userId, isSeller, isSuperAdmin, dashboardPath, navigate]);

  // Generic instant navigation with prefetch support
  const instantNavigate = useCallback((path: string, options?: { prefetch?: () => void }) => {
    if (options?.prefetch) {
      options.prefetch();
    }
    navigate(path);
  }, [navigate]);

  // Cancel pending prefetch on unmount or navigation
  const cancelPrefetch = useCallback(() => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
  }, []);

  return {
    // Navigation
    navigateToProduct,
    navigateToDashboard,
    instantNavigate,
    dashboardPath,
    
    // Prefetching
    prefetchProductOnHover,
    prefetchDashboardOnHover,
    cancelPrefetch,
    
    // State
    isAuthenticated,
    isSeller,
    isSuperAdmin,
  };
}

/**
 * Clear all prefetch caches (call on logout)
 */
export function clearPrefetchCache(): void {
  prefetchedRoutes.clear();
  prefetchedProducts.clear();
}
