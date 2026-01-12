// Default branding assets for Djassa shops
import djassaDefaultLogo from '@/assets/djassa-default-logo.png';
import djassaDefaultBanner from '@/assets/djassa-default-banner.jpg';

export const SHOP_BRANDING = {
  // Default logo for all shops that don't have a custom logo
  DEFAULT_LOGO: djassaDefaultLogo,
  
  // Default banner/marquette for all shops that don't have a custom banner
  DEFAULT_BANNER: djassaDefaultBanner,
  
  // Helper functions to get shop images with fallback to defaults
  getLogoUrl: (customLogoUrl: string | null | undefined): string => {
    return customLogoUrl || djassaDefaultLogo;
  },
  
  getBannerUrl: (customBannerUrl: string | null | undefined): string => {
    return customBannerUrl || djassaDefaultBanner;
  },
  
  // Check if using default branding
  isDefaultLogo: (logoUrl: string | null | undefined): boolean => {
    return !logoUrl;
  },
  
  isDefaultBanner: (bannerUrl: string | null | undefined): boolean => {
    return !bannerUrl;
  }
};
