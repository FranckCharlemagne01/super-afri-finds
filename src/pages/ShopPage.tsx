import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEOHead from "@/components/SEOHead";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Store, Calendar, Grid3x3, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/ProductCard';
import { useAuth } from '@/hooks/useAuth';
import { SellerShopDashboard } from '@/components/SellerShopDashboard';
import { useUserLocation } from '@/hooks/useUserLocation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRecommendations } from '@/hooks/useRecommendations';
import { motion } from 'framer-motion';

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
        {/* Header with back button */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b">
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
    <div className="min-h-screen bg-background pb-6">
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
      
      {/* Header with back button - Mobile optimized */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-card/98 backdrop-blur-md border-b shadow-sm"
      >
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/marketplace');
              }
            }}
            className="transition-all hover:bg-secondary min-w-[40px] min-h-[40px] shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 
            className="text-base sm:text-lg font-bold gradient-text-primary cursor-pointer transition-transform hover:scale-105 shrink-0" 
            onClick={() => navigate('/marketplace')}
          >
            Djassa
          </h1>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <Store className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <span className="text-sm sm:text-base font-semibold truncate">{shop.shop_name}</span>
          </div>
          {shop.subscription_active && (
            <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
              Premium
            </Badge>
          )}
        </div>
      </motion.header>

      {/* Shop Banner - Mobile optimized */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative w-full h-40 sm:h-48 md:h-64 bg-gradient-to-r from-primary/10 to-secondary/10 overflow-hidden"
      >
        {shop.banner_url ? (
          <img
            src={shop.banner_url}
            alt={`${shop.shop_name} banner`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <Store className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-muted-foreground/20" />
          </div>
        )}
      </motion.div>

      {/* Shop Info - Mobile optimized */}
      <div className="container mx-auto px-3 sm:px-4 -mt-12 sm:-mt-16 relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4 sm:mb-6"
        >
          <Card className="w-full p-4 sm:p-5 md:p-6 shadow-lg border-border/50">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-6">
              {/* Shop Logo - Mobile optimized */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-card border-3 sm:border-4 border-background shadow-xl ring-2 ring-primary/10">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={`${shop.shop_name} logo`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                      <Store className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              </div>

              {/* Shop Details - Mobile optimized */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{shop.shop_name}</h2>
                  {shop.subscription_active && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      ⭐ Premium
                    </Badge>
                  )}
                </div>
                
                {shop.shop_description && (
                  <div className="mb-3 sm:mb-4">
                    <p className={`text-sm sm:text-base text-muted-foreground leading-relaxed ${
                      !showFullDescription && shop.shop_description.length > 120 ? 'line-clamp-2' : ''
                    }`}>
                      {shop.shop_description}
                    </p>
                    {shop.shop_description.length > 120 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="text-xs sm:text-sm text-primary font-medium hover:underline mt-1 flex items-center gap-1 mx-auto sm:mx-0"
                      >
                        {showFullDescription ? (
                          <>Voir moins <ChevronUp className="h-3 w-3" /></>
                        ) : (
                          <>Voir plus <ChevronDown className="h-3 w-3" /></>
                        )}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/70" />
                    <span className="whitespace-nowrap">Depuis {new Date(shop.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/70" />
                    <span className="whitespace-nowrap font-medium">{products.length} produit{products.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Products Section - Mobile optimized */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
            <h3 className="text-lg sm:text-xl font-bold">Produits de la boutique</h3>
            <Badge variant="outline" className="text-xs">
              {products.length} {products.length > 1 ? 'articles' : 'article'}
            </Badge>
          </div>
          
          {products.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <Store className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/20 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">Cette boutique n'a pas encore de produits.</p>
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
                      transition={{ delay: 0.4 }}
                      className="mb-4 sm:mb-6"
                    >
                      <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3 px-1">
                        Filtrer par catégorie
                      </h3>
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
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4"
                  >
                  {displayedProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + (index * 0.05), duration: 0.3 }}
                      >
                        <ProductCard
                          id={product.id}
                          title={product.title}
                          originalPrice={product.original_price || product.price}
                          salePrice={product.price}
                          image={product.images?.[0] || '/placeholder.svg'}
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
            transition={{ delay: 0.6 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-1">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h3 className="text-lg sm:text-xl font-bold">Boutiques similaires</h3>
              </div>
              <Badge variant="outline" className="text-xs w-fit">✨ Recommandé</Badge>
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
                  transition={{ delay: 0.7 + (index * 0.1) }}
                >
                  <Card
                    className="p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-border/50"
                    onClick={() => navigate(`/boutique/${similarShop.shop_slug}`)}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
                      {similarShop.logo_url ? (
                        <img
                          src={similarShop.logo_url}
                          alt={similarShop.shop_name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-primary/10 shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center shrink-0">
                          <Store className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/40" />
                        </div>
                      )}
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
