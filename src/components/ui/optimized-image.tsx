import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

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

// Centralized validation
import { isValidProductImageUrl } from '@/utils/productImageHelper';

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
  const [isLoading, setIsLoading] = useState(true);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Aspect ratio classes
  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  }[aspectRatio];

  // Object fit class
  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
  }[objectFit];

  // Determine final source
  const isValid = isValidProductImageUrl(src);
  const displaySrc = isValid ? src! : PLACEHOLDER;

  useEffect(() => {
    setIsLoading(true);
    setShowPlaceholder(!isValid);
  }, [src, isValid]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setShowPlaceholder(true);
    onError?.();
  };

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-muted/20',
        aspectRatioClass,
        containerClassName
      )}
    >
      {/* Loading state */}
      {showLoader && isLoading && !showPlaceholder && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/30">
          <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      )}

      {/* Placeholder state - clean and professional */}
      {showPlaceholder && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30">
          <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
        </div>
      )}

      {/* Image */}
      <img
        ref={imgRef}
        src={displaySrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          'w-full h-full transition-opacity duration-200',
          objectFitClass,
          (isLoading || showPlaceholder) ? 'opacity-0' : 'opacity-100',
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
