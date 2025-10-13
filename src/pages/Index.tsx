
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { SearchBar } from "@/components/SearchBar";
import PromoBanner from "@/components/PromoBanner";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { HelpButton } from "@/components/HelpButton";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import FAQ from "@/components/FAQ";
import { HeroCarousel } from "@/components/HeroCarousel";
import { CategorySidebar } from "@/components/CategorySidebar";
import { PopularCategories } from "@/components/PopularCategories";
import { FeaturedProductsGrid } from "@/components/FeaturedProductsGrid";
import { DynamicPromoBanner } from "@/components/DynamicPromoBanner";
import { ScrollingAnnouncementBanner } from "@/components/ScrollingAnnouncementBanner";
import { ShopPromoBanner } from "@/components/ShopPromoBanner";
import { SellerPromoBanner } from "@/components/SellerPromoBanner";
import { useState, useEffect } from "react";
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
    const isOnHomePage = location.pathname === '/';
    
    if (!isOnHomePage) {
      // Si on n'est pas sur la page d'accueil, rediriger vers /
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // On est sur la page d'accueil
    const isAtTop = window.scrollY < 100; // Considérer qu'on est en haut si scroll < 100px
    
    if (isAtTop) {
      // Actualiser la page de manière fluide (recharger les produits)
      fetchProducts();
    } else {
      // Remonter en haut sans actualiser
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
      let query = supabase
        .from('products')
        .select(`
          *,
          shop:seller_shops!shop_id(shop_slug, shop_name)
        `)
        .eq('is_active', true);
      
      // Filtrage géographique : même ville ET même pays
      if (userLocation.city && userLocation.country) {
        query = query
          .eq('city', userLocation.city)
          .eq('country', userLocation.country);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
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
  
  // Filtrer les produits en vente flash
  const flashSaleProducts = products.filter(product => product.is_flash_sale);
  const regularProducts = products.filter(product => !product.is_flash_sale);

  // Convert Supabase product to ProductCard props
  const convertToProductCardProps = (product: any) => ({
    id: product.id,
    image: product.images?.[0] || "/placeholder.svg",
    title: product.title,
    originalPrice: product.original_price || product.price,
    salePrice: product.price,
    discount: product.discount_percentage || 0,
    rating: product.rating || 0,
    reviews: product.reviews_count || 0,
    badge: product.badge,
    shop_slug: product.seller_shops?.shop_slug,
    shop_name: product.seller_shops?.shop_name,
    isFlashSale: product.is_flash_sale || false,
    seller_id: product.seller_id,
    videoUrl: product.video_url,
    isBoosted: product.is_boosted || false,
    boostedUntil: product.boosted_until
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Logo Djassa - Always visible, no lines behind */}
            <h1 
              className="text-lg md:text-xl lg:text-2xl font-bold gradient-text-primary cursor-pointer transition-transform hover:scale-105 whitespace-nowrap" 
              onClick={handleLogoClick}
            >
              Djassa
            </h1>
            
            {/* Search Bar - Full width on mobile/tablet, limited on desktop */}
            <div className="flex-1 md:max-w-md">
              <SearchBar placeholder="Rechercher des produits..." />
            </div>
            
            {/* Mobile/Tablet Help Button */}
            <div className="md:hidden">
              <HelpButton />
            </div>

            {/* Desktop Icons Only - Hidden on mobile/tablet */}
            <div className="hidden md:flex items-center gap-2">
              <Badge className="gradient-accent text-xs px-2 py-1">
                {userCountry}
              </Badge>
              <Button variant="ghost" size="icon" className="relative p-2 min-w-[44px] min-h-[44px]" onClick={handleFavoritesClick}>
                <Heart className={`w-5 h-5 ${favoriteIds.length > 0 ? 'fill-current text-promo' : ''}`} />
                <RealtimeNotificationBadge count={favoriteIds.length} className="bg-promo text-white" />
              </Button>
              <Button variant="ghost" size="icon" className="relative p-2 min-w-[44px] min-h-[44px]" onClick={handleCartClick}>
                <ShoppingCart className="w-5 h-5" />
                <RealtimeNotificationBadge count={cartCount} className="bg-promo text-white" />
              </Button>
              <Button variant="ghost" size="icon" className="p-2 min-w-[44px] min-h-[44px]" onClick={handleProfileClick}>
                <User className={`w-5 h-5 ${user ? 'text-primary' : ''}`} />
              </Button>
              {isSuperAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/superadmin')}
                  className="text-xs min-h-[36px]"
                >
                  Dashboard
                </Button>
              )}
              {user && (
                <Button variant="ghost" size="sm" onClick={signOut} className="text-xs min-h-[36px]">
                  Déconnexion
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Hero Carousel - Bannière principale avec images défilantes */}
        <div className="mb-4 sm:mb-6 animate-fade-in">
          <HeroCarousel />
        </div>

        {/* Offres Spéciales - Bannière dynamique rectangulaire */}
        <section className="mb-6 sm:mb-8">
          <DynamicPromoBanner />
        </section>

        {/* Bannière promotionnelle boutique */}
        <section className="mb-6 sm:mb-8 animate-slide-up">
          <ShopPromoBanner />
          <PopularCategories />
        </section>

        {/* Produits Recommandés - Grille */}
        <section className="mb-6 sm:mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Recommandés pour vous</h2>
            <Button variant="ghost" size="sm" onClick={handleRefreshRecommendations} className="text-xs sm:text-sm hover:text-primary transition-all hover:scale-105">
              Actualiser
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4" key={refreshKey}>
            {shuffledProducts.slice(0, 12).map((product, index) => (
              <div key={`${product.id}-${refreshKey}`} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in">
                <ProductCard {...convertToProductCardProps(product)} />
              </div>
            ))}
          </div>
        </section>

        {/* Offres Spéciales / Tendances - Flash Sales */}
        {flashSaleProducts.length > 0 && (
          <section className="mb-6 sm:mb-8 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 gradient-primary rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-white text-sm sm:text-lg">⚡</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Offres Spéciales</h2>
              </div>
              <Badge className="bg-promo text-promo-foreground animate-pulse-promo w-fit">
                Limitées dans le temps
              </Badge>
              <div className="sm:ml-auto">
                <Button variant="ghost" size="sm" onClick={() => navigate('/flash-sales')} className="text-xs sm:text-sm hover:text-primary transition-all hover:scale-105">
                  Voir tout →
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
              {flashSaleProducts.slice(0, 6).map((product, index) => (
                <div key={product.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in">
                  <ProductCard {...convertToProductCardProps(product)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Plus de Produits */}
        <section className="mb-6 sm:mb-8 animate-slide-up">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 px-1">
            Tendances du moment
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {regularProducts.slice(0, 12).map((product, index) => (
              <div key={product.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in">
                <ProductCard {...convertToProductCardProps(product)} />
              </div>
            ))}
          </div>
        </section>

        {/* Bannière Vendeur - Dynamique */}
        <section className="mb-6 sm:mb-8" data-seller-upgrade>
          <SellerPromoBanner />
        </section>
      </main>

      {/* Bandeau d'annonces défilantes */}
      <ScrollingAnnouncementBanner />

      {/* FAQ Section */}
      <FAQ />

      {/* Footer - Simple et professionnel */}
      <footer className="bg-secondary mt-8 sm:mt-12 py-8 sm:py-10 border-t">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base text-foreground">Assistance</h4>
              <ul className="space-y-2">
                <li>
                  <button className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                    Centre d'aide
                  </button>
                </li>
                <li>
                  <button className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                    Support 24/7
                  </button>
                </li>
                <li>
                  <button className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base text-foreground">Informations</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => navigate("/legal")}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Politique de confidentialité
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/legal")}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Mentions légales
                  </button>
                </li>
                <li>
                  <button className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                    CGV
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base text-foreground">Contact</h4>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="mailto:djassa@djassa.tech" 
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Email: djassa@djassa.tech
                  </a>
                </li>
                <li>
                  <a 
                    href="https://wa.me/2250788281222" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    WhatsApp: +225 07 88 28 12 22
                  </a>
                </li>
                <li className="text-xs sm:text-sm text-muted-foreground">Abidjan, Côte d'Ivoire</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base text-foreground">Paiement & Livraison</h4>
              <ul className="space-y-2">
                <li className="text-xs sm:text-sm text-muted-foreground">Orange Money</li>
                <li className="text-xs sm:text-sm text-muted-foreground">MTN Mobile Money</li>
                <li className="text-xs sm:text-sm text-muted-foreground">Livraison 2-5 jours</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              © 2025 Djassa. Tous droits réservés. Plateforme de commerce en ligne en Côte d'Ivoire.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Floating Buttons - Desktop only */}
      <FloatingChatButton />
      <ScrollToTopButton />
    </div>
  );
};

export default Index;