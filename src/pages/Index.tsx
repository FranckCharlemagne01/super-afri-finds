// Djassa Marketplace - Index Page (v2)
import { ProductCard } from "@/components/ProductCard";
import SEOHead from "@/components/SEOHead";
import { CategoryCard } from "@/components/CategoryCard";
import { SearchBar } from "@/components/SearchBar";
import PromoBanner from "@/components/PromoBanner";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { HelpButton } from "@/components/HelpButton";
import { MobileInfoDrawer } from "@/components/MobileInfoDrawer";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import FAQ from "@/components/FAQ";

import { CategorySidebar } from "@/components/CategorySidebar";
import { PopularCategories } from "@/components/PopularCategories";
import { FeaturedProductsGrid } from "@/components/FeaturedProductsGrid";
import { DynamicPromoBanner } from "@/components/DynamicPromoBanner";
import { NativeAnnouncementSlider } from "@/components/NativeAnnouncementSlider";
import { MarketplaceTutorial } from "@/components/MarketplaceTutorial";
import { NotificationBell } from "@/components/NotificationBell";
import { useState, useEffect, useMemo } from "react";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { supabase } from "@/integrations/supabase/client";
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
import { useRef } from "react";
import { getCountryName } from "@/data/countries";
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
  ArrowLeft
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSellerUpgrade, setShowSellerUpgrade] = useState(false);
  const [userCountry, setUserCountry] = useState<string>("Côte d'Ivoire");
  const { location: userLocation } = useUserLocation();
  const { isVisible: isHeaderVisible } = useScrollDirection();

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

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchUserCountry();
    }
  }, [user, userLocation.city, userLocation.country]);

  const fetchUserCountry = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user country:', error);
        return;
      }
      
      if (data?.country) {
        const countryName = getCountryName(data.country);
        setUserCountry(countryName);
      }
    } catch (error) {
      console.error('Error fetching user country:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          shop:seller_shops!shop_id(shop_slug, shop_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching products:', error);
        return;
      }
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRecommendations = () => {
    setRefreshKey(prev => prev + 1);
    console.log('Recommandations actualisées');
  };
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

  // Convert Supabase product to ProductCard props
  const convertToProductCardProps = (product: any) => ({
    id: product.id,
    image: getProductImage(product.images, 0),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Head */}
      <SEOHead 
        title="Marketplace"
        description="Découvrez les meilleures offres sur Djassa Marketplace. Achetez en ligne des téléphones, vêtements, électronique et plus en Côte d'Ivoire. Livraison rapide à Abidjan, Bouaké, Yamoussoukro."
        keywords="marketplace Côte d'Ivoire, achat en ligne Abidjan, vente en ligne, téléphones, vêtements, électronique, beauté, livraison Côte d'Ivoire"
        url="/marketplace"
      />
      
      {/* Tutorial Overlay */}
      <MarketplaceTutorial />
      
      <div className="min-h-screen bg-background pb-20 md:pb-8 overflow-x-hidden">
      {/* Header - Desktop: always visible sticky, Mobile: hide on scroll down, show on scroll up */}
      <header 
        className={`
          sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-border/50
          transition-transform duration-300 ease-out
          md:translate-y-0
          ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'}
        `}
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 xl:px-12 py-2.5 sm:py-3 lg:py-4 max-w-[1600px]">
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
            {/* Logo Djassa */}
            <h1 
              className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold gradient-text-primary cursor-pointer transition-transform active:scale-95 hover:opacity-90 whitespace-nowrap" 
              onClick={handleLogoClick}
            >
              Djassa
            </h1>
            
            {/* Search Bar - Centered and wider on desktop */}
            <div className="flex-1 lg:max-w-xl xl:max-w-2xl lg:mx-auto">
              <SearchBar placeholder="Rechercher des produits..." />
            </div>
            
            {/* Mobile/Tablet Help Button, Notification Bell & Info Menu */}
            <div className="md:hidden flex items-center gap-0.5">
              <HelpButton />
              {user && <NotificationBell />}
              <MobileInfoDrawer />
            </div>

            {/* Desktop Icons Only - Enhanced spacing */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              <Badge className="gradient-accent text-xs lg:text-sm px-3 py-1.5 rounded-full shadow-sm">
                {userCountry}
              </Badge>
              
              {/* Notification Bell */}
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
      </header>

      {/* Native Announcement Slider - Mobile App Style */}
      <NativeAnnouncementSlider />

      {/* Main Content - Enhanced for desktop */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-8 xl:px-12 py-4 sm:py-6 lg:py-8 max-w-[1600px] overflow-x-hidden">
        {specialOffersProducts.length > 0 && (
          <section className="mb-6 sm:mb-8 lg:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-4 mb-4 lg:mb-6">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 gradient-primary rounded-xl flex items-center justify-center animate-pulse shadow-md">
                  <span className="text-white text-sm sm:text-base lg:text-lg">⚡</span>
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">Offres Spéciales</h2>
              </div>
              <Badge className="bg-promo text-promo-foreground animate-pulse-promo w-fit text-[10px] sm:text-xs lg:text-sm rounded-lg lg:rounded-xl px-3 lg:px-4 py-1 lg:py-1.5">
                Limitées dans le temps
              </Badge>
              <div className="sm:ml-auto">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/flash-sales')} 
                  className="text-xs lg:text-sm hover:text-primary transition-colors px-3 lg:px-4 h-9 lg:h-10 rounded-lg active:scale-95"
                >
                  Voir tout →
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
              {specialOffersProducts.slice(0, 12).map((product, index) => (
                <div 
                  key={product.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <ProductCard {...convertToProductCardProps(product)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bannière statique promotionnelle */}
        <section className="mb-6 sm:mb-8 lg:mb-12">
          <DynamicPromoBanner />
        </section>


        {/* Catégories populaires */}
        <section className="mb-6 sm:mb-8 lg:mb-12">
          <PopularCategories />
        </section>

        {/* Produits Recommandés */}
        <section className="mb-6 sm:mb-8 lg:mb-12">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">Recommandés pour vous</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefreshRecommendations} 
              className="text-xs lg:text-sm hover:text-primary transition-colors px-3 lg:px-4 h-9 lg:h-10 rounded-lg active:scale-95"
            >
              Actualiser
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 xl:gap-6" key={refreshKey}>
            {shuffledProducts.slice(0, 12).map((product, index) => (
              <div 
                key={`${product.id}-${refreshKey}`} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <ProductCard {...convertToProductCardProps(product)} />
              </div>
            ))}
          </div>
        </section>

        {/* Tendances du moment */}
        <section className="mb-6 sm:mb-8 lg:mb-12">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
              Tendances du moment
            </h2>
            <Badge variant="outline" className="text-xs lg:text-sm rounded-lg lg:rounded-xl px-3 lg:px-4 py-1 lg:py-1.5">
              {regularProducts.length} produits
            </Badge>
          </div>
          
          {regularProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
              {regularProducts.map((product, index) => (
                <div 
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <ProductCard {...convertToProductCardProps(product)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">Aucun produit disponible pour le moment</p>
            </div>
          )}
        </section>

        {/* Section vendeur - data attribute conservé pour le scroll programmatique */}
        <section className="mb-6 sm:mb-8 lg:mb-12" data-seller-upgrade />
      </main>

      {/* FAQ Section - Hidden on mobile/tablet, enhanced for desktop */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-[1600px]">
          <FAQ />
        </div>
      </div>

      {/* Footer - Enhanced for desktop */}
      <footer className="hidden md:block bg-secondary mt-8 lg:mt-16 py-10 lg:py-14 border-t">
        <div className="container mx-auto px-4 lg:px-8 xl:px-12 max-w-[1600px]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10 lg:mb-12">
            <div>
              <h4 className="font-semibold mb-4 text-sm lg:text-base text-foreground">Assistance</h4>
              <ul className="space-y-3">
                <li>
                  <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Centre d'aide
                  </button>
                </li>
                <li>
                  <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Support 24/7
                  </button>
                </li>
                <li>
                  <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm lg:text-base text-foreground">Informations</h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => navigate("/about")}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    À propos de Djassa
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/legal")}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Politique de confidentialité
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/legal")}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Mentions légales
                  </button>
                </li>
                <li>
                  <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    CGV
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm lg:text-base text-foreground">Contact</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="mailto:djassa@djassa.tech" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Email: djassa@djassa.tech
                  </a>
                </li>
                <li>
                  <a 
                    href="https://wa.me/2250788281222" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    WhatsApp: +225 07 88 28 12 22
                  </a>
                </li>
                <li className="text-sm text-muted-foreground">Abidjan, Côte d'Ivoire</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm lg:text-base text-foreground">Paiement & Livraison</h4>
              <ul className="space-y-3">
                <li className="text-sm text-muted-foreground">Orange Money</li>
                <li className="text-sm text-muted-foreground">MTN Mobile Money</li>
                <li className="text-sm text-muted-foreground">Livraison 2-5 jours</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center">
            <p className="text-sm lg:text-base text-muted-foreground mb-2">
              © {new Date().getFullYear()} Djassa - Votre marketplace de confiance
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Fait avec ❤️ en Côte d'Ivoire 🇨🇮
            </p>
          </div>
        </div>
      </footer>

      {/* Floating elements */}
      <FloatingChatButton />
      <ScrollToTopButton />
    </div>
    </>
  );
};

export default Index;