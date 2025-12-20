import { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { isValidProductImageUrl } from '@/utils/productImageHelper';

interface OptimizedImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  showLoader?: boolean; // kept for API compatibility (ignored)
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component - displays ONLY valid Supabase product images
 * No placeholder, no fallback - products without valid images are filtered at DB level
 */
export const OptimizedImage = ({
  src,
  alt,
  className,
  containerClassName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showLoader = false,
  aspectRatio = 'square',
  objectFit = 'cover',
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  }[aspectRatio];

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
  }[objectFit];

  const isValid = isValidProductImageUrl(src);
  
  // If no valid image, render nothing (products should be filtered at DB level)
  if (!isValid) {
    return null;
  }

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    // Hide the container if image fails to load
    if (imgRef.current?.parentElement) {
      imgRef.current.parentElement.style.display = 'none';
    }
    onError?.();
  }, [onError]);

  return (
    <div className={cn('relative overflow-hidden bg-muted/5', aspectRatioClass, containerClassName)}>
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/10 animate-pulse" />
      )}
      
      <img
        ref={imgRef}
        src={src as string}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          'w-full h-full transition-opacity duration-200',
          objectFitClass,
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

// Product card image - clean display only for valid images
export const ProductImage = ({
  src,
  alt,
  className,
  aspectRatio = 'product',
}: {
  src: string | undefined | null;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'product' | 'portrait';
}) => {
  const aspectClass = aspectRatio === 'product' ? 'aspect-[4/5]' : aspectRatio === 'portrait' ? 'aspect-[3/4]' : 'aspect-square';
  
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio="auto"
      objectFit="contain"
      className={cn('rounded-t-2xl bg-white', className)}
      containerClassName={cn('rounded-t-2xl bg-white', aspectClass)}
    />
  );
};

// Gallery image for product detail
export const GalleryImage = ({
  src,
  alt,
  className,
  onClick,
}: {
  src: string | undefined | null;
  alt: string;
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <div onClick={onClick} className={cn('cursor-pointer', onClick && 'hover:opacity-90 transition-opacity')}>
      <OptimizedImage
        src={src}
        alt={alt}
        aspectRatio="auto"
        objectFit="cover"
        className={cn('rounded-lg', className)}
        containerClassName="rounded-lg"
      />
    </div>
  );
};

export default OptimizedImage;
