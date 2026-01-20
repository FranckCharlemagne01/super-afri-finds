import { memo, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProductSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4 | 5 | 6;
}

/**
 * Optimized product skeleton for instant perceived loading
 * Uses CSS-only animation for zero JS overhead during loading
 */
export const ProductSkeleton = memo(({ count = 12, columns = 2 }: ProductSkeletonProps) => {
  const gridClass = useMemo(() => {
    const colMap = {
      2: 'grid-cols-2',
      3: 'grid-cols-2 sm:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
      5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    };
    return colMap[columns];
  }, [columns]);

  // Pre-generate skeleton items to avoid re-render
  const items = useMemo(() => 
    Array.from({ length: count }, (_, i) => i),
    [count]
  );

  return (
    <div className={cn('grid gap-3 sm:gap-4', gridClass)}>
      {items.map((i) => (
        <ProductCardSkeleton key={i} delay={i * 50} />
      ))}
    </div>
  );
});
ProductSkeleton.displayName = 'ProductSkeleton';

/**
 * Single product card skeleton - memoized for performance
 */
const ProductCardSkeleton = memo(({ delay = 0 }: { delay?: number }) => (
  <div 
    className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50"
    style={{ 
      animationDelay: `${delay}ms`,
      opacity: 0,
      animation: 'fadeIn 0.3s ease-out forwards',
    }}
  >
    {/* Image placeholder */}
    <Skeleton className="w-full aspect-[4/5] rounded-none" />
    
    {/* Content */}
    <div className="p-3 space-y-2">
      {/* Title */}
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      
      {/* Price */}
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
      
      {/* Rating */}
      <div className="flex items-center gap-1">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  </div>
));
ProductCardSkeleton.displayName = 'ProductCardSkeleton';

/**
 * Dashboard stats skeleton
 */
export const DashboardStatsSkeleton = memo(() => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div 
        key={i}
        className="bg-card rounded-xl p-4 shadow-sm border border-border/50"
        style={{ animationDelay: `${i * 50}ms` }}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-12" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
));
DashboardStatsSkeleton.displayName = 'DashboardStatsSkeleton';

/**
 * Header skeleton for fast initial render
 */
export const HeaderSkeleton = memo(() => (
  <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 p-4">
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  </div>
));
HeaderSkeleton.displayName = 'HeaderSkeleton';

/**
 * Inline loading indicator for buttons
 */
export const ButtonLoader = memo(() => (
  <span className="inline-flex items-center gap-2">
    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
  </span>
));
ButtonLoader.displayName = 'ButtonLoader';

export default ProductSkeleton;
