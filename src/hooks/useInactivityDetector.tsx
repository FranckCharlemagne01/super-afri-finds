import { useEffect, useRef, useCallback } from "react";
import { throttle } from "@/utils/performance";

interface UseInactivityDetectorProps {
  onInactive: () => void;
  timeout?: number;
  enabled?: boolean;
}

export const useInactivityDetector = ({
  onInactive,
  timeout = 300000, // 5 minutes default
  enabled = true,
}: UseInactivityDetectorProps) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onInactiveRef = useRef(onInactive);

  useEffect(() => {
    onInactiveRef.current = onInactive;
  }, [onInactive]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onInactiveRef.current();
    }, timeout);
  }, [timeout, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Throttle activity events for performance
    const throttledReset = throttle(resetTimer, 1000);

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'touchmove',
      'click',
    ];

    events.forEach((event) => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Initialize timer
    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledReset);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, resetTimer]);
};
