/**
 * Image optimization utilities for better performance
 */

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(baseUrl: string, sizes: number[]): string {
  return sizes
    .map(size => `${baseUrl}?w=${size} ${size}w`)
    .join(', ');
}

/**
 * Calculate optimal image dimensions based on viewport
 */
export function getOptimalImageSize(): number {
  const width = window.innerWidth;
  
  if (width <= 640) return 640;
  if (width <= 768) return 768;
  if (width <= 1024) return 1024;
  if (width <= 1280) return 1280;
  if (width <= 1536) return 1536;
  return 1920;
}

/**
 * Lazy load image with intersection observer
 */
export function lazyLoadImage(img: HTMLImageElement): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement;
          const src = target.dataset.src;
          
          if (src) {
            target.src = src;
            target.removeAttribute('data-src');
            observer.unobserve(target);
          }
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01,
    }
  );

  observer.observe(img);
}

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
 * Convert image to WebP if supported
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Get optimized image URL with format and size
 */
export async function getOptimizedImageUrl(
  url: string,
  width?: number,
  format?: 'webp' | 'jpeg' | 'png'
): Promise<string> {
  const useWebP = format === 'webp' && await supportsWebP();
  const optimalWidth = width || getOptimalImageSize();
  
  // Add query parameters for image optimization
  const params = new URLSearchParams();
  if (optimalWidth) params.append('w', optimalWidth.toString());
  if (useWebP) params.append('fm', 'webp');
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}
