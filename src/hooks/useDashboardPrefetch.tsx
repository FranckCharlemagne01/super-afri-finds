/**
 * Dashboard Prefetch System
 * Preloads seller/buyer dashboard data immediately after login
 * Enables instant dashboard access without loading screens
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setCache, getCached, CACHE_KEYS } from '@/utils/dataCache';

// Track prefetch status globally to avoid duplicate fetches
const prefetchStatus = {
  seller: new Map<string, boolean>(),
  buyer: new Map<string, boolean>(),
  inProgress: new Set<string>(),
  lastPrefetch: 0,
};

// Minimum interval between prefetches (prevent rapid re-fetching)
const MIN_PREFETCH_INTERVAL = 5000; // 5 seconds

/**
 * Prefetch seller dashboard data in background
 * Call this immediately after detecting seller role
 */
export async function prefetchSellerDashboard(userId: string): Promise<void> {
  if (!userId) return;
  
  // Check if recently prefetched
  const now = Date.now();
  if (prefetchStatus.seller.get(userId) && now - prefetchStatus.lastPrefetch < MIN_PREFETCH_INTERVAL) {
    return;
  }
  
  const prefetchKey = `seller:${userId}`;
  if (prefetchStatus.inProgress.has(prefetchKey)) return;
  
  prefetchStatus.inProgress.add(prefetchKey);
  prefetchStatus.lastPrefetch = now;
  
  try {
    console.log('[DashboardPrefetch] 🚀 Prefetching seller dashboard data...');
    
    // Parallel fetch of all critical seller data
    const [shopResult, productsResult, tokensResult] = await Promise.all([
      // Fetch shop data
      supabase
        .from('seller_shops')
        .select('*')
        .eq('seller_id', userId)
        .eq('is_active', true)
        .maybeSingle(),
      
      // Fetch products
      supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Fetch token balance
      supabase
        .from('seller_tokens')
        .select('*')
        .eq('seller_id', userId)
        .maybeSingle(),
    ]);

    // Cache all results with long stale time
    if (shopResult.data) {
      setCache(CACHE_KEYS.SHOP_BY_SELLER(userId), shopResult.data, 5 * 60 * 1000);
    }
    
    if (productsResult.data) {
      setCache(CACHE_KEYS.PRODUCTS_BY_SELLER(userId), productsResult.data, 2 * 60 * 1000);
    }
    
    if (tokensResult.data) {
      setCache(CACHE_KEYS.USER_TOKENS(userId), tokensResult.data, 60 * 1000);
    }

    prefetchStatus.seller.set(userId, true);
    console.log('[DashboardPrefetch] ✅ Seller dashboard data prefetched');
  } catch (error) {
    console.error('[DashboardPrefetch] ❌ Prefetch error:', error);
  } finally {
    prefetchStatus.inProgress.delete(prefetchKey);
  }
}

/**
 * Prefetch buyer dashboard data
 */
export async function prefetchBuyerDashboard(userId: string): Promise<void> {
  if (!userId) return;
  
  // Check if recently prefetched
  const now = Date.now();
  if (prefetchStatus.buyer.get(userId) && now - prefetchStatus.lastPrefetch < MIN_PREFETCH_INTERVAL) {
    return;
  }
  
  const prefetchKey = `buyer:${userId}`;
  if (prefetchStatus.inProgress.has(prefetchKey)) return;
  
  prefetchStatus.inProgress.add(prefetchKey);
  prefetchStatus.lastPrefetch = now;
  
  try {
    console.log('[DashboardPrefetch] 🚀 Prefetching buyer dashboard data...');
    
    const [profileResult, ordersResult, favoritesResult] = await Promise.all([
      // Fetch profile
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      
      // Fetch orders
      supabase
        .from('orders')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      
      // Fetch favorites count
      supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId),
    ]);

    // Cache results
    if (profileResult.data) {
      setCache(CACHE_KEYS.USER_PROFILE(userId), profileResult.data, 5 * 60 * 1000);
    }
    
    if (ordersResult.data) {
      setCache(`orders:${userId}`, ordersResult.data, 2 * 60 * 1000);
    }

    prefetchStatus.buyer.set(userId, true);
    console.log('[DashboardPrefetch] ✅ Buyer dashboard data prefetched');
  } catch (error) {
    console.error('[DashboardPrefetch] ❌ Prefetch error:', error);
  } finally {
    prefetchStatus.inProgress.delete(prefetchKey);
  }
}

/**
 * Reset prefetch status (call on logout)
 */
export function resetPrefetchStatus(userId?: string): void {
  if (userId) {
    prefetchStatus.seller.delete(userId);
    prefetchStatus.buyer.delete(userId);
  } else {
    prefetchStatus.seller.clear();
    prefetchStatus.buyer.clear();
  }
  prefetchStatus.inProgress.clear();
  prefetchStatus.lastPrefetch = 0;
}

/**
 * Hook to trigger dashboard prefetch after auth
 */
export function useDashboardPrefetch(
  userId: string | null,
  isSeller: boolean,
  isAuthenticated: boolean
) {
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !userId || hasPrefetched.current) return;

    // Use requestIdleCallback for non-blocking prefetch
    const prefetch = () => {
      if (isSeller) {
        prefetchSellerDashboard(userId);
      } else {
        prefetchBuyerDashboard(userId);
      }
      hasPrefetched.current = true;
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetch, { timeout: 1000 });
    } else {
      // Immediate prefetch for browsers without requestIdleCallback
      setTimeout(prefetch, 50);
    }
  }, [userId, isSeller, isAuthenticated]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated) {
      hasPrefetched.current = false;
      resetPrefetchStatus();
    }
  }, [isAuthenticated]);
}

/**
 * Check if dashboard data is already cached
 */
export function isDashboardCached(userId: string, isSeller: boolean): boolean {
  if (isSeller) {
    const shop = getCached(CACHE_KEYS.SHOP_BY_SELLER(userId));
    const products = getCached(CACHE_KEYS.PRODUCTS_BY_SELLER(userId));
    return !!shop || !!products;
  } else {
    const profile = getCached(CACHE_KEYS.USER_PROFILE(userId));
    return !!profile;
  }
}
