/**
 * Ultra-fast skeleton for ProductDetail page
 * Shows instantly while data loads in background
 */

import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const ProductDetailSkeleton = memo(function ProductDetailSkeleton() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="hover:bg-secondary"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <span 
                className="text-base sm:text-lg md:text-xl font-bold gradient-text-primary cursor-pointer" 
                onClick={() => navigate('/marketplace')}
              >
                Djassa
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image skeleton */}
          <div className="space-y-4">
            <Skeleton className="w-full h-96 lg:h-[500px] rounded-lg shimmer" />
            {/* Thumbnails */}
            <div className="flex gap-2 px-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-16 h-16 rounded-lg shimmer" style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="space-y-6">
            {/* Title */}
            <Skeleton className="h-8 w-3/4 shimmer" />
            
            {/* Rating */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 shimmer" style={{ animationDelay: '50ms' }} />
              <Skeleton className="h-5 w-16 shimmer" style={{ animationDelay: '100ms' }} />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Skeleton className="h-10 w-32 shimmer" style={{ animationDelay: '150ms' }} />
              <Skeleton className="h-5 w-24 shimmer" style={{ animationDelay: '200ms' }} />
            </div>

            {/* Stock */}
            <Skeleton className="h-6 w-40 shimmer" style={{ animationDelay: '250ms' }} />

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full shimmer" style={{ animationDelay: '300ms' }} />
              <Skeleton className="h-4 w-full shimmer" style={{ animationDelay: '350ms' }} />
              <Skeleton className="h-4 w-2/3 shimmer" style={{ animationDelay: '400ms' }} />
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-32 rounded-lg shimmer" style={{ animationDelay: '450ms' }} />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Skeleton className="h-14 flex-1 rounded-xl shimmer" style={{ animationDelay: '500ms' }} />
              <Skeleton className="h-14 flex-1 rounded-xl shimmer" style={{ animationDelay: '550ms' }} />
            </div>

            {/* Shop info */}
            <div className="border rounded-xl p-4 mt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full shimmer" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32 shimmer" />
                  <Skeleton className="h-4 w-48 shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related products skeleton */}
        <div className="mt-12 space-y-4">
          <Skeleton className="h-7 w-48 shimmer" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-xl shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                <Skeleton className="h-4 w-3/4 shimmer" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                <Skeleton className="h-5 w-1/2 shimmer" style={{ animationDelay: `${i * 100 + 100}ms` }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
});

export default ProductDetailSkeleton;
