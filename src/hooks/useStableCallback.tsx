import { useCallback, useRef } from 'react';

type AnyFunction = (...args: any[]) => any;

/**
 * Returns a memoized callback that won't change between renders
 * but always calls the latest version of the callback
 */
export function useStableCallback<T extends AnyFunction>(callback: T): T {
  const callbackRef = useRef<T>(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Debounce a callback
 */
export function useDebouncedCallback<T extends AnyFunction>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

/**
 * Throttle a callback
 */
export function useThrottledCallback<T extends AnyFunction>(
  callback: T,
  limit: number
): T {
  const lastRunRef = useRef<number>(0);
  const callbackRef = useRef<T>(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRunRef.current >= limit) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      }
    }) as T,
    [limit]
  );
}

/**
 * RAF-throttled callback for animations
 */
export function useRAFCallback<T extends AnyFunction>(callback: T): T {
  const rafRef = useRef<number | null>(null);
  const callbackRef = useRef<T>(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => {
      if (rafRef.current !== null) {
        return;
      }
      rafRef.current = requestAnimationFrame(() => {
        callbackRef.current(...args);
        rafRef.current = null;
      });
    }) as T,
    []
  );
}
