import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-3 py-4 max-w-md md:max-w-3xl lg:max-w-6xl md:px-6 lg:px-8 lg:py-8">
        {/* Header Mobile & Tablet Skeleton */}
        <div className="lg:hidden mb-6">
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 md:h-7 w-32 md:w-40" />
                  <Skeleton className="h-4 w-24 md:w-32" />
                </div>
                <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header Desktop Skeleton */}
        <div className="hidden lg:flex justify-between items-center mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Profile Summary Skeleton */}
        <Card className="mb-6 border-0 shadow-sm bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <Skeleton className="w-14 h-14 md:w-16 md:h-16 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-5 md:h-6 w-32 md:w-40" />
                <Skeleton className="h-4 w-40 md:w-48" />
                <Skeleton className="h-4 w-28 md:w-36" />
              </div>
              <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-md shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[1, 2].map((i) => (
            <Card key={i} className="border-0 shadow-sm bg-white">
              <CardContent className="p-4 md:p-5 text-center space-y-2">
                <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-full mx-auto" />
                <Skeleton className="h-8 md:h-9 w-12 md:w-16 mx-auto" />
                <Skeleton className="h-3 w-20 md:w-24 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Menu Items Skeleton */}
        <div className="space-y-3 md:space-y-4">
          <Skeleton className="h-6 md:h-7 w-32 md:w-40 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-0 shadow-sm bg-white">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <Skeleton className="h-4 w-28 md:w-32" />
                      <Skeleton className="h-3 w-40 md:w-48" />
                    </div>
                  </div>
                  <Skeleton className="w-5 h-5 md:w-6 md:h-6 rounded-sm shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
