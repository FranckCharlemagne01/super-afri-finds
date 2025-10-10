import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const SellerDashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container mx-auto px-3 py-4 max-w-md md:max-w-3xl lg:max-w-7xl md:px-6 lg:px-8 lg:py-6">
        {/* Header Skeleton */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 md:gap-6">
              {/* Logo & Info */}
              <div className="flex items-center gap-3 md:gap-4 flex-1 w-full">
                <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-xl shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-6 md:h-8 w-40 md:w-56" />
                  <Skeleton className="h-4 w-48 md:w-64" />
                  <Skeleton className="h-3 w-32 md:w-40" />
                </div>
              </div>

              {/* Quick Stats & Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 md:w-10 md:h-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-20 md:w-24" />
                        <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex gap-2">
                  <Skeleton className="h-9 md:h-10 w-24 md:w-28 rounded-md" />
                  <Skeleton className="h-9 md:h-10 w-32 md:w-40 rounded-md" />
                  <Skeleton className="h-9 md:h-10 w-20 md:w-24 rounded-md" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-card/50 backdrop-blur-sm border shadow-sm rounded-lg p-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 md:h-12 rounded-md" />
            ))}
          </div>

          {/* Welcome Card Skeleton */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 md:p-6 space-y-4">
              <Skeleton className="h-7 md:h-8 w-64 md:w-80" />
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-10 md:h-11 w-40 md:w-48" />
                <Skeleton className="h-10 md:h-11 w-36 md:w-44" />
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-md">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-20 md:w-24" />
                      <Skeleton className="h-8 md:h-10 w-12 md:w-16" />
                    </div>
                    <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Chart Skeleton */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-48 md:w-64" />
              </div>
              <Skeleton className="h-48 md:h-64 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
