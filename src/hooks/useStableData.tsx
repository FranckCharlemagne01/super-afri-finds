import { useState, useEffect, useRef, useMemo } from 'react';

interface StableDataOptions {
  // Garde les données précédentes pendant le rechargement pour éviter les clignotements
  keepPreviousData?: boolean;
  // Délai avant d'afficher l'état de chargement pour éviter les flashs
  loadingDelay?: number;
  // Délai pour debouncer les mises à jour fréquentes
  debounceMs?: number;
}

interface StableDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean; // Indique si les données affichées sont anciennes
}

export function useStableData<T>(
  fetcher: () => Promise<T>,
  deps: any[],
  options: StableDataOptions = {}
) {
  const {
    keepPreviousData = true,
    loadingDelay = 150,
    debounceMs = 100
  } = options;

  const [state, setState] = useState<StableDataState<T>>({
    data: null,
    loading: true,
    error: null,
    isStale: false
  });

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSuccessfulData = useRef<T | null>(null);

  const memoizedFetcher = useMemo(() => fetcher, deps);

  const executeQuery = async (showImmediateLoading = false) => {
    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Nettoyer les timeouts précédents
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Gestion intelligente de l'état de chargement
    if (showImmediateLoading || !keepPreviousData || !lastSuccessfulData.current) {
      // Afficher le loading immédiatement si demandé ou s'il n'y a pas de données précédentes
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        isStale: false
      }));
    } else {
      // Afficher le loading avec délai si on a des données précédentes
      setState(prev => ({
        ...prev,
        loading: false, // Ne pas montrer le loading tout de suite
        error: null,
        isStale: true // Marquer les données comme potentiellement obsolètes
      }));

      loadingTimeoutRef.current = setTimeout(() => {
        if (!abortControllerRef.current?.signal.aborted) {
          setState(prev => ({
            ...prev,
            loading: true
          }));
        }
      }, loadingDelay);
    }

    try {
      const result = await memoizedFetcher();
      
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Nettoyer les timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      lastSuccessfulData.current = result;
      
      setState({
        data: result,
        loading: false,
        error: null,
        isStale: false
      });
    } catch (error: any) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Stable data fetch error:', error);

      // Si on a des données précédentes, les garder et juste signaler l'erreur discrètement
      if (keepPreviousData && lastSuccessfulData.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error,
          isStale: true // Les données sont maintenant obsolètes
        }));
      } else {
        setState({
          data: null,
          loading: false,
          error: error,
          isStale: false
        });
      }
    }
  };

  useEffect(() => {
    // Debouncer les appels multiples
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      executeQuery();
    }, debounceMs);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [memoizedFetcher]);

  const refetch = () => {
    executeQuery(true); // Forcer le loading immédiat lors d'un refetch manuel
  };

  return {
    ...state,
    refetch
  };
}