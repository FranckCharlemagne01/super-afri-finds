// Djassa Marketplace - Index Page (v5 - Design Enhanced)
import { ProductCard } from "@/components/ProductCard";
import SEOHead from "@/components/SEOHead";
import { CategoryCard } from "@/components/CategoryCard";
import { SearchBar } from "@/components/SearchBar";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { MobileHamburgerMenu } from "@/components/MobileHamburgerMenu";

import { FloatingSupportButton } from "@/components/FloatingSupportButton";
import FAQ from "@/components/FAQ";
import { SellerCTABanner } from "@/components/SellerCTABanner";
import { FlashSalesCarousel } from "@/components/FlashSalesCarousel";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { DesktopHeroSection } from "@/components/desktop/DesktopHeroSection";
import { TrustBadgesSection } from "@/components/desktop/TrustBadgesSection";
import { useTheme } from "next-themes";

import { PopularCategories } from "@/components/PopularCategories";
import { MarketplaceTutorial } from "@/components/MarketplaceTutorial";
import { NotificationBell } from "@/components/NotificationBell";
import { ProductSkeleton } from "@/components/ui/ProductSkeleton";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache, isStale, CACHE_KEYS } from "@/utils/dataCache";
import { usePrefetchVisibleProducts, setCachedProduct } from "@/hooks/useProductCache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStableAuth } from "@/hooks/useStableAuth";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useStableRole } from "@/hooks/useStableRole";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useUserLocation } from "@/hooks/useUserLocation";
import { RealtimeNotificationBadge } from "@/components/RealtimeNotificationBadge";
import { useNavigate, useLocation } from "react-router-dom";
import { SellerUpgradeForm } from "@/components/SellerUpgradeForm";

import { getCountryByCode } from "@/data/countries";
import { 
  Smartphone, 
  Shirt, 
  Headphones, 
  Home, 
  Car, 
  Gamepad2,
  Search,
  ShoppingCart,
  Menu,
  User,
  Heart,
  Tv,
  Sparkles,
  ShoppingBag,
  ArrowLeft,
  MapPin
} from "lucide-react";

// Import product images
import productPhone from "@/assets/product-phone.jpg";
import productClothing from "@/assets/product-clothing.jpg";
import productHeadphones from "@/assets/product-headphones.jpg";
import productBlender from "@/assets/product-blender.jpg";
import { getProductImage } from "@/utils/productImageHelper";

// Import category images
import categoryPhones from "@/assets/category-phones.jpg";
import categoryElectronics from "@/assets/category-electronics.jpg";
import categoryFashion from "@/assets/category-fashion.jpg";
import categoryHome from "@/assets/category-home.jpg";
import categoryBeauty from "@/assets/category-beauty.jpg";
import categoryGrocery from "@/assets/category-grocery.jpg";
import categoryAuto from "@/assets/category-auto.jpg";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category: string;
  images?: string[];
  seller_id: string;
  rating?: number;
  reviews_count?: number;
  badge?: string;
  is_flash_sale?: boolean;
  stock_quantity?: number;
  video_url?: string;
  is_boosted?: boolean;
  boosted_until?: string;
  shop_id?: string;
  seller_shops?: {
    shop_slug: string;
    shop_name: string;
  };
}

