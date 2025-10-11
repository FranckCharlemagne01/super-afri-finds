import { useEffect, useCallback, useRef } from 'react';
import { rafThrottle } from '@/utils/performance';

/**
 * Optimized scroll hook with RAF throttling for smooth performance
 */
export const useOptimizedScroll = (
  callback: (scrollY: number) => void,
  enabled = true
) => {
  const callbackRef = useRef(callback);
  
  // Update callback ref without triggering effect
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = rafThrottle(() => {
      callbackRef.current(window.scrollY);
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled]);
};

/**
 * Hook to detect when element is in viewport (for lazy loading)
 */
export const useInViewport = (
  elementRef: React.RefObject<HTMLElement>,
  callback: () => void,
  options?: IntersectionObserverInit
) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callbackRef.current();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);
};
