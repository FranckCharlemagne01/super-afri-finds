import { useCallback, useRef, useEffect } from 'react';

// Prefetch cache to avoid duplicate prefetches
const prefetchedRoutes = new Set<string>();
let criticalRoutesPrefetched = false;

// Route to lazy component mapping for prefetching
const routeComponentMap: Record<string, () => Promise<any>> = {
  '/': () => import('@/pages/Index'),
  '/marketplace': () => import('@/pages/Index'),
  '/auth': () => import('@/pages/Auth'),
  '/cart': () => import('@/pages/Cart'),
  '/favorites': () => import('@/pages/Favorites'),
  '/categories': () => import('@/pages/CategoriesPage'),
  '/category': () => import('@/pages/CategoryPage'),
  '/flash-sales': () => import('@/pages/FlashSales'),
  '/product': () => import('@/pages/ProductDetail'),
  '/boutique': () => import('@/pages/ShopPage'),
  '/seller-dashboard': () => import('@/pages/SellerDashboard'),
  '/buyer-dashboard': () => import('@/pages/BuyerDashboard'),
  '/search': () => import('@/pages/SearchResults'),
  '/superadmin': () => import('@/pages/SuperAdminDashboard'),
};

/**
 * Hook for prefetching routes on hover or visibility
 * Improves perceived performance by loading pages before navigation
 */
export function usePrefetch() {
  const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefetchRoute = useCallback((route: string) => {
    // Normalize route (remove query params and hash)
    const normalizedRoute = route.split('?')[0].split('#')[0];
    
    // Check if already prefetched
    if (prefetchedRoutes.has(normalizedRoute)) {
      return;
    }

    // Find matching route pattern
    const matchingRoute = Object.keys(routeComponentMap).find(pattern => {
      if (pattern === normalizedRoute) return true;
      if (normalizedRoute.startsWith(pattern) && pattern !== '/') return true;
      return false;
    });

    if (matchingRoute && routeComponentMap[matchingRoute]) {
      prefetchedRoutes.add(normalizedRoute);
      
      // Immediate prefetch for better UX
      routeComponentMap[matchingRoute]().catch(() => {
        prefetchedRoutes.delete(normalizedRoute);
      });
    }
  }, []);

  const prefetchOnHover = useCallback((route: string) => {
    // Instant prefetch on hover - no debounce for faster response
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
    
    // Immediate prefetch for instant navigation
    prefetchTimeoutRef.current = setTimeout(() => {
      prefetchRoute(route);
    }, 20); // Ultra-fast 20ms debounce
  }, [prefetchRoute]);

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);

  return {
    prefetchRoute,
    prefetchOnHover,
    cancelPrefetch,
  };
}

/**
 * Prefetch critical routes immediately on app load
 * Call this once in App.tsx after initial render
 */
export function prefetchCriticalRoutes() {
  // Prevent duplicate prefetch
  if (criticalRoutesPrefetched) return;
  criticalRoutesPrefetched = true;
  
  // Most critical routes - prefetch immediately
  const immediatePrefetch = ['/marketplace', '/cart', '/product', '/boutique'];
  
  // Secondary routes - prefetch in idle time
  const secondaryPrefetch = ['/auth', '/categories', '/category', '/seller-dashboard', '/buyer-dashboard'];
  
  // Immediate prefetch for critical routes
  immediatePrefetch.forEach(route => {
    if (!prefetchedRoutes.has(route) && routeComponentMap[route]) {
      prefetchedRoutes.add(route);
      routeComponentMap[route]().catch(() => {
        prefetchedRoutes.delete(route);
      });
    }
  });
  
  // Prefetch secondary routes in idle time
  const prefetchSecondary = () => {
    secondaryPrefetch.forEach(route => {
      if (!prefetchedRoutes.has(route) && routeComponentMap[route]) {
        prefetchedRoutes.add(route);
        routeComponentMap[route]().catch(() => {
          prefetchedRoutes.delete(route);
        });
      }
    });
  };
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(prefetchSecondary, { timeout: 2000 });
  } else {
    setTimeout(prefetchSecondary, 500);
  }
}

/**
 * Hook to auto-prefetch on mount - use in App.tsx
 */
export function useAutoPrefetch() {
  useEffect(() => {
    // Prefetch after first paint
    const timer = setTimeout(() => {
      prefetchCriticalRoutes();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
}

/**
 * Check if a route has been prefetched
 */
export function isRoutePrefetched(route: string): boolean {
  const normalizedRoute = route.split('?')[0].split('#')[0];
  return prefetchedRoutes.has(normalizedRoute);
}
