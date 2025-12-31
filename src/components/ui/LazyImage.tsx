import React, { memo, forwardRef, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  blurPlaceholder?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
}

/**
 * Optimized image component with:
 * - Native lazy loading
 * - Intersection Observer for eager loading on scroll
 * - Error handling with fallback
 * - Optional blur placeholder
 */
export const LazyImage = memo(forwardRef<HTMLImageElement, LazyImageProps>(function LazyImage(
  {
    src,
    alt,
    fallback = '/placeholder.svg',
    blurPlaceholder = false,
    aspectRatio = 'auto',
    className,
    onError,
    onLoad,
    ...props
  },
  ref
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Merge refs
  const mergedRef = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  // Use Intersection Observer for smarter lazy loading
  useEffect(() => {
    const img = imgRef.current;
    if (!img || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px 0px', // Start loading 100px before visible
        threshold: 0.01,
      }
    );

    observer.observe(img);

    return () => observer.disconnect();
  }, [isInView]);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onLoad?.(e);
  }, [onLoad]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoaded(true);
    onError?.(e);
  }, [onError]);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  };

  const imageSrc = hasError ? fallback : (isInView ? src : undefined);

  return (
    <div className={cn('relative overflow-hidden', aspectClasses[aspectRatio])}>
      {/* Blur placeholder */}
      {blurPlaceholder && !isLoaded && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse" />
      )}
      
      <img
        ref={mergedRef}
        src={imageSrc}
        data-src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
    </div>
  );
}));

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images with priority
 */
export async function preloadImages(sources: string[], concurrent = 3): Promise<void> {
  const chunks: string[][] = [];
  for (let i = 0; i < sources.length; i += concurrent) {
    chunks.push(sources.slice(i, i + concurrent));
  }

  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(preloadImage));
  }
}
