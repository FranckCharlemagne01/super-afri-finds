import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackSrc?: string;
  showLoader?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill';
  onLoad?: () => void;
  onError?: () => void;
  productId?: string; // Pour le nettoyage automatique
  enableAutoCleanup?: boolean; // Active le signalement automatique des images cassées
}

const FALLBACK_IMAGE = '/placeholder.svg';

// Validate if URL is a valid image URL
const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (url.trim() === '') return false;
  
  // Check for common invalid patterns
  if (url === 'undefined' || url === 'null') return false;
  
  // Allow data URLs, blob URLs, and http(s) URLs
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('blob:')) return true;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  if (url.startsWith('/')) return true; // Relative URLs
  
  return false;
};

export const OptimizedImage = ({
  src,
  alt,
  className,
  containerClassName,
  fallbackSrc = FALLBACK_IMAGE,
  showLoader = true,
  aspectRatio = 'square',
  objectFit = 'cover',
  onLoad,
  onError,
  productId,
  enableAutoCleanup = false,
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(FALLBACK_IMAGE);
  const imgRef = useRef<HTMLImageElement>(null);
  const retryCount = useRef(0);
  const maxRetries = 2;
  const originalSrc = useRef<string | null>(null);
  const hasReportedError = useRef(false);

  // Determine the aspect ratio class
  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  }[aspectRatio];

  // Determine object fit class
  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
  }[objectFit];

  // Fonction pour signaler une image cassée en base de données
  const reportBrokenImageToDb = useCallback(async (brokenUrl: string) => {
    if (!productId || !enableAutoCleanup || hasReportedError.current) return;
    
    hasReportedError.current = true;
    
    try {
      // Import dynamique pour éviter les dépendances circulaires
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Récupérer les images actuelles du produit
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('images')
        .eq('id', productId)
        .single();

      if (fetchError || !product) return;

      // Filtrer l'image cassée
      const currentImages = product.images || [];
      const cleanedImages = currentImages.filter(
        (img: string) => !brokenUrl.includes(img) && img !== brokenUrl
      );

      // Mettre à jour si des images ont été retirées
      if (cleanedImages.length !== currentImages.length) {
        await supabase
          .from('products')
          .update({ 
            images: cleanedImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);
        
        console.log(`Auto-cleaned broken image from product ${productId}`);
      }
    } catch (error) {
      console.error('Failed to auto-clean broken image:', error);
    }
  }, [productId, enableAutoCleanup]);

  useEffect(() => {
    // Reset states when src changes
    setIsLoading(true);
    setHasError(false);
    retryCount.current = 0;
    hasReportedError.current = false;

    // Store original src for cleanup reporting
    originalSrc.current = src || null;

    // Validate and set the source
    if (isValidImageUrl(src)) {
      setCurrentSrc(src!);
    } else {
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
    }
  }, [src, fallbackSrc]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    // Retry logic for transient failures
    if (retryCount.current < maxRetries && currentSrc !== fallbackSrc) {
      retryCount.current += 1;
      // Add cache-busting parameter for retry
      const baseUrl = currentSrc.split('?')[0];
      const retryUrl = `${baseUrl}?retry=${retryCount.current}&t=${Date.now()}`;
      setCurrentSrc(retryUrl);
      return;
    }

    // Fall back to placeholder
    setHasError(true);
    setIsLoading(false);
    setCurrentSrc(fallbackSrc);
    
    // Signaler l'image cassée pour nettoyage automatique
    if (originalSrc.current && enableAutoCleanup && productId) {
      reportBrokenImageToDb(originalSrc.current);
    }
    
    onError?.();
  };

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-muted/30',
        aspectRatioClass,
        containerClassName
      )}
    >
      {/* Loading skeleton */}
      {showLoader && isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/50">
          <div className="relative">
            {/* Animated loader */}
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
        </div>
      )}

      {/* Error state overlay */}
      {hasError && currentSrc === fallbackSrc && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-muted/80 text-muted-foreground">
          <ImageOff className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-xs opacity-70">Image non disponible</span>
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          'w-full h-full transition-opacity duration-300',
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

// Simplified version for product cards with auto-cleanup support
export const ProductImage = ({
  src,
  alt,
  className,
  productId,
  enableAutoCleanup = true,
}: {
  src: string | undefined | null;
  alt: string;
  className?: string;
  productId?: string;
  enableAutoCleanup?: boolean;
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio="square"
      objectFit="cover"
      className={cn('rounded-t-lg', className)}
      containerClassName="rounded-t-lg"
      productId={productId}
      enableAutoCleanup={enableAutoCleanup}
    />
  );
};

// Gallery image for product detail with auto-cleanup support
export const GalleryImage = ({
  src,
  alt,
  className,
  onClick,
  productId,
  enableAutoCleanup = true,
}: {
  src: string | undefined | null;
  alt: string;
  className?: string;
  onClick?: () => void;
  productId?: string;
  enableAutoCleanup?: boolean;
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
        productId={productId}
        enableAutoCleanup={enableAutoCleanup}
      />
    </div>
  );
};

export default OptimizedImage;
