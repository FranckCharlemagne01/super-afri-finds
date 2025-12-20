/**
 * Product Image Helper - Secure image handling for all product displays
 * Ensures no broken images are ever displayed
 */

const DEFAULT_PLACEHOLDER = '/placeholder.svg';

/**
 * Safely get the first valid image from a product's images array
 * Returns placeholder if no valid image exists
 */
export const getProductImage = (
  images: string[] | null | undefined, 
  index: number = 0,
  fallback: string = DEFAULT_PLACEHOLDER
): string => {
  // Handle null/undefined/empty arrays
  if (!images || !Array.isArray(images) || images.length === 0) {
    return fallback;
  }
  
  // Get the image at the specified index, or fallback
  const image = images[index];
  
  // Validate the image URL
  if (!image || typeof image !== 'string' || image.trim() === '') {
    // Try to find any valid image in the array
    const validImage = images.find(img => isValidImageUrl(img));
    return validImage || fallback;
  }
  
  return isValidImageUrl(image) ? image : fallback;
};

/**
 * Get all valid images from a product's images array
 */
export const getProductImages = (
  images: string[] | null | undefined,
  fallback: string = DEFAULT_PLACEHOLDER
): string[] => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [fallback];
  }
  
  const validImages = images.filter(img => isValidImageUrl(img));
  
  return validImages.length > 0 ? validImages : [fallback];
};

/**
 * Check if a URL is a valid image URL
 */
export const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (url.trim() === '') return false;
  
  // Check for common invalid patterns
  if (url === 'undefined' || url === 'null' || url === 'NULL') return false;
  
  // Allow data URLs, blob URLs, and http(s) URLs
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('blob:')) return true;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  if (url.startsWith('/')) return true; // Relative URLs
  
  return false;
};

/**
 * Handle image load error with fallback
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = DEFAULT_PLACEHOLDER
): void => {
  const target = event.currentTarget;
  // Prevent infinite loop
  if (target.src !== fallback) {
    target.src = fallback;
  }
};

/**
 * Create a safe image props object
 */
export const getSafeImageProps = (
  src: string | undefined | null,
  alt: string,
  fallback: string = DEFAULT_PLACEHOLDER
) => ({
  src: isValidImageUrl(src) ? src : fallback,
  alt,
  onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => handleImageError(e, fallback),
});

export default getProductImage;
