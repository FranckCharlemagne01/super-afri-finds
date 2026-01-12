import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEOHead from "@/components/SEOHead";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Store, Calendar, Grid3x3, ChevronDown, ChevronUp } from 'lucide-react';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/ProductCard';
import { useAuth } from '@/hooks/useAuth';
import { SellerShopDashboard } from '@/components/SellerShopDashboard';
import { useUserLocation } from '@/hooks/useUserLocation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRecommendations } from '@/hooks/useRecommendations';
import { motion } from 'framer-motion';
import { getProductImage } from '@/utils/productImageHelper';
import { SHOP_BRANDING } from '@/constants/shopBranding';

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  seller_id: string;
  created_at: string;
  subscription_active: boolean;
}

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  images: string[];
  rating: number;
  reviews_count: number;
  category: string;
  is_flash_sale: boolean;
  badge: string | null;
  seller_id: string;
  stock_quantity?: number;
  is_active?: boolean;
  is_boosted?: boolean;
  boosted_until?: string;
  is_sold?: boolean;
  created_at: string;
}

const ShopPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { location: userLocation } = useUserLocation();
  const { trackShopVisit, trackCategoryVisit, getSimilarShops } = useRecommendations();
  const { isVisible: isHeaderVisible } = useScrollDirection();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [similarShops, setSimilarShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const fetchShopData = async () => {
      if (!slug) return;

      try {
        setLoading(true);

        // Fetch shop details
        const { data: shopData, error: shopError } = await supabase
          .from('seller_shops')
          .select('*')
          .eq('shop_slug', slug)
          .eq('is_active', true)
          .single();

        if (shopError || !shopData) {
          toast({
            title: 'Boutique introuvable',
            description: 'Cette boutique n\'existe pas ou est inactive.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setShop(shopData);

        // Fetch shop products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!productsError && productsData) {
          setProducts(productsData);
          
          // Track shop visit and categories
          trackShopVisit(shopData.id);
          productsData.forEach(product => trackCategoryVisit(product.category));
          
          // Fetch intelligent similar shops based on main category and history
          if (productsData.length > 0) {
            const mainCategory = productsData[0].category;
            const intelligentSimilarShops = await getSimilarShops(shopData.id, mainCategory, 6);
            setSimilarShops(intelligentSimilarShops);
          }
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la boutique.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [slug, navigate, toast, refreshKey]);

  // Separate effect to check ownership when user or shop changes
  useEffect(() => {
    if (shop && user) {
      setIsOwner(user.id === shop.seller_id);
    } else {
      setIsOwner(false);
    }
  }, [user, shop]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return null;
  }

  // If user is the owner, show the seller dashboard
  if (isOwner) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header with back button - Desktop: always visible, Mobile: hide on scroll */}
        <header 
          className={`
            sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b
            transition-transform duration-300 ease-out
            md:translate-y-0
            ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'}
          `}
        >
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/seller-dashboard');
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Tableau de bord - {shop.shop_name}</h1>
            </div>
          </div>
        </header>

        <SellerShopDashboard
          shop={shop}
          products={products}
          loading={loading}
          onProductsUpdate={() => setRefreshKey(prev => prev + 1)}
        />
      </div>
    );
  }

  // Public shop view for visitors
  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-6">
      {/* SEO Head */}
      <SEOHead 
        title={shop.shop_name}
        description={shop.shop_description || `Découvrez la boutique ${shop.shop_name} sur Djassa Marketplace. Achetez en ligne en Côte d'Ivoire.`}
        keywords={`${shop.shop_name}, boutique en ligne, Djassa Marketplace, Côte d'Ivoire, achat en ligne`}
        image={shop.logo_url || undefined}
        url={`/shop/${shop.shop_slug}`}
        shopData={{
          name: shop.shop_name,
          description: shop.shop_description || '',
          logo: shop.logo_url || undefined,
        }}
      />
      
      {/* Floating Header - Modern Mobile Style */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`
          fixed top-0 left-0 right-0 z-50 
          transition-all duration-300 ease-out
          ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="mx-2 sm:mx-4 mt-2 sm:mt-3">
          <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-xl h-9 w-9 sm:h-10 sm:w-10 hover:bg-secondary shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden ring-1 ring-primary/20 shrink-0">
                  <img
                    src={SHOP_BRANDING.getLogoUrl(shop.logo_url)}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm sm:text-base font-semibold truncate max-w-[140px] sm:max-w-[200px]">
                  {shop.shop_name}
                </span>
              </div>
              
              <div 
                className="text-primary font-bold text-sm sm:text-base cursor-pointer hover:scale-105 transition-transform shrink-0"
                onClick={() => navigate('/')}
              >
                Djassa
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Banner Section - Full Width Modern Design */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full h-56 sm:h-64 md:h-80 lg:h-96 overflow-hidden"
      >
        {/* Banner Image with Gradient Overlay */}
        <img
          src={SHOP_BRANDING.getBannerUrl(shop.banner_url)}
          alt={`${shop.shop_name} banner`}
          className="w-full h-full object-cover"
          loading="eager"
        />
        
        {/* Dark Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        
        {/* Djassa Branding Watermark - Top Right */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6"
        >
          <div className="bg-primary/90 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg">
            <span className="text-white font-bold text-xs sm:text-sm tracking-wide">
              🛒 Djassa Marketplace
            </span>
          </div>
        </motion.div>
        
        {/* Shop Info Overlay - Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8"
        >
          <div className="flex items-end gap-4 sm:gap-5">
            {/* Shop Logo - Prominent Position */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="shrink-0"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-white shadow-2xl ring-4 ring-white/30 transform hover:scale-105 transition-transform duration-300">
                <img
                  src={SHOP_BRANDING.getLogoUrl(shop.logo_url)}
                  alt={`${shop.shop_name} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
              {SHOP_BRANDING.isDefaultLogo(shop.logo_url) && (
                <div className="mt-1 text-center">
                  <Badge className="bg-white/20 text-white text-[10px] backdrop-blur-sm border-0">
                    Djassa
                  </Badge>
                </div>
              )}
            </motion.div>
            
            {/* Shop Name & Stats */}
            <div className="flex-1 min-w-0 text-white pb-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-lg truncate">
                  {shop.shop_name}
                </h1>
                {shop.subscription_active && (
                  <Badge className="bg-accent text-accent-foreground text-xs font-semibold shrink-0">
                    ⭐ Premium
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4 text-white/90 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="font-medium">{products.length} produit{products.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Depuis {new Date(shop.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Promotional Marquette Banner - Modern CTA Style */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-primary via-primary to-primary/90 text-white py-3 sm:py-4 px-4 overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
        <div className="container mx-auto relative">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl">🔥</span>
            <p className="text-xs sm:text-sm md:text-base font-medium text-center">
              <span className="font-bold">Bienvenue chez {shop.shop_name}</span>
              <span className="hidden sm:inline"> — </span>
              <span className="block sm:inline mt-0.5 sm:mt-0">Découvrez nos produits de qualité au meilleur prix !</span>
            </p>
            <span className="text-lg sm:text-xl">🛍️</span>
          </div>
        </div>
      </motion.div>

      {/* Shop Description Card - Clean Modern Style */}
      {shop.shop_description && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="container mx-auto px-3 sm:px-4 mt-4 sm:mt-6"
        >
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-card to-secondary/30 border-border/50 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base mb-1.5">À propos de la boutique</h3>
                <p className={`text-sm text-muted-foreground leading-relaxed ${
                  !showFullDescription && shop.shop_description.length > 150 ? 'line-clamp-2' : ''
                }`}>
                  {shop.shop_description}
                </p>
                {shop.shop_description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-xs sm:text-sm text-primary font-medium hover:underline mt-2 flex items-center gap-1"
                  >
                    {showFullDescription ? (
                      <>Voir moins <ChevronUp className="h-3 w-3" /></>
                    ) : (
                      <>Voir plus <ChevronDown className="h-3 w-3" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Products Section Container */}
      <div className="container mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
        {/* Products Section - Mobile optimized */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <span className="text-xl">🛍️</span>
              Nos produits
            </h3>
            <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
              {products.length} {products.length > 1 ? 'articles' : 'article'}
            </Badge>
          </div>
          
          {products.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center bg-gradient-to-br from-card to-secondary/20">
              <Store className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/30 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">Cette boutique n'a pas encore de produits.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Revenez bientôt !</p>
            </Card>
          ) : (
            (() => {
              // Group products by category
              const productsByCategory = products.reduce((acc, product) => {
                if (!acc[product.category]) {
                  acc[product.category] = [];
                }
                acc[product.category].push(product);
                return acc;
              }, {} as Record<string, Product[]>);

              const categories = Object.keys(productsByCategory);
              const hasMultipleCategories = categories.length > 1;

              // Filter products based on selected category
              const displayedProducts = selectedCategory 
                ? productsByCategory[selectedCategory] || []
                : products;

              return (
                <div className="space-y-4 sm:space-y-6">
                  {/* Show category menu only if multiple categories - Mobile optimized */}
                  {hasMultipleCategories && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="mb-4 sm:mb-6"
                    >
                      <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3 px-1">
                        Filtrer par catégorie
                      </h4>
                      <ScrollArea className="w-full">
                        <div className="flex gap-2 pb-3 px-1 overflow-x-auto scrollbar-hide">
                          <Button
                            variant={selectedCategory === null ? "default" : "outline"}
                            onClick={() => setSelectedCategory(null)}
                            className="flex items-center gap-1.5 sm:gap-2 shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all hover:scale-105 rounded-full"
                            size="sm"
                          >
                            <Grid3x3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            Tout
                            <Badge variant="secondary" className="ml-1 text-xs px-1.5">
                              {products.length}
                            </Badge>
                          </Button>
                          {categories.map((category) => (
                            <Button
                              key={category}
                              variant={selectedCategory === category ? "default" : "outline"}
                              onClick={() => setSelectedCategory(category)}
                              className="capitalize shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all hover:scale-105 rounded-full"
                              size="sm"
                            >
                              {category.replace(/-/g, ' ')}
                              <Badge 
                                variant={selectedCategory === category ? "secondary" : "outline"} 
                                className="ml-1 text-xs px-1.5"
                              >
                                {productsByCategory[category].length}
                              </Badge>
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}

                  {/* Products grid - Mobile optimized */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4"
                  >
                    {displayedProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9 + (index * 0.03), duration: 0.3 }}
                      >
                        <ProductCard
                          id={product.id}
                          title={product.title}
                          originalPrice={product.original_price || product.price}
                          salePrice={product.price}
                          image={getProductImage(product.images, 0)}
                          rating={product.rating}
                          reviews={product.reviews_count}
                          badge={product.badge || undefined}
                          isFlashSale={product.is_flash_sale}
                          discount={product.discount_percentage || 0}
                          seller_id={product.seller_id}
                          isBoosted={false}
                          stockQuantity={product.stock_quantity}
                          isSold={product.is_sold || false}
                          isActive={product.is_active}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              );
            })()
          )}
        </motion.div>

        {/* Similar Shops Section - Mobile optimized */}
        {similarShops.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-1">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h3 className="text-lg sm:text-xl font-bold">Boutiques similaires</h3>
              </div>
              <Badge variant="outline" className="text-xs w-fit bg-accent/10 border-accent/30">✨ Recommandé</Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 px-1">
              Découvrez d'autres boutiques dans la même catégorie
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {similarShops.map((similarShop, index) => (
                <motion.div
                  key={similarShop.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + (index * 0.1) }}
                >
                  <Card
                    className="p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50 bg-gradient-to-br from-card to-secondary/20"
                    onClick={() => navigate(`/boutique/${similarShop.shop_slug}`)}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
                      <img
                        src={SHOP_BRANDING.getLogoUrl(similarShop.logo_url)}
                        alt={similarShop.shop_name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover ring-2 ring-primary/10 shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-semibold truncate">{similarShop.shop_name}</h4>
                        {similarShop.subscription_active && (
                          <Badge variant="secondary" className="text-xs mt-0.5">⭐ Premium</Badge>
                        )}
                      </div>
                    </div>
                    {similarShop.shop_description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {similarShop.shop_description}
                      </p>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
