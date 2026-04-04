import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEOHead from "@/components/SEOHead";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Store, Calendar, Grid3x3, ChevronDown, ChevronUp, Share2, MessageCircle, MapPin, Package, ShieldCheck, Star } from 'lucide-react';
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
import { getCachedShopBySlug, setCachedShop } from '@/hooks/useProductCache';

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

  const cachedShop = useMemo(() => slug ? getCachedShopBySlug(slug) : null, [slug]);

  const [shop, setShop] = useState<Shop | null>(cachedShop as Shop | null);
  const [products, setProducts] = useState<Product[]>([]);
  const [similarShops, setSimilarShops] = useState<Shop[]>([]);
  const [similarShopProducts, setSimilarShopProducts] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(!cachedShop);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const fetchShopData = async () => {
      if (!slug) return;

      try {
        if (!shop) {
          setLoading(true);
        }

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
        setCachedShop(shopData);

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!productsError && productsData) {
          setProducts(productsData);
          setLoadingProducts(false);
          
          trackShopVisit(shopData.id);
          productsData.forEach(product => trackCategoryVisit(product.category));
          
          if (productsData.length > 0) {
            const mainCategory = productsData[0].category;
            const intelligentSimilarShops = await getSimilarShops(shopData.id, mainCategory, 6);
            setSimilarShops(intelligentSimilarShops);

            // Fetch products for each similar shop
            const shopProductsMap: Record<string, Product[]> = {};
            for (const s of intelligentSimilarShops.slice(0, 4)) {
              const { data: sp } = await supabase
                .from('products')
                .select('*')
                .eq('shop_id', s.id)
                .eq('is_active', true)
                .limit(4)
                .order('created_at', { ascending: false });
              if (sp) shopProductsMap[s.id] = sp;
            }
            setSimilarShopProducts(shopProductsMap);
          }
        } else {
          setLoadingProducts(false);
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

  useEffect(() => {
    if (shop && user) {
      setIsOwner(user.id === shop.seller_id);
    } else {
      setIsOwner(false);
    }
  }, [user, shop]);

  const handleShare = async () => {
    const url = `${window.location.origin}/boutique/${shop?.shop_slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shop?.shop_name, text: `Découvrez ${shop?.shop_name} sur Djassa`, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Lien copié !', description: 'Le lien de la boutique a été copié.' });
    }
  };

  const handleContact = () => {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Connectez-vous pour contacter le vendeur.', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    navigate(`/messages?to=${shop?.seller_id}`);
  };

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

  if (isOwner) {
    return (
      <div className="min-h-screen bg-background">
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

  const createdDate = new Date(shop.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) acc[product.category] = [];
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);
  const categories = Object.keys(productsByCategory);
  const hasMultipleCategories = categories.length > 1;
  const displayedProducts = selectedCategory ? productsByCategory[selectedCategory] || [] : products;

  // Public shop view for visitors
  return (
    <div className="min-h-screen bg-background pb-8 overflow-x-hidden">
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
      
      {/* Sticky Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`
          sticky top-0 z-50 bg-card/98 backdrop-blur-md border-b shadow-sm
          transition-transform duration-300 ease-out
          md:translate-y-0
          ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'}
        `}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate('/marketplace');
            }}
            className="w-9 h-9 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 
            className="text-base sm:text-lg font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity shrink-0" 
            onClick={() => navigate('/marketplace')}
          >
            Djassa
          </h1>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Store className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm sm:text-base font-semibold truncate">{shop.shop_name}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleContact}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* ========== SHOP BANNER WITH OVERLAY ========== */}
      <div className="relative w-full h-40 sm:h-52 md:h-64 lg:h-72 overflow-hidden">
        <img
          src={SHOP_BRANDING.getBannerUrl(shop.banner_url)}
          alt={`${shop.shop_name} banner`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Banner content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto flex items-end gap-4 sm:gap-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="shrink-0"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-4 border-card shadow-2xl bg-card">
                <img
                  src={SHOP_BRANDING.getLogoUrl(shop.logo_url)}
                  alt={`${shop.shop_name} logo`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Shop name + badge on the banner */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex-1 min-w-0 pb-1"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-lg truncate">
                  {shop.shop_name}
                </h2>
                {shop.subscription_active && (
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-xs sm:text-sm px-2.5 py-0.5 shadow-lg">
                    <Star className="w-3 h-3 mr-1 fill-current" /> Premium
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-white/80 text-xs sm:text-sm flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Depuis {createdDate}
                </span>
                <span className="text-white/80 text-xs sm:text-sm flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> {products.length} produit{products.length > 1 ? 's' : ''}
                </span>
                <span className="text-white/80 text-xs sm:text-sm flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> 🇨🇮 Côte d'Ivoire
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ========== SHOP INFO CARD ========== */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4 sm:mt-6"
        >
          <Card className="p-4 sm:p-5 border-border/50 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Description */}
              <div className="flex-1 min-w-0">
                {shop.shop_description ? (
                  <div>
                    <p className={`text-sm sm:text-base text-muted-foreground leading-relaxed ${
                      !showFullDescription && shop.shop_description.length > 150 ? 'line-clamp-2' : ''
                    }`}>
                      {shop.shop_description}
                    </p>
                    {shop.shop_description.length > 150 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="text-xs sm:text-sm text-primary font-medium hover:underline mt-1 flex items-center gap-1"
                      >
                        {showFullDescription ? (
                          <>Voir moins <ChevronUp className="h-3 w-3" /></>
                        ) : (
                          <>Voir plus <ChevronDown className="h-3 w-3" /></>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Bienvenue dans notre boutique sur Djassa !</p>
                )}

                {/* Trust badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="text-xs gap-1 bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="w-3 h-3" /> Vendeur vérifié
                  </Badge>
                  <Badge variant="outline" className="text-xs gap-1 bg-primary/5 border-primary/20 text-primary">
                    <MapPin className="w-3 h-3" /> Livraison CI
                  </Badge>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={handleContact}
                  className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-md"
                  size="sm"
                >
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  Contacter
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  size="sm"
                >
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Partager
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ========== PRODUCTS SECTION ========== */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 sm:mt-8"
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">Produits de la boutique</h3>
              <p className="text-xs text-muted-foreground">{products.length} article{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          
          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="p-10 text-center">
              <Store className="h-14 w-14 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">Cette boutique n'a pas encore de produits.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Category filter chips */}
              {hasMultipleCategories && (
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      onClick={() => setSelectedCategory(null)}
                      className="shrink-0 rounded-full text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 gap-1.5 transition-all hover:scale-105"
                      size="sm"
                    >
                      <Grid3x3 className="h-3.5 w-3.5" />
                      Tout
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{products.length}</Badge>
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category)}
                        className="capitalize shrink-0 rounded-full text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 transition-all hover:scale-105"
                        size="sm"
                      >
                        {category.replace(/-/g, ' ')}
                        <Badge 
                          variant={selectedCategory === category ? "secondary" : "outline"} 
                          className="ml-1 text-[10px] px-1.5"
                        >
                          {productsByCategory[category].length}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Products grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                {displayedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * Math.min(index, 10), duration: 0.3 }}
                    className="min-w-0"
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
              </div>
            </div>
          )}
        </motion.div>

        {/* ========== SIMILAR SHOPS SECTION ========== */}
        {similarShops.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 sm:mt-10"
          >
            {/* Section divider */}
            <div className="flex items-center gap-3 mb-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Découvrir</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Section header */}
            <div className="flex items-center gap-3 mb-5 mt-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold">Boutiques similaires</h3>
                <p className="text-xs text-muted-foreground">Découvrez d'autres boutiques dans la même catégorie</p>
              </div>
              <Badge variant="outline" className="ml-auto text-xs bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400">
                ✨ Recommandé
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {similarShops.map((similarShop, index) => {
                const shopProds = similarShopProducts[similarShop.id] || [];
                return (
                  <motion.div
                    key={similarShop.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + (index * 0.08) }}
                  >
                    <Card
                      className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50"
                      onClick={() => navigate(`/boutique/${similarShop.shop_slug}`)}
                    >
                      {/* Mini product thumbnails */}
                      {shopProds.length > 0 && (
                        <div className="grid grid-cols-4 h-20 sm:h-24 overflow-hidden">
                          {shopProds.slice(0, 4).map((p, i) => (
                            <div key={p.id} className="overflow-hidden bg-muted/30">
                              <img
                                src={getProductImage(p.images, 0)}
                                alt={p.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                            </div>
                          ))}
                          {/* Fill empty slots */}
                          {Array.from({ length: Math.max(0, 4 - shopProds.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-muted/20" />
                          ))}
                        </div>
                      )}

                      <div className="p-3 sm:p-4">
                        <div className="flex items-center gap-2.5 mb-2">
                          <img
                            src={SHOP_BRANDING.getLogoUrl(similarShop.logo_url)}
                            alt={similarShop.shop_name}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover ring-2 ring-primary/10 shrink-0"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-bold truncate">{similarShop.shop_name}</h4>
                            {similarShop.subscription_active && (
                              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0">
                                <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                        {similarShop.shop_description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                            {similarShop.shop_description}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs font-semibold rounded-full hover:bg-primary hover:text-white transition-colors"
                        >
                          <Store className="w-3.5 h-3.5 mr-1.5" />
                          Visiter la boutique
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
