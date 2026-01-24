import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Lightweight skeleton for CategoryPage - instant visual feedback
 */
export const CategoryPageSkeleton = memo(function CategoryPageSkeleton() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-150">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/categories')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      </header>

      {/* Category Banner */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 py-12">
        <div className="container mx-auto px-4 text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>

      {/* Filter */}
      <div className="container mx-auto px-4 py-4">
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div 
              key={i} 
              className="bg-card rounded-xl overflow-hidden border border-border/40"
              style={{ animationDelay: `${i * 50}ms` }}
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

export default CategoryPageSkeleton;
