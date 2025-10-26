import { useEffect, useRef } from "react";

/**
 * Optimizes touch interactions for mobile devices
 * - Eliminates 300ms tap delay
 * - Prevents accidental zooms
 * - Improves scroll performance
 */
export const useTouchOptimization = () => {
  useEffect(() => {
    // Prevent double-tap zoom on iOS
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });

    // Optimize scroll performance
    const optimizeScroll = () => {
      document.body.style.touchAction = "pan-y";
      (document.body.style as any).webkitOverflowScrolling = "touch";
    };
    
    optimizeScroll();

    return () => {
      document.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, []);
};

/**
 * Hook to add haptic feedback on touch (if supported)
 */
export const useHapticFeedback = () => {
  const vibrate = (pattern: number | number[] = 10) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return { vibrate };
};

/**
 * Hook to detect and optimize for slow connections
 */
export const useConnectionOptimization = () => {
  const connection = useRef<any>(
    (navigator as any).connection || 
    (navigator as any).mozConnection || 
    (navigator as any).webkitConnection
  );

  const isSlowConnection = () => {
    if (!connection.current) return false;
    
    const effectiveType = connection.current.effectiveType;
    return effectiveType === "slow-2g" || effectiveType === "2g";
  };

  const shouldReduceQuality = () => {
    if (!connection.current) return false;
    
    return connection.current.saveData || isSlowConnection();
  };

  return {
    isSlowConnection: isSlowConnection(),
    shouldReduceQuality: shouldReduceQuality(),
  };
};
