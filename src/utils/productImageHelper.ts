/**
 * Product Image Helper - STRICT image handling for Djassa Marketplace
 * Only accepts valid Supabase product-images URLs - NO workarounds
 */

const SUPABASE_STORAGE_PREFIX = 'https://zqskpspbyzptzjcoitwt.supabase.co/storage/v1/object/public/product-images/';
const PLACEHOLDER_IMAGE = '/placeholder.svg';

/**
 * Check if a URL is a valid Supabase product-images URL
 */
export const isValidProductImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
  return trimmed.startsWith(SUPABASE_STORAGE_PREFIX);
};

/**
 * Legacy compatibility - same behavior as isValidProductImageUrl
 */
export const isValidImageUrl = isValidProductImageUrl;

/**
 * Get a single validated image from product images array
 * Returns placeholder if no valid image exists
 */
export const getProductImage = (
  images: string[] | null | undefined,
  index: number = 0
): string => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return PLACEHOLDER_IMAGE;
  }

  // Find first valid image at or after the requested index
  for (let i = index; i < images.length; i++) {
    if (isValidProductImageUrl(images[i])) {
      return images[i];
    }
  }

  // Fallback: find any valid image in array
  const validImage = images.find(img => isValidProductImageUrl(img));
  return validImage || PLACEHOLDER_IMAGE;
};

/**
 * Get all valid images from product images array
 */
export const getProductImages = (
  images: string[] | null | undefined
): string[] => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [];
  }
  return images.filter(img => isValidProductImageUrl(img));
};

/**
 * Check if product has at least one valid image
 */
export const hasValidImage = (images: string[] | null | undefined): boolean => {
  return getProductImages(images).length > 0;
};

/**
 * Handle image load error - switch to placeholder
 * Fallback should be rare since DB validation now prevents bad URLs
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>
): void => {
  const target = event.currentTarget;
  if (target.src !== PLACEHOLDER_IMAGE) {
    console.warn(`[Image Error] Failed to load: ${target.src}`);
    target.src = PLACEHOLDER_IMAGE;
  }
};

/**
 * Create safe image props for consistent usage
 */
export const getSafeImageProps = (
  src: string | undefined | null,
  alt: string
) => ({
  src: isValidProductImageUrl(src) ? src : PLACEHOLDER_IMAGE,
  alt,
  onError: handleImageError,
});

export default getProductImage;
