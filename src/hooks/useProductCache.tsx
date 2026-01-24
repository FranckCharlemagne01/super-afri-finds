/**
 * Advanced product caching system for instant product display
 * - Prefetches products on hover
 * - Stores individual products in memory cache
 * - Enables instant navigation without "loading" screens
 */

import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCached, setCache, CACHE_KEYS } from '@/utils/dataCache';

interface CachedProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category: string;
  images?: string[];
  seller_id: string;
  shop_id?: string;
  rating?: number;
  reviews_count?: number;
  badge?: string;
  is_flash_sale?: boolean;
  is_boosted?: boolean;
  boosted_until?: string;
  stock_quantity?: number;
  video_url?: string;
}

interface CachedShop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_description?: string;
  logo_url?: string;
}

// Product-specific cache with longer stale time
const PRODUCT_CACHE_PREFIX = 'product:';
const SHOP_CACHE_PREFIX = 'shop:';
const PRODUCT_STALE_TIME = 5 * 60 * 1000; // 5 minutes

// Pending fetches to avoid duplicate requests
const pendingFetches = new Map<string, Promise<any>>();

/**
 * Get cached product by ID
 */
export function getCachedProduct(productId: string): CachedProduct | null {
  return getCached<CachedProduct>(`${PRODUCT_CACHE_PREFIX}${productId}`);
}

/**
 * Set product in cache
 */
export function setCachedProduct(product: CachedProduct): void {
  setCache(`${PRODUCT_CACHE_PREFIX}${product.id}`, product, PRODUCT_STALE_TIME);
}

/**
 * Get cached shop by ID
 */
export function getCachedShop(shopId: string): CachedShop | null {
  return getCached<CachedShop>(`${SHOP_CACHE_PREFIX}${shopId}`);
}

/**
 * Get cached shop by slug
 */
export function getCachedShopBySlug(slug: string): CachedShop | null {
  return getCached<CachedShop>(`${SHOP_CACHE_PREFIX}slug:${slug}`);
}

/**
 * Set shop in cache (by ID and by slug)
 */
export function setCachedShop(shop: CachedShop): void {
  setCache(`${SHOP_CACHE_PREFIX}${shop.id}`, shop, PRODUCT_STALE_TIME);
  setCache(`${SHOP_CACHE_PREFIX}slug:${shop.shop_slug}`, shop, PRODUCT_STALE_TIME);
}

/**
 * Prefetch shop by slug for instant ShopPage navigation
 */
export async function prefetchShopBySlug(slug: string): Promise<CachedShop | null> {
  // Check cache first
  const cached = getCachedShopBySlug(slug);
  if (cached) return cached;

  // Check if already fetching
  const pendingKey = `shop:slug:${slug}`;
  if (pendingFetches.has(pendingKey)) {
    return pendingFetches.get(pendingKey);
  }

  // Fetch shop
  const fetchPromise = (async () => {
    try {
      const { data: shop, error } = await supabase
        .from('seller_shops')
        .select('*')
        .eq('shop_slug', slug)
        .eq('is_active', true)
        .single();

      if (error || !shop) return null;

      // Cache the shop
      setCachedShop(shop);
      return shop;
    } catch {
      return null;
    } finally {
      pendingFetches.delete(pendingKey);
    }
  })();

  pendingFetches.set(pendingKey, fetchPromise);
  return fetchPromise;
}

/**
 * Prefetch a single product and its shop
 * Returns immediately if already cached
 */
export async function prefetchProduct(productId: string): Promise<CachedProduct | null> {
  // Check cache first
  const cached = getCachedProduct(productId);
  if (cached) return cached;

  // Check if already fetching
  const pendingKey = `product:${productId}`;
  if (pendingFetches.has(pendingKey)) {
    return pendingFetches.get(pendingKey);
  }

  // Fetch product
  const fetchPromise = (async () => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error || !product) return null;

      // Cache the product
      setCachedProduct(product);

      // Prefetch shop in background if exists
      if (product.shop_id && !getCachedShop(product.shop_id)) {
        (async () => {
          try {
            const { data: shop } = await supabase
              .from('seller_shops')
              .select('*')
              .eq('id', product.shop_id)
              .single();
            if (shop) setCachedShop(shop);
          } catch {
            // Ignore shop prefetch errors
          }
        })();
      }

      return product;
    } catch {
      return null;
    } finally {
      pendingFetches.delete(pendingKey);
    }
  })();

  pendingFetches.set(pendingKey, fetchPromise);
  return fetchPromise;
}

/**
 * Prefetch multiple products (for visible cards)
 */
export async function prefetchProducts(productIds: string[]): Promise<void> {
  const uncachedIds = productIds.filter(id => !getCachedProduct(id));
  
  if (uncachedIds.length === 0) return;

  try {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', uncachedIds)
      .eq('is_active', true);

    if (products) {
      products.forEach(product => setCachedProduct(product));
    }
  } catch {
    // Silently ignore prefetch errors
  }
}

/**
 * Hook for product prefetching on hover
 */
export function useProductPrefetch() {
  const prefetchTimeoutRef = { current: null as NodeJS.Timeout | null };

  const prefetchOnHover = useCallback((productId: string) => {
    // Debounce to avoid excessive prefetching
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    prefetchTimeoutRef.current = setTimeout(() => {
      prefetchProduct(productId);
    }, 50); // Very short delay for responsiveness
  }, []);

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
  }, []);

  return { prefetchOnHover, cancelPrefetch };
}

/**
 * Hook to prefetch visible products in a list
 */
export function usePrefetchVisibleProducts(productIds: string[]) {
  useEffect(() => {
    if (productIds.length === 0) return;

    // Use requestIdleCallback for non-blocking prefetch
    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => {
        // Prefetch first 12 products (visible on most screens)
        prefetchProducts(productIds.slice(0, 12));
      }, { timeout: 2000 });

      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timeout = setTimeout(() => {
        prefetchProducts(productIds.slice(0, 12));
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [productIds]);
}
