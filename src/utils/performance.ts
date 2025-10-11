/**
 * Performance optimization utilities
 * Debounce, throttle, and other performance helpers
 */

/**
 * Debounce function - delays execution until after wait milliseconds have elapsed
 * since the last time it was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request animation frame throttle - throttles to browser's repaint cycle
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) {
      return;
    }
    
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * Batch multiple state updates into a single render
 */
export function batchUpdates(callback: () => void): void {
  // React 18+ automatically batches updates
  callback();
}

/**
 * Check if device has reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Optimize touch events for mobile
 */
export function optimizeTouchEvent(element: HTMLElement): void {
  element.style.touchAction = 'manipulation';
  (element.style as any).webkitTapHighlightColor = 'transparent';
}

/**
 * Enable GPU acceleration for animations
 */
export function enableGPUAcceleration(element: HTMLElement): void {
  element.style.transform = 'translateZ(0)';
  element.style.willChange = 'transform, opacity';
}

/**
 * Cleanup will-change after animation
 */
export function cleanupGPUAcceleration(element: HTMLElement): void {
  element.style.willChange = 'auto';
}

/**
 * Passive event listener options for better scroll performance
 */
export const passiveEventOptions: AddEventListenerOptions = {
  passive: true,
  capture: false,
};

/**
 * Check if browser supports passive events
 */
export function supportsPassiveEvents(): boolean {
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: function () {
        supportsPassive = true;
        return true;
      },
    });
    window.addEventListener('testPassive', null as any, opts);
    window.removeEventListener('testPassive', null as any, opts);
  } catch (e) {}
  return supportsPassive;
}
