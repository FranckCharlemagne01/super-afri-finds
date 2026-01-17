import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

/**
 * Native-style pull-to-refresh component
 * Provides iOS/Android-like refresh behavior
 */
export const PullToRefresh = ({
  children,
  onRefresh,
  className,
  disabled = false
}: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  
  const indicatorOpacity = useTransform(pullDistance, [0, PULL_THRESHOLD / 2, PULL_THRESHOLD], [0, 0.5, 1]);
  const indicatorScale = useTransform(pullDistance, [0, PULL_THRESHOLD], [0.5, 1]);
  const indicatorRotation = useTransform(pullDistance, [0, MAX_PULL], [0, 180]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || !startY.current) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Apply resistance
      const resistance = 0.4;
      const newPull = Math.min(diff * resistance, MAX_PULL);
      pullDistance.set(newPull);
    }
  }, [disabled, isRefreshing, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    const currentPull = pullDistance.get();
    
    if (currentPull >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      pullDistance.set(60); // Keep indicator visible while refreshing
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        pullDistance.set(0);
      }
    } else {
      pullDistance.set(0);
    }
    
    startY.current = 0;
  }, [disabled, isRefreshing, pullDistance, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh indicator */}
      <motion.div
        style={{
          opacity: indicatorOpacity,
          scale: indicatorScale,
          y: useTransform(pullDistance, [0, MAX_PULL], [-40, 20])
        }}
        className="absolute left-1/2 -translate-x-1/2 top-0 z-50 flex items-center justify-center"
      >
        <div className="bg-background shadow-lg rounded-full p-2 border border-border/50">
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <motion.div style={{ rotate: indicatorRotation }}>
              <svg
                className="w-5 h-5 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12l7-7 7 7" />
              </svg>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y: pullDistance }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
