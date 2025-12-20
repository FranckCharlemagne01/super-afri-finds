import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { isValidProductImageUrl } from '@/utils/productImageHelper';

interface OptimizedImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  showLoader?: boolean;
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
  showLoader = true,
  aspectRatio = 'square',
  objectFit = 'cover',
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const imgRef = useRef<HTMLImageElement>(null);

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
  const displaySrc = isValid ? (src as string) : PLACEHOLDER;

  // If no valid image, show placeholder immediately without loader
  const [isLoading, setIsLoading] = useState(isValid);

  useEffect(() => {
    // Reset loader only for real images; placeholder should render immediately.
    setIsLoading(isValid);
  }, [src, isValid]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    // Switch to placeholder (neutral, no overlay).
    setIsLoading(false);
    if (imgRef.current) imgRef.current.src = PLACEHOLDER;
    onError?.();
  };

  // If no valid image, render clean placeholder immediately
  if (!isValid) {
    return (
      <div className={cn('relative overflow-hidden bg-muted/5', aspectRatioClass, containerClassName)}>
        <img
          src={PLACEHOLDER}
          alt={alt}
          className={cn('w-full h-full', objectFitClass, className)}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-muted/10', aspectRatioClass, containerClassName)}>
      {showLoader && isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/20">
          <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
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
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
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
