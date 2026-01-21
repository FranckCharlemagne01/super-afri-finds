import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getCached, setCache, isStale, CACHE_KEYS, invalidateCache } from '@/utils/dataCache';

interface UseOptimizedQueryOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  staleTime?: number;
  enabled?: boolean;
  keepPreviousData?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseOptimizedQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

// ✅ Global request deduplication to prevent duplicate fetches
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Optimized query hook with built-in caching, stale-while-revalidate, and request deduplication
 * Much faster than react-query for simple use cases
 */
export function useOptimizedQuery<T>({
  key,
  fetcher,
  staleTime = 60000, // 1 minute default
  enabled = true,
  keepPreviousData = true,
  onSuccess,
  onError,
}: UseOptimizedQueryOptions<T>): UseOptimizedQueryResult<T> {
  // ✅ Initialize from cache synchronously to prevent flicker
  const initialData = useMemo(() => getCached<T>(key), [key]);
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);
  const [stale, setStale] = useState(() => isStale(key));
  
  const mountedRef = useRef(true);
  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchData = useCallback(async (showLoading = true) => {
    const currentKey = keyRef.current;
    
    // ✅ Deduplicate concurrent requests for the same key
    if (pendingRequests.has(currentKey)) {
      try {
        const result = await pendingRequests.get(currentKey);
        if (mountedRef.current) {
          setData(result);
          setLoading(false);
          setStale(false);
        }
        return;
      } catch {
        // Fall through to fetch again
      }
    }

    if (showLoading && !data) {
      setLoading(true);
    }

    const fetchPromise = fetcher();
    pendingRequests.set(currentKey, fetchPromise);

    try {
      const freshData = await fetchPromise;
      
      if (mountedRef.current && keyRef.current === currentKey) {
        setData(freshData);
        setCache(currentKey, freshData, staleTime);
        setStale(false);
        setError(null);
        onSuccess?.(freshData);
      }
    } catch (err) {
      if (mountedRef.current && keyRef.current === currentKey) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      }
    } finally {
      pendingRequests.delete(currentKey);
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher, staleTime, data, onSuccess, onError]);

  // Initial fetch and stale revalidation
  useEffect(() => {
    if (!enabled) return;

    const cached = getCached<T>(key);
    
    if (cached !== null) {
      setData(cached);
      setLoading(false);
      
      // Background revalidation if stale
      if (isStale(key)) {
        setStale(true);
        fetchData(false);
      }
    } else {
      fetchData(true);
    }
  }, [key, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    invalidateCache(key);
    await fetchData(true);
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    isStale: stale,
  };
}

/**
 * Optimized products query with smart caching
 */
export function useOptimizedProductsQuery(sellerId?: string) {
  const key = sellerId 
    ? CACHE_KEYS.PRODUCTS_BY_SELLER(sellerId)
    : CACHE_KEYS.PRODUCTS;

  return useOptimizedQuery({
    key,
    fetcher: async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Use products table for seller-specific queries (seller needs their own data)
      // Use products_public view for public queries to hide sensitive data
      if (sellerId) {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            shop:seller_shops!shop_id(shop_slug, shop_name)
          `)
          .eq('seller_id', sellerId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        return data || [];
      } else {
        // Public query - use products_public view (no join, view doesn't have FK)
        const { data, error } = await supabase
          .from('products_public')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        return data || [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for products
  });
}

/**
 * Optimized shop query
 */
export function useOptimizedShopQuery(sellerId: string | null) {
  const key = sellerId ? CACHE_KEYS.SHOP_BY_SELLER(sellerId) : '';

  return useOptimizedQuery({
    key,
    enabled: !!sellerId,
    fetcher: async () => {
      if (!sellerId) return null;
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase
        .from('seller_shops')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for shop data
  });
}

export default useOptimizedQuery;
