import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Lightweight skeleton for ShopPage - appears instantly while data loads
 * Provides immediate visual feedback for ultra-fast perceived performance
 */
export const ShopPageSkeleton = memo(function ShopPageSkeleton() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-150">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-border/50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-muted to-muted/50">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Shop Info */}
      <div className="container mx-auto px-3 sm:px-4 -mt-10 sm:-mt-12 relative z-10">
        <div className="flex items-end gap-3 sm:gap-4 mb-4">
          {/* Logo */}
          <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl ring-4 ring-background" />
          
          {/* Info */}
          <div className="flex-1 pb-1">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Description */}
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />

        {/* Category filters */}
        <div className="flex gap-2 mb-6 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton 
              key={i} 
              className="h-8 w-20 rounded-full flex-shrink-0" 
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="bg-card rounded-xl overflow-hidden border border-border/40"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <Skeleton className="w-full h-[180px] sm:h-[220px]" />
              <div className="p-2.5 sm:p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ShopPageSkeleton;