const Index = () => {
  // Marketplace component
  const { user, signOut } = useStableAuth();
  const { cartCount } = useCart();
  const { favoriteIds } = useFavorites();
  const { role, loading: roleLoading, isSuperAdmin, isSeller } = useStableRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  const { setTheme } = useTheme();

  // Force light mode on public marketplace
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);
  
  // ✅ Try to get products from cache IMMEDIATELY for instant display
  const cachedProducts = useMemo(() => getCached<Product[]>(CACHE_KEYS.PRODUCTS), []);
  const [products, setProducts] = useState<Product[]>(cachedProducts || []);
  const [loading, setLoading] = useState(!cachedProducts);
  
  const [showSellerUpgrade, setShowSellerUpgrade] = useState(false);
  const { location: userLocation } = useUserLocation();
  const { isVisible: isHeaderVisible } = useScrollDirection();

  // Derive country code for compact display
  const countryInfo = useMemo(() => {
    if (userLocation.country) {
      const c = getCountryByCode(userLocation.country);
      if (c) return { code: c.code, flag: c.flag, name: c.name };
    }
    return { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire" };
  }, [userLocation.country]);

  const locationLabel = useMemo(() => {
    const city = userLocation.city || userLocation.commune;
    if (city) return `${city}, ${countryInfo.code}`;
    return countryInfo.code;
  }, [userLocation.city, userLocation.commune, countryInfo.code]);

  const handleProfileClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Attendre que le rôle soit chargé avant de rediriger
    if (roleLoading) {
      return;
    }

    if (isSuperAdmin) {
      navigate('/superadmin');
    } else if (isSeller) {
      navigate('/seller-dashboard');
    } else {
      navigate('/buyer-dashboard');
    }
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleFavoritesClick = () => {
    navigate('/favorites');
  };

  const handleViewAllCategories = () => {
    navigate('/categories');
  };

  const handleLogoClick = () => {
    const isOnMarketplace = location.pathname === '/marketplace';
    
    if (!isOnMarketplace) {
      // Si on n'est pas sur la marketplace, y rediriger
      navigate('/marketplace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // On est sur la marketplace
    const isAtTop = window.scrollY < 100;
    
    if (isAtTop) {
      // Actualiser les produits
      fetchProducts();
    } else {
      // Remonter en haut
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ✅ Fast initial load - refetch when city changes
  const prevCityRef = useRef(userLocation.city);
  useEffect(() => {
    const cityChanged = prevCityRef.current !== userLocation.city;
    prevCityRef.current = userLocation.city;

    // If city changed, always force refetch
    if (cityChanged) {
      fetchProducts(true);
      return;
    }

    // If we have cached data, just check if it's stale for background refresh
    if (cachedProducts && !isStale(CACHE_KEYS.PRODUCTS)) {
      setLoading(false);
      return;
    }
    
    fetchProducts();
  }, [user, userLocation.city, userLocation.country]);


  // City-aware cache key
  const productsCacheKey = userLocation.city 
    ? `${CACHE_KEYS.PRODUCTS}:city:${userLocation.city.toLowerCase()}` 
    : CACHE_KEYS.PRODUCTS;

  const fetchFromServer = useCallback(async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          shop:seller_shops!shop_id(shop_slug, shop_name)
        `)
        .eq('is_active', true);

      // Filter by user's city (case-insensitive)
      if (userLocation.city) {
        query = query.ilike('city', userLocation.city);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('Error fetching products:', error);
        return;
      }
      
      const products = data || [];
      setProducts(products);
      setCache(productsCacheKey, products, 2 * 60 * 1000); // 2 min cache
      
      // ✅ Cache individual products for instant product detail navigation
      products.slice(0, 24).forEach((product: Product) => {
        setCachedProduct(product);
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [userLocation.city, productsCacheKey]);

  // Optimized fetch with caching - invalidate when city changes
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    // Check cache first (instant response)
    if (!forceRefresh) {
      const cached = getCached<Product[]>(productsCacheKey);
      if (cached !== null) {
        setProducts(cached);
        setLoading(false);
        
        // Background revalidation if stale
        if (isStale(productsCacheKey)) {
          fetchFromServer();
        }
        return;
      }
    }
    
    await fetchFromServer();
  }, [userLocation.city, productsCacheKey, fetchFromServer]);

  // Listen for refresh event from bottom nav (avoids full page reload)
  useEffect(() => {
    const handleRefresh = () => fetchProducts(true);
    window.addEventListener('djassa:refresh-products', handleRefresh);
    return () => window.removeEventListener('djassa:refresh-products', handleRefresh);
  }, [fetchProducts]);

  const handleRefreshRecommendations = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);
  const categories = [
    { title: "Téléphones & Tablettes", itemCount: 1250, image: categoryPhones, slug: "Téléphones & Tablettes" },
    { title: "Électroménager / TV & Audio", itemCount: 890, image: categoryElectronics, slug: "Électroménager" },
    { title: "Vêtements & Chaussures", itemCount: 1450, image: categoryFashion, slug: "Mode" },
    { title: "Maison & Décoration", itemCount: 1100, image: categoryHome, slug: "Maison" },
    { title: "Beauté & Soins personnels", itemCount: 675, image: categoryBeauty, slug: "Beauté" },
    { title: "Épicerie & Produits alimentaires", itemCount: 820, image: categoryGrocery, slug: "Épicerie" },
    { title: "Auto & Accessoires", itemCount: 340, image: categoryAuto, slug: "Auto" },
    { title: "Sport & Loisirs", itemCount: 540, image: categoryElectronics, slug: "Sport" },
  ];
  
  // Use the real products from data file with correct UUIDs
  // Mélanger les produits pour les recommandations avec refreshKey
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const displayProducts = products;
  const shuffledProducts = refreshKey > 0 ? shuffleArray(products) : products;
  
  // Filtrer les produits boostés actifs
  const boostedProducts = products.filter(product => 
    product.is_boosted && 
    product.boosted_until && 
    new Date(product.boosted_until) > new Date()
  );
  
  // Filtrer les produits en vente flash
  const flashSaleProducts = products.filter(product => product.is_flash_sale);
  
  // Combiner produits boostés et flash sale pour la section "Offres Spéciales"
  const specialOffersProducts = [...boostedProducts, ...flashSaleProducts.filter(p => !boostedProducts.find(b => b.id === p.id))];
  
  const regularProducts = products.filter(product => !product.is_flash_sale && !boostedProducts.find(b => b.id === product.id));

  // ✅ Prefetch first 12 visible products for instant navigation
  const visibleProductIds = useMemo(() => 
    regularProducts.slice(0, 12).map(p => p.id),
    [regularProducts]
  );
  usePrefetchVisibleProducts(visibleProductIds);

  // Convert Supabase product to ProductCard props
  const convertToProductCardProps = (product: any) => ({
    id: product.id,
    image: getProductImage(product.images, 0),
    images: product.images,
    title: product.title,
    originalPrice: product.original_price || product.price,
    salePrice: product.price,
    discount: product.discount_percentage || 0,
    rating: product.rating || 0,
    reviews: product.reviews_count || 0,
    badge: product.badge,
    shop_slug: product.shop?.shop_slug,
    shop_name: product.shop?.shop_name,
    isFlashSale: product.is_flash_sale || false,
    seller_id: product.seller_id,
    videoUrl: product.video_url,
    isBoosted: product.is_boosted || false,
    boostedUntil: product.boosted_until,
    stockQuantity: product.stock_quantity,
    isSold: product.is_sold || false,
    isActive: product.is_active,
    description: product.description,
  });

  // Afficher le formulaire de mise à niveau vendeur pour les utilisateurs connectés
  if (showSellerUpgrade && user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => setShowSellerUpgrade(false)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
          <SellerUpgradeForm 
            onSuccess={() => {
              setShowSellerUpgrade(false);
              // Le SellerUpgradeForm gère la redirection directement
            }} 
          />
        </div>
      </div>
    );
  }

  // ✅ Skip skeleton entirely if we have cached products - show content immediately
  // Only show minimal skeleton if truly no data available
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto px-3 py-4">
          <ProductSkeleton count={8} columns={4} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Head */}
      <SEOHead 
        title="Djassa – Marketplace Locale Africaine | Boutique en Ligne Gratuite"
        description="Djassa permet aux commerçants africains de créer automatiquement leur boutique en ligne dès l'inscription. Gérez vos ventes et profitez de commissions réduites jusqu'à 95%."
        keywords="marketplace Côte d'Ivoire, achat en ligne Abidjan, vente en ligne, téléphones, vêtements, électronique, beauté, livraison Côte d'Ivoire"
        url="/marketplace"
      />
      
      {/* Tutorial Overlay */}
      <MarketplaceTutorial />
      
      <div className="min-h-screen bg-background pb-20 md:pb-8 overflow-x-hidden">
      {/* Header - Visible at top, hides on scroll down, reappears on scroll up */}
      <header 
        className={`
          sticky top-0 z-50 bg-background/95 backdrop-blur-md shadow-sm border-b border-border/50
          transition-transform duration-300 ease-out
          ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        {/* === MOBILE HEADER === */}
        <div className="md:hidden">
          {/* Row 1: Logo + Location + Icons */}
          <div className="px-3 pt-2.5 pb-1.5 flex items-center gap-2">
            <MobileHamburgerMenu />
            <h1 
              className="text-xl font-extrabold gradient-text-primary cursor-pointer transition-transform active:scale-95 whitespace-nowrap tracking-tight" 
              onClick={handleLogoClick}
            >
              Djassa
            </h1>

            {/* Location badge - more prominent */}
            <button 
              onClick={() => navigate('/categories')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary active:bg-primary/20 transition-colors flex-shrink-0"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold truncate max-w-[90px]">{locationLabel}</span>
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Quick icons - bigger touch targets */}
            {user && <NotificationBell />}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative w-10 h-10 p-0 rounded-full" 
              onClick={handleCartClick}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[hsl(var(--promo))] text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10 p-0 rounded-full" 
              onClick={handleProfileClick}
            >
              <User className={`w-5 h-5 ${user ? 'text-primary' : ''}`} />
            </Button>
          </div>

          {/* Row 2: Full-width search bar */}
          <div className="px-3 pb-2">
            <SearchBar placeholder="Rechercher des produits..." />
          </div>
        </div>

        {/* === DESKTOP HEADER === */}
        <div className="hidden md:block">
          <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-3 lg:py-4 max-w-[1600px]">
            <div className="flex items-center gap-4 lg:gap-6">
              <h1 
                className="text-xl lg:text-2xl xl:text-3xl font-bold gradient-text-primary cursor-pointer transition-transform active:scale-95 hover:opacity-90 whitespace-nowrap" 
                onClick={handleLogoClick}
              >
                Djassa
              </h1>
              
              <div className="flex-1 lg:max-w-xl xl:max-w-2xl lg:mx-auto">
                <SearchBar placeholder="Rechercher des produits..." />
              </div>
              
              <nav className="hidden lg:flex items-center gap-1">
                {[
                  { label: "Accueil", path: "/" },
                  { label: "Produits", path: "/categories" },
                  ...(isSuperAdmin ? [{ label: "Livraison", path: "/livraison" }] : []),
                  { label: "Tarifs", path: "/tarifs" },
                  { label: "À propos", path: "/about" },
                ].map(({ label, path }) => (
                  <Button
                    key={path}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(path)}
                    className={`text-sm font-medium rounded-xl px-3 py-2 transition-colors ${
                      location.pathname === path
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {label}
                  </Button>
                ))}
              </nav>

              <div className="flex items-center gap-3 lg:gap-4">
                <Badge className="gradient-accent text-xs lg:text-sm px-3 py-1.5 rounded-full shadow-sm">
                  {countryInfo.flag} {countryInfo.name}
                </Badge>
                
                {user && <NotificationBell />}
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative p-2 min-w-[44px] min-h-[44px] rounded-xl hover:bg-muted/80 transition-colors" 
                  onClick={handleFavoritesClick}
                >
                  <Heart className={`w-5 h-5 lg:w-6 lg:h-6 ${favoriteIds.length > 0 ? 'fill-current text-promo' : ''}`} />
                  <RealtimeNotificationBadge count={favoriteIds.length} className="bg-promo text-white" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative p-2 min-w-[44px] min-h-[44px] rounded-xl hover:bg-muted/80 transition-colors" 
                  onClick={handleCartClick}
                >
                  <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" />
                  <RealtimeNotificationBadge count={cartCount} className="bg-promo text-white" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="p-2 min-w-[44px] min-h-[44px] rounded-xl hover:bg-muted/80 transition-colors" 
                  onClick={handleProfileClick}
                >
                  <User className={`w-5 h-5 lg:w-6 lg:h-6 ${user ? 'text-primary' : ''}`} />
                </Button>
                {isSuperAdmin && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => navigate('/superadmin')}
                    className="text-xs lg:text-sm min-h-[40px] px-4 rounded-xl bg-primary hover:bg-primary/90 shadow-sm"
                  >
                    Retour au Dashboard
                  </Button>
                )}
                {user && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={signOut} 
                    className="text-xs lg:text-sm min-h-[40px] px-4 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    Déconnexion
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Top CTA Banner - tablet only (hidden on lg+ since hero takes over) */}
      <div className="hidden md:block lg:hidden">
        <SellerCTABanner variant="top" onShowSellerUpgrade={() => setShowSellerUpgrade(true)} />
      </div>

      {/* Desktop premium hero (lg+) */}
      <DesktopHeroSection onShowSellerUpgrade={() => setShowSellerUpgrade(true)} />

      {/* Desktop trust strip (lg+) */}
      <TrustBadgesSection />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-8 xl:px-12 py-3 sm:py-6 lg:py-8 max-w-[1600px] overflow-x-hidden">
        
        {/* Flash Sales - Horizontal Carousel */}
        <div data-section="flash-sales">
          <FlashSalesCarousel products={specialOffersProducts} />
        </div>

        {/* Catégories - Hidden on mobile to focus on products */}
        <section className="hidden sm:block mb-5 sm:mb-8 lg:mb-12">
          <PopularCategories />
        </section>

        {/* Produits Recommandés - Grid */}
        <section className="mb-5 sm:mb-8 lg:mb-12">
          <div className="flex items-center justify-between mb-3 lg:mb-6">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-[hsl(16,100%,50%)] rounded-xl flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-foreground">Recommandés</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefreshRecommendations} 
              className="text-xs hover:text-primary transition-colors px-3 h-8 rounded-lg active:scale-95"
            >
              Actualiser
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-4 lg:gap-5 xl:gap-6" key={refreshKey}>
            {shuffledProducts.slice(0, 12).map((product, index) => (
              <div 
                key={`${product.id}-${refreshKey}`} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ProductCard {...convertToProductCardProps(product)} />
              </div>
            ))}
          </div>
        </section>

        {/* CTA Vendeur - Hidden on mobile */}
        <div className="hidden sm:block">
          <SellerCTABanner variant="bottom" onShowSellerUpgrade={() => setShowSellerUpgrade(true)} />
        </div>

        {/* Tendances du moment - Grid (mobile + tablet only; on desktop "Recommandés" already covers it to avoid duplication) */}
        <section className="mb-5 sm:mb-8 lg:hidden">
          <div className="flex items-center justify-between mb-3 lg:mb-6">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[hsl(var(--success))] to-[hsl(134,61%,35%)] rounded-xl flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-foreground">
                Tendances
              </h2>
            </div>
            <Badge variant="outline" className="text-[10px] sm:text-xs rounded-lg px-2.5 py-0.5">
              {regularProducts.length} produits
            </Badge>
          </div>
          
          {regularProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-4 lg:gap-5 xl:gap-6">
              {regularProducts.map((product, index) => (
                <div 
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <ProductCard {...convertToProductCardProps(product)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-muted/30 rounded-2xl border border-border/50">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {userLocation.city 
                  ? `Aucun produit disponible à ${userLocation.city} pour le moment`
                  : 'Aucun produit disponible pour le moment'}
              </p>
            </div>
          )}
        </section>

        {/* Section vendeur - data attribute conservé pour le scroll programmatique */}
        <section className="mb-6" data-seller-upgrade />
      </main>

      {/* FAQ Section - Hidden on mobile/tablet */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-[1600px]">
          <FAQ />
        </div>
      </div>

      {/* Footer */}
      <MarketplaceFooter />

      {/* Floating elements */}
      <FloatingSupportButton />
      <ScrollToTopButton />
    </div>
    </>
  );
};

export default Index;