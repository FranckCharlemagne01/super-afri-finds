import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueryOptions {
  retry?: number;
  retryDelay?: number;
  cacheTime?: number;
  staleTime?: number;
  enabled?: boolean; // Allow conditional fetching
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
}

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
}

// Enhanced cache with LRU-like behavior
const queryCache = new Map<string, { data: any; timestamp: number; staleTime: number }>();
const MAX_CACHE_SIZE = 100;

// Clean old cache entries
function cleanCache() {
  if (queryCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(queryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 4));
    toDelete.forEach(([key]) => queryCache.delete(key));
  }
}

export function useSupabaseQuery<T>(
  key: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {}
) {
  const {
    retry = 2,
    retryDelay = 1000,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 30 * 1000, // 30 seconds
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
  } = options;

  // Get initial state from cache
  const initialData = useMemo(() => {
    const cached = queryCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < cacheTime) {
      return cached.data;
    }
    return null;
  }, [key, cacheTime]);

  const [state, setState] = useState<QueryState<T>>({
    data: initialData,
    loading: !initialData && enabled,
    error: null,
    isStale: initialData ? (Date.now() - (queryCache.get(key)?.timestamp || 0)) > staleTime : false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const executeQuery = useCallback(async (attempt = 0): Promise<void> => {
    if (!enabled) return;

    // Check cache first (stale-while-revalidate)
    const cached = queryCache.get(key);
    const isFresh = cached && (Date.now() - cached.timestamp) < staleTime;
    
    if (isFresh && attempt === 0) {
      setState({ data: cached.data, loading: false, error: null, isStale: false });
      return;
    }

    // Show cached data immediately while fetching
    if (cached && attempt === 0) {
      setState(prev => ({ ...prev, data: cached.data, isStale: true }));
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      if (!cached) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }
      
      const result = await queryFn();
      
      if (abortControllerRef.current?.signal.aborted || !mountedRef.current) {
        return;
      }

      if (result.error) {
        throw new Error(result.error.message || 'Unknown error');
      }

      // Update cache
      queryCache.set(key, {
        data: result.data,
        timestamp: Date.now(),
        staleTime
      });
      cleanCache();

      setState({ data: result.data, loading: false, error: null, isStale: false });
    } catch (error: any) {
      if (abortControllerRef.current?.signal.aborted || !mountedRef.current) {
        return;
      }

      console.error(`Query ${key} failed (attempt ${attempt + 1}):`, error);

      if (attempt < retry) {
        const delay = retryDelay * Math.pow(1.5, attempt); // Gentler exponential backoff
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            executeQuery(attempt + 1);
          }
        }, delay);
      } else {
        setState(prev => ({ ...prev, loading: false, error, isStale: false }));
      }
    }
  }, [key, queryFn, retry, retryDelay, staleTime, enabled]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    
    if (refetchOnMount || !queryCache.has(key)) {
      executeQuery();
    }

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [executeQuery, key, refetchOnMount]);

  // Optional: refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      const cached = queryCache.get(key);
      if (!cached || (Date.now() - cached.timestamp) > staleTime) {
        executeQuery();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [executeQuery, key, refetchOnWindowFocus, staleTime]);

  const refetch = useCallback(() => {
    queryCache.delete(key);
    return executeQuery();
  }, [key, executeQuery]);

  return {
    ...state,
    refetch
  };
}

// Hook for real-time subscriptions with cleanup
export function useSupabaseSubscription<T>(
  channel: string,
  config: any,
  onData: (payload: any) => void,
  deps: any[] = []
) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', config, (payload: any) => {
        onDataRef.current(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel, ...deps]);
}

/**
 * Invalidate specific cache keys
 */
export function invalidateQueries(keys: string[]) {
  keys.forEach(key => queryCache.delete(key));
}

/**
 * Clear all query cache
 */
export function clearQueryCache() {
  queryCache.clear();
}