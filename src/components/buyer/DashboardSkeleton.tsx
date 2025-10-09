import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-3 py-4 max-w-md lg:max-w-6xl lg:px-6 lg:py-8">
        {/* Header Mobile Skeleton */}
        <div className="lg:hidden mb-6">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
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
        <Card className="mb-6 border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2].map((i) => (
            <Card key={i} className="border-0 shadow-sm bg-white">
              <CardContent className="p-4 text-center space-y-2">
                <Skeleton className="w-10 h-10 rounded-full mx-auto" />
                <Skeleton className="h-8 w-12 mx-auto" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Menu Items Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="w-5 h-5 rounded-sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
