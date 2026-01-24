/**
 * Shop Prefetching Hook
 * Pre-loads shop data on hover for instant navigation
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setCache, getCached, CACHE_KEYS } from '@/utils/dataCache';

// Track pending fetches to prevent duplicates
const pendingShopFetches = new Map<string, Promise<any>>();
const prefetchedShops = new Set<string>();

interface CachedShop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  seller_id: string;
  subscription_active?: boolean;
}

interface CachedShopProducts {
  products: any[];
  timestamp: number;
}

/**
 * Prefetch shop data by slug for instant navigation
 */
export async function prefetchShopBySlug(shopSlug: string): Promise<CachedShop | null> {
  if (!shopSlug) return null;
  
  // Check if already prefetched
  if (prefetchedShops.has(shopSlug)) {
    return getCached<CachedShop>(`shop_slug_${shopSlug}`);
  }
  
  // Check cache first
  const cached = getCached<CachedShop>(`shop_slug_${shopSlug}`);
  if (cached) {
    prefetchedShops.add(shopSlug);
    return cached;
  }
  
  // Prevent duplicate fetches
  if (pendingShopFetches.has(shopSlug)) {
    return pendingShopFetches.get(shopSlug);
  }
  
  const fetchPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('seller_shops')
        .select('id, shop_name, shop_slug, shop_description, logo_url, banner_url, seller_id, subscription_active')
        .eq('shop_slug', shopSlug)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error || !data) return null;
      
      // Cache shop data (5 min stale time)
      setCache(`shop_slug_${shopSlug}`, data, 300000);
      prefetchedShops.add(shopSlug);
      
      // Also prefetch shop products in background
      prefetchShopProducts(data.id);
      
      return data as CachedShop;
    } catch {
      return null;
    } finally {
      pendingShopFetches.delete(shopSlug);
    }
  })();
  
  pendingShopFetches.set(shopSlug, fetchPromise);
  return fetchPromise;
}

/**
 * Prefetch products for a shop
 */
async function prefetchShopProducts(shopId: string): Promise<void> {
  const cacheKey = `shop_products_${shopId}`;
  
  // Check if already cached
  if (getCached<CachedShopProducts>(cacheKey)) return;
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, price, original_price, discount_percentage, images, rating, reviews_count, category, is_flash_sale, badge, seller_id, is_boosted, boosted_until')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('is_boosted', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setCache(cacheKey, { products: data, timestamp: Date.now() }, 120000); // 2 min
    }
  } catch {
    // Silent fail
  }
}

/**
 * Get cached shop by slug
 */
export function getCachedShopBySlug(shopSlug: string): CachedShop | null {
  return getCached<CachedShop>(`shop_slug_${shopSlug}`);
}

/**
 * Get cached shop products
 */
export function getCachedShopProducts(shopId: string): any[] | null {
  const cached = getCached<CachedShopProducts>(`shop_products_${shopId}`);
  return cached?.products || null;
}

/**
 * Hook for prefetching shop data on hover
 */
export function useShopPrefetch() {
  const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const prefetchOnHover = useCallback((shopSlug: string) => {
    if (!shopSlug || prefetchedShops.has(shopSlug)) return;
    
    // Clear any pending timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
    
    // Prefetch with minimal delay (30ms debounce)
    prefetchTimeoutRef.current = setTimeout(() => {
      prefetchShopBySlug(shopSlug);
    }, 30);
  }, []);
  
  const cancelPrefetch = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);
  
  return {
    prefetchOnHover,
    cancelPrefetch,
    prefetchShopBySlug,
  };
}

/**
 * Clear shop prefetch cache (call on logout)
 */
export function clearShopPrefetchCache(): void {
  prefetchedShops.clear();
  pendingShopFetches.clear();
}
