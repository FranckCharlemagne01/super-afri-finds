import { cn } from "@/lib/utils";

interface SmoothSkeletonProps {
  className?: string;
  variant?: "card" | "text" | "avatar" | "button";
  lines?: number;
}

export function SmoothSkeleton({ className, variant = "card", lines = 1 }: SmoothSkeletonProps) {
  const baseClasses = "animate-pulse bg-muted";
  
  const variants = {
    card: "h-48 w-full rounded-lg",
    text: "h-4 w-full rounded",
    avatar: "h-10 w-10 rounded-full",
    button: "h-10 w-24 rounded-md"
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variants.text,
              i === lines - 1 && lines > 1 ? "w-3/4" : "w-full" // Dernière ligne plus courte
            )}
            style={{
              animationDelay: `${i * 100}ms` // Décalage pour effet en cascade
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, variants[variant], className)} />
  );
}

interface SmoothCardSkeletonProps {
  className?: string;
  hasImage?: boolean;
  hasActions?: boolean;
}

export function SmoothCardSkeleton({ className, hasImage = true, hasActions = true }: SmoothCardSkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-0 overflow-hidden", className)}>
      {hasImage && (
        <SmoothSkeleton variant="card" className="rounded-none rounded-t-lg" />
      )}
      <div className="p-4 space-y-3">
        <SmoothSkeleton variant="text" lines={2} />
        <div className="flex items-center justify-between">
          <SmoothSkeleton className="h-6 w-20 rounded" />
          <SmoothSkeleton className="h-5 w-12 rounded" />
        </div>
        {hasActions && (
          <div className="flex gap-2 pt-2">
            <SmoothSkeleton variant="button" className="flex-1" />
            <SmoothSkeleton variant="button" className="w-10" />
          </div>
        )}
      </div>
    </div>
  );
}

interface SmoothListSkeletonProps {
  items?: number;
  variant?: "card" | "list";
  className?: string;
}

export function SmoothListSkeleton({ items = 6, variant = "card", className }: SmoothListSkeletonProps) {
  if (variant === "list") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: items }, (_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
            <SmoothSkeleton variant="avatar" />
            <div className="flex-1">
              <SmoothSkeleton variant="text" lines={2} />
            </div>
            <SmoothSkeleton variant="button" className="w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {Array.from({ length: items }, (_, i) => (
        <SmoothCardSkeleton key={i} />
      ))}
    </div>
  );
}