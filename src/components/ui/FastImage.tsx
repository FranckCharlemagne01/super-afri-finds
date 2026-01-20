import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FastImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'square' | 'product' | 'video' | 'auto';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Fast image component with blur placeholder and progressive loading
 * Optimized for instant perceived loading
 */
export const FastImage = memo(({
  src,
  alt,
  className,
  containerClassName,
  aspectRatio = 'product',
  priority = false,
  onLoad,
  onError,
}: FastImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const aspectClass = {
    square: 'aspect-square',
    product: 'aspect-[4/5]',
    video: 'aspect-video',
    auto: '',
  }[aspectRatio];

  // Check if image is already cached (instant display)
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalHeight > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  if (!src || hasError) {
    return (
      <div className={cn(
        'bg-muted/30 flex items-center justify-center',
        aspectClass,
        containerClassName
      )}>
        <div className="text-muted-foreground/30 text-xs">Image</div>
      </div>
    );
  }

  return (
    <div className={cn(
      'relative overflow-hidden bg-muted/10',
      aspectClass,
      containerClassName
    )}>
      {/* Skeleton placeholder - shown until image loads */}
      {!isLoaded && (
        <div className="absolute inset-0 skeleton-shimmer" />
      )}
      
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-150',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
});
FastImage.displayName = 'FastImage';

/**
 * Product card image - fixed aspect ratio for consistent grid
 */
export const ProductCardImage = memo(({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string | undefined | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) => (
  <FastImage
    src={src}
    alt={alt}
    aspectRatio="product"
    priority={priority}
    className={cn('rounded-t-xl', className)}
    containerClassName="rounded-t-xl"
  />
));
ProductCardImage.displayName = 'ProductCardImage';

/**
 * Avatar/thumbnail image - small, eager loading
 */
export const ThumbnailImage = memo(({
  src,
  alt,
  size = 'md',
  className,
}: {
  src: string | undefined | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[size];

  return (
    <FastImage
      src={src}
      alt={alt}
      aspectRatio="square"
      priority={true}
      className={cn('rounded-lg', className)}
      containerClassName={cn('rounded-lg', sizeClass)}
    />
  );
});
ThumbnailImage.displayName = 'ThumbnailImage';

export default FastImage;
