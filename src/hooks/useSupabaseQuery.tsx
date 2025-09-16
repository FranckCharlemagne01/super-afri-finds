import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueryOptions {
  retry?: number;
  retryDelay?: number;
  cacheTime?: number;
  staleTime?: number;
}

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// Cache simple pour éviter les requêtes répétées
const queryCache = new Map<string, { data: any; timestamp: number; staleTime: number }>();

export function useSupabaseQuery<T>(
  key: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {}
) {
  const {
    retry = 3,
    retryDelay = 1000,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 30 * 1000 // 30 secondes
  } = options;

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const executeQuery = useCallback(async (attempt = 0): Promise<void> => {
    // Vérifier le cache d'abord
    const cached = queryCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < cached.staleTime) {
      setState({ data: cached.data, loading: false, error: null });
      return;
    }

    // Nettoyer l'ancien controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await queryFn();
      
      if (abortControllerRef.current?.signal.aborted) {
        return; // Request was cancelled
      }

      if (result.error) {
        throw new Error(result.error.message || 'Unknown error');
      }

      // Mettre en cache le résultat
      queryCache.set(key, {
        data: result.data,
        timestamp: Date.now(),
        staleTime
      });

      setState({ data: result.data, loading: false, error: null });
    } catch (error: any) {
      if (abortControllerRef.current?.signal.aborted) {
        return; // Request was cancelled
      }

      console.error(`Query ${key} failed (attempt ${attempt + 1}):`, error);

      if (attempt < retry) {
        // Retry avec délai exponentiel
        const delay = retryDelay * Math.pow(2, attempt);
        retryTimeoutRef.current = setTimeout(() => {
          executeQuery(attempt + 1);
        }, delay);
      } else {
        setState({ data: null, loading: false, error });
      }
    }
  }, [key, queryFn, retry, retryDelay, staleTime]);

  useEffect(() => {
    executeQuery();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [executeQuery]);

  const refetch = useCallback(() => {
    // Invalider le cache
    queryCache.delete(key);
    executeQuery();
  }, [key, executeQuery]);

  return {
    ...state,
    refetch
  };
}

// Hook spécialisé pour les abonnements en temps réel
export function useSupabaseSubscription<T>(
  channel: string,
  config: any,
  onData: (payload: any) => void,
  deps: any[] = []
) {
  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', config, onData)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel, ...deps]);
}