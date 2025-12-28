import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect scroll direction
 * Returns 'up' | 'down' | null
 * Also returns whether the header should be visible based on scroll behavior
 */
export function useScrollDirection(threshold = 10) {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const diff = scrollY - lastScrollY.current;

      // Only update if we've scrolled past threshold
      if (Math.abs(diff) < threshold) {
        ticking.current = false;
        return;
      }

      // At the very top, always show
      if (scrollY < 50) {
        setIsVisible(true);
        setScrollDirection(null);
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      const direction = diff > 0 ? 'down' : 'up';
      
      if (direction !== scrollDirection) {
        setScrollDirection(direction);
        setIsVisible(direction === 'up');
      }

      lastScrollY.current = scrollY;
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    // Set initial scroll position
    lastScrollY.current = window.scrollY;

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollDirection, threshold]);

  return { scrollDirection, isVisible };
}
