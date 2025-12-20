import { useRef } from 'react';
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

  const handleLoad = () => {
    onLoad?.();
  };

  const handleError = () => {
    // Neutral fallback only (no overlay, no error UI)
    if (imgRef.current) imgRef.current.src = PLACEHOLDER;
    onError?.();
  };

  return (
    <div className={cn('relative overflow-hidden bg-muted/5', aspectRatioClass, containerClassName)}>
      <img
        ref={imgRef}
        src={displaySrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn('w-full h-full', objectFitClass, className)}
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
