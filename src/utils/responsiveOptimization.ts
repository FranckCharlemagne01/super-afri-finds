/**
 * Responsive optimization utilities for mobile and tablet
 * Ensures smooth rendering and prevents layout issues
 */

/**
 * Prevent horizontal overflow
 */
export function preventHorizontalScroll() {
  if (typeof window === 'undefined') return;
  
  document.documentElement.style.overflowX = 'hidden';
  document.body.style.overflowX = 'hidden';
  document.body.style.maxWidth = '100vw';
}

/**
 * Optimize touch events for mobile devices
 */
export function optimizeTouchEvents() {
  if (typeof window === 'undefined') return;
  
  // Disable double-tap zoom on iOS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
}

/**
 * Add safe area insets for notched devices
 */
export function applySafeAreaInsets() {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
  root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
  root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
  root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
}

/**
 * Check if device is mobile or tablet
 */
export function isMobileOrTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024;
}

/**
 * Optimize viewport for mobile
 */
export function optimizeViewport() {
  if (typeof window === 'undefined') return;
  
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
    );
  }
}

/**
 * Initialize all responsive optimizations
 */
export function initResponsiveOptimizations() {
  if (typeof window === 'undefined') return;
  
  preventHorizontalScroll();
  optimizeTouchEvents();
  applySafeAreaInsets();
  optimizeViewport();
  
  // Reapply on resize
  window.addEventListener('resize', () => {
    preventHorizontalScroll();
    applySafeAreaInsets();
  });
}
