import { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { isValidProductImageUrl } from '@/utils/productImageHelper';
import { ImageOff } from 'lucide-react';

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

const PLACEHOLDER = '/placeholder.svg';

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
  const [hasError, setHasError] = useState(false);
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
  const displaySrc = isValid && !hasError ? (src as string) : PLACEHOLDER;

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    // Set error state and fallback to placeholder
    setHasError(true);
    if (imgRef.current && imgRef.current.src !== PLACEHOLDER) {
      imgRef.current.src = PLACEHOLDER;
    }
    onError?.();
  }, [onError]);

  return (
    <div className={cn('relative overflow-hidden bg-muted/10', aspectRatioClass, containerClassName)}>
      {/* Show subtle loading state */}
      {!isLoaded && !hasError && isValid && (
        <div className="absolute inset-0 bg-muted/20 animate-pulse" />
      )}
      
      <img
        ref={imgRef}
        src={displaySrc}
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
      
      {/* Show broken image indicator for errors on valid URLs */}
      {hasError && isValid && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <ImageOff className="w-8 h-8 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
};

// Product card image - clean and consistent
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
