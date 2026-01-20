import { useCallback, useRef } from 'react';

// Prefetch cache to avoid duplicate prefetches
const prefetchedRoutes = new Set<string>();

// Route to lazy component mapping for prefetching
const routeComponentMap: Record<string, () => Promise<any>> = {
  '/': () => import('@/pages/Index'),
  '/marketplace': () => import('@/pages/Index'),
  '/auth': () => import('@/pages/Auth'),
  '/cart': () => import('@/pages/Cart'),
  '/favorites': () => import('@/pages/Favorites'),
  '/categories': () => import('@/pages/CategoriesPage'),
  '/flash-sales': () => import('@/pages/FlashSales'),
  '/product': () => import('@/pages/ProductDetail'),
  '/seller-dashboard': () => import('@/pages/SellerDashboard'),
  '/buyer-dashboard': () => import('@/pages/BuyerDashboard'),
  '/search': () => import('@/pages/SearchResults'),
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
      
      // Use requestIdleCallback for non-critical prefetching
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          routeComponentMap[matchingRoute]().catch(() => {
            // Silently ignore prefetch errors
            prefetchedRoutes.delete(normalizedRoute);
          });
        }, { timeout: 2000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          routeComponentMap[matchingRoute]().catch(() => {
            prefetchedRoutes.delete(normalizedRoute);
          });
        }, 100);
      }
    }
  }, []);

  const prefetchOnHover = useCallback((route: string) => {
    // Debounce prefetch to avoid unnecessary loads on quick mouse movements
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
    
    prefetchTimeoutRef.current = setTimeout(() => {
      prefetchRoute(route);
    }, 50); // Reduced from 100ms for faster response
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
  // Prefetch immediately for most common routes
  const criticalRoutes = ['/marketplace', '/cart', '/auth', '/product', '/categories'];
  
  // Use requestIdleCallback with short timeout for quick prefetch
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      criticalRoutes.forEach(route => {
        if (!prefetchedRoutes.has(route) && routeComponentMap[route]) {
          prefetchedRoutes.add(route);
          routeComponentMap[route]().catch(() => {
            prefetchedRoutes.delete(route);
          });
        }
      });
    }, { timeout: 1000 }); // Reduced from 5000ms for faster prefetch
  } else {
    // Immediate fallback
    setTimeout(() => {
      criticalRoutes.forEach(route => {
        if (!prefetchedRoutes.has(route) && routeComponentMap[route]) {
          prefetchedRoutes.add(route);
          routeComponentMap[route]().catch(() => {
            prefetchedRoutes.delete(route);
          });
        }
      });
    }, 200);
  }
}

/**
 * Check if a route has been prefetched
 */
export function isRoutePrefetched(route: string): boolean {
  const normalizedRoute = route.split('?')[0].split('#')[0];
  return prefetchedRoutes.has(normalizedRoute);
}
