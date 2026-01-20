/**
 * Advanced data caching utilities for ultra-fast data loading
 * Implements stale-while-revalidate pattern with memory cache
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
}

// Global in-memory cache with configurable stale times
const memoryCache = new Map<string, CacheEntry<any>>();

// Default cache configuration
const DEFAULT_STALE_TIME = 60 * 1000; // 1 minute
const DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data if valid, returns null if stale or missing
 */
export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  const age = now - entry.timestamp;
  
  // Data is still fresh
  if (age < entry.staleTime) {
    return entry.data;
  }
  
  // Data is stale but within max age - return stale data
  if (age < DEFAULT_MAX_AGE) {
    return entry.data;
  }
  
  // Data is too old, remove it
  memoryCache.delete(key);
  return null;
}

/**
 * Check if cached data is stale (needs revalidation)
 */
export function isStale(key: string): boolean {
  const entry = memoryCache.get(key);
  if (!entry) return true;
  
  return Date.now() - entry.timestamp >= entry.staleTime;
}

/**
 * Set data in cache with optional stale time
 */
export function setCache<T>(key: string, data: T, staleTime = DEFAULT_STALE_TIME): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    staleTime,
  });
}

/**
 * Invalidate a specific cache entry
 */
export function invalidateCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix
 */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  memoryCache.clear();
}

/**
 * Stale-while-revalidate fetcher
 * Returns cached data immediately if available, then revalidates in background
 */
export async function fetchWithSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    staleTime?: number;
    onRevalidate?: (data: T) => void;
  } = {}
): Promise<T> {
  const { staleTime = DEFAULT_STALE_TIME, onRevalidate } = options;
  
  // Check cache first
  const cached = getCached<T>(key);
  
  if (cached !== null) {
    // If stale, revalidate in background
    if (isStale(key)) {
      // Background revalidation
      fetcher()
        .then((freshData) => {
          setCache(key, freshData, staleTime);
          onRevalidate?.(freshData);
        })
        .catch(console.error);
    }
    return cached;
  }
  
  // No cache, fetch fresh data
  const data = await fetcher();
  setCache(key, data, staleTime);
  return data;
}

/**
 * Preload data into cache
 */
export function preloadData<T>(key: string, data: T, staleTime = DEFAULT_STALE_TIME): void {
  setCache(key, data, staleTime);
}

/**
 * Cache keys for consistent usage
 */
export const CACHE_KEYS = {
  PRODUCTS: 'products:all',
  PRODUCTS_BY_SELLER: (sellerId: string) => `products:seller:${sellerId}`,
  SHOP_BY_SELLER: (sellerId: string) => `shop:seller:${sellerId}`,
  USER_PROFILE: (userId: string) => `profile:${userId}`,
  USER_TOKENS: (userId: string) => `tokens:${userId}`,
  CATEGORIES: 'categories:all',
  FLASH_SALES: 'products:flash-sales',
  BOOSTED: 'products:boosted',
} as const;
