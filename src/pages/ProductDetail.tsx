import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEOHead from "@/components/SEOHead";
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { ContactSellerButton } from "@/components/ContactSellerButton";
import { QuickOrderDialog } from "@/components/QuickOrderDialog";
import { BoostCountdown } from "@/components/BoostCountdown";
import { OptimizedImage } from "@/components/ui/optimized-image";
import ImageLightbox from "@/components/ImageLightbox";
import ProductDetailSkeleton from "@/components/ProductDetailSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useRecommendations } from "@/hooks/useRecommendations";
import { getProductImage, getProductImages, handleImageError } from "@/utils/productImageHelper";
import { getCachedProduct, setCachedProduct, getCachedShop, setCachedShop, prefetchShopBySlug } from "@/hooks/useProductCache";
import { categories } from "@/data/categories";
import { 
  ArrowLeft, 
  Heart, 
  Star, 
  ShoppingCart,
  Plus,
  Minus,
  Store,
  Shield,
  Truck,
  RotateCcw,
  Zap,
  Tag,
  ChevronRight,
  MessageCircle,
  Eye,
  MapPin,
  BadgeCheck,
  ShoppingBag
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  shop_id?: string;
  rating?: number;
  reviews_count?: number;
  badge?: string;
  is_flash_sale?: boolean;
  is_boosted?: boolean;
  boosted_until?: string;
  stock_quantity?: number;
  video_url?: string;
}

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_description?: string;
  logo_url?: string;
  banner_url?: string;
}

interface ShopStats {
  totalProducts: number;
  totalSales: number;
  avgRating: number;
  city?: string;
  isVerified: boolean;
}

// Category icon helper
const getCategoryIcon = (categoryName: string) => {
  const cat = categories.find(c => c.name === categoryName || c.slug === categoryName);
  return cat?.icon;
};

const ProductDetail = (): JSX.Element | null => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();
  const { location: userLocation } = useUserLocation();
  const { trackCategoryVisit, trackShopVisit, getSimilarProducts, getShopProducts } = useRecommendations();
  const { isVisible: isHeaderVisible } = useScrollDirection();

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/marketplace');
    }
  };

  const cachedProduct = useMemo(() => id ? getCachedProduct(id) : null, [id]);
  const cachedShop = useMemo(() => cachedProduct?.shop_id ? getCachedShop(cachedProduct.shop_id) : null, [cachedProduct?.shop_id]);

  const [quantity, setQuantity] = useState(1);
  const [showVideo, setShowVideo] = useState(false);
  const [product, setProduct] = useState<Product | null>(cachedProduct as Product | null);
  const [shop, setShop] = useState<Shop | null>(cachedShop as Shop | null);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [similarShops, setSimilarShops] = useState<(Shop & { stats?: ShopStats })[]>([]);
  const [shopStats, setShopStats] = useState<ShopStats | null>(null);
  const [loading, setLoading] = useState(!cachedProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [offerExpired, setOfferExpired] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageHovered, setImageHovered] = useState(false);

  const isOfferActive = (product: Product | null): boolean => {
    if (!product) return false;
    if (!product.is_boosted && !product.is_flash_sale) return false;
    if (!product.boosted_until) return false;
    return new Date(product.boosted_until) > new Date();
  };

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchShopStats = async (sellerId: string, shopId: string): Promise<ShopStats> => {
    const [productsRes, ordersRes, profileRes] = await Promise.all([
      supabase.from('products').select('id, rating', { count: 'exact' }).eq('shop_id', shopId).eq('is_active', true),
      supabase.from('orders').select('id', { count: 'exact' }).eq('seller_id', sellerId).in('status', ['delivered', 'confirmed', 'shipped']),
      supabase.from('profiles').select('city, commune').eq('user_id', sellerId).single(),
    ]);
    
    const products = productsRes.data || [];
    const ratings = products.map(p => p.rating).filter(Boolean) as number[];
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    
    return {
      totalProducts: productsRes.count || 0,
      totalSales: ordersRes.count || 0,
      avgRating,
      city: profileRes.data?.city || undefined,
      isVerified: (ordersRes.count || 0) >= 5,
    };
  };

  const fetchProduct = async (productId: string) => {
    try {
      if (!product) setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        setLoading(false);
        toast({ title: "Produit introuvable", description: "Ce produit n'existe plus ou a été supprimé.", variant: "destructive" });
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      
      setCachedProduct(data);
      setProduct(data);
      trackCategoryVisit(data.category);
      
      if (data.shop_id) {
        const { data: shopData } = await supabase.from('seller_shops').select('*').eq('id', data.shop_id).single();
        if (shopData) {
          setCachedShop(shopData);
          setShop(shopData);
          trackShopVisit(shopData.id);
          
          const [intelligentShopProducts, stats] = await Promise.all([
            getShopProducts(data.shop_id, productId, 6),
            fetchShopStats(data.seller_id, data.shop_id),
          ]);
          setShopProducts(intelligentShopProducts as Product[]);
          setShopStats(stats);
        }
      }
      
      // Similar products - filter by same category and close price range
      const intelligentSimilarProducts = await getSimilarProducts(productId, data.shop_id, data.category, 8);
      const priceRange = data.price * 0.5;
      const filteredSimilar = intelligentSimilarProducts.filter((p: any) => 
        p.category === data.category && 
        Math.abs(p.price - data.price) <= priceRange
      );
      setSimilarProducts((filteredSimilar.length > 0 ? filteredSimilar : intelligentSimilarProducts) as Product[]);
      
      // Similar shops with stats
      if (intelligentSimilarProducts.length > 0) {
        const similarShopIds = Array.from(new Set(intelligentSimilarProducts.map((p: any) => p.shop_id).filter(Boolean)));
        if (similarShopIds.length > 0) {
          const { data: similarShopsData } = await supabase.from('seller_shops').select('*').in('id', similarShopIds).eq('is_active', true).limit(4);
          if (similarShopsData) {
            // Fetch stats for each similar shop
            const shopsWithStats = await Promise.all(
              similarShopsData.map(async (s) => {
                const stats = await fetchShopStats(s.seller_id, s.id);
                return { ...s, stats };
              })
            );
            setSimilarShops(shopsWithStats);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addToCart(product.id);
    toast({ title: "Produit ajouté au panier", description: `${quantity} ${quantity > 1 ? 'articles ajoutés' : 'article ajouté'} avec succès` });
  };

  const handleOrder = () => {
    if (!user) {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/') && !currentPath.startsWith('//')) {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      navigate('/auth');
      return;
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product.stock_quantity || 0)) setQuantity(newQuantity);
  };

  const handleToggleFavorite = () => toggleFavorite(product.id);

  const productImages = getProductImages(product.images);
  const safeSelectedIndex = Math.min(selectedImageIndex, Math.max(productImages.length - 1, 0));
  const productImage = productImages[safeSelectedIndex];
  
  const hasActiveOffer = isOfferActive(product) && !offerExpired;
  const salePrice = product.price;
  const originalPrice = product.original_price && product.original_price > product.price ? product.original_price : product.price;
  const discount = hasActiveOffer && product.discount_percentage ? product.discount_percentage : 0;
  const rating = product.rating || 0;
  const reviewsCount = product.reviews_count || 0;
  const CategoryIcon = getCategoryIcon(product.category);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <SEOHead 
        title={product.title}
        description={product.description || `Achetez ${product.title} sur Djassa Marketplace.`}
        keywords={`${product.title}, ${product.category}, achat en ligne, Djassa`}
        image={productImages[0]}
        url={`/product/${product.id}`}
        type="product"
        productData={{
          name: product.title,
          description: product.description || '',
          price: product.price,
          currency: 'XOF',
          availability: product.stock_quantity && product.stock_quantity > 0 ? 'InStock' : 'OutOfStock',
          category: product.category,
          image: productImages[0],
          sku: product.id,
        }}
      />
      
      {/* Header */}
      <header 
        className={`sticky top-0 z-50 bg-card/95 backdrop-blur-md shadow-sm border-b border-border/50 transition-transform duration-300 ease-out md:translate-y-0 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'}`}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" onClick={handleBackNavigation} className="hover:bg-secondary flex-shrink-0 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg md:text-xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity truncate" onClick={() => navigate('/marketplace')}>
                Djassa
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {shop && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/boutique/${shop.shop_slug}`)}
                  className="hidden md:flex items-center gap-2 rounded-full border-primary/30 hover:bg-primary/5"
                >
                  <Store className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{shop.shop_name}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
          <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/marketplace')}>Accueil</span>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span 
            className="cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/categories?category=${encodeURIComponent(product.category)}`)}
          >
            {product.category}
          </span>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.title}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          
          {/* ===== LEFT: Image Gallery ===== */}
          <div className="space-y-3">
            <div className="relative group">
              {showVideo && product.video_url ? (
                <div className="relative">
                  <video controls className="w-full h-80 sm:h-96 lg:h-[500px] object-cover rounded-2xl" poster={productImage}>
                    <source src={product.video_url} type="video/mp4" />
                  </video>
                  <Button variant="outline" size="sm" className="absolute top-3 right-3 bg-card/90 rounded-full" onClick={() => setShowVideo(false)}>
                    <Eye className="w-4 h-4 mr-1" /> Images
                  </Button>
                </div>
              ) : (
                <>
                  <div 
                    className="relative cursor-zoom-in overflow-hidden rounded-2xl bg-muted/10"
                    onClick={() => setLightboxOpen(true)}
                    onMouseEnter={() => setImageHovered(true)}
                    onMouseLeave={() => setImageHovered(false)}
                  >
                    <OptimizedImage
                      src={productImage}
                      alt={`${product.title} - Image ${selectedImageIndex + 1}`}
                      aspectRatio="auto"
                      objectFit="cover"
                      className={`w-full h-80 sm:h-96 lg:h-[500px] rounded-2xl transition-transform duration-500 ${imageHovered ? 'scale-110' : 'scale-100'}`}
                      containerClassName="w-full h-80 sm:h-96 lg:h-[500px] rounded-2xl"
                    />
                    
                    {/* Overlay on hover */}
                    <div className={`absolute inset-0 bg-black/10 rounded-2xl transition-opacity duration-300 flex items-center justify-center ${imageHovered ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Cliquer pour agrandir
                      </div>
                    </div>

                    {/* Video button */}
                    {product.video_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-3 right-3 bg-card/90 rounded-full z-20"
                        onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M8 5v10l7-5-7-5z"/></svg>
                        Vidéo
                      </Button>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
                      {product.is_flash_sale && isOfferActive(product) && !offerExpired && (
                        <Badge className="bg-primary text-primary-foreground animate-pulse shadow-lg">
                          <Zap className="w-3 h-3 mr-1" /> Flash
                        </Badge>
                      )}
                      {product.badge && (
                        <Badge className="bg-accent text-accent-foreground shadow-lg">
                          {product.badge}
                        </Badge>
                      )}
                      {discount > 0 && (
                        <Badge className="bg-promo text-promo-foreground shadow-lg font-bold">
                          -{discount}%
                        </Badge>
                      )}
                    </div>
                    
                    {/* Favorite button on image */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
                      className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm rounded-full h-10 w-10 shadow-lg hover:bg-card z-20"
                    >
                      <Heart className={`w-5 h-5 transition-colors ${isFavorite(product.id) ? 'fill-current text-red-500' : 'text-foreground'}`} />
                    </Button>

                    {productImages.length > 1 && (
                      <Badge className="absolute bottom-3 right-3 bg-black/60 text-white border-0 z-20 font-mono">
                        {selectedImageIndex + 1}/{productImages.length}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="relative px-8">
                <Carousel opts={{ align: "start", loop: false }} className="w-full">
                  <CarouselContent className="-ml-2">
                    {productImages.map((image, index) => (
                      <CarouselItem key={index} className="basis-1/4 md:basis-1/5 lg:basis-1/6 pl-2">
                        <button
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 hover:opacity-90 ${
                            selectedImageIndex === index
                              ? 'border-primary ring-2 ring-primary/30 shadow-md'
                              : 'border-border/50 hover:border-primary/40'
                          }`}
                        >
                          <OptimizedImage src={image} alt={`Miniature ${index + 1}`} aspectRatio="square" objectFit="cover" showLoader={false} />
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0" />
                  <CarouselNext className="right-0" />
                </Carousel>
              </div>
            )}
          </div>

          <ImageLightbox images={productImages} initialIndex={selectedImageIndex} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} alt={product.title} productTitle={product.title} />

          {/* ===== RIGHT: Product Info ===== */}
          <div className="space-y-5">
            
            {/* Title with category icon */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {CategoryIcon && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CategoryIcon className="w-4 h-4 text-primary" />
                  </div>
                )}
                <button
                  onClick={() => navigate(`/categories?category=${encodeURIComponent(product.category)}`)}
                  className="text-xs font-medium text-primary hover:underline transition-colors"
                >
                  {product.category}
                </button>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                {product.title}
              </h1>
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-accent fill-current' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
              {reviewsCount > 0 ? (
                <span className="text-sm text-muted-foreground">({reviewsCount} avis)</span>
              ) : (
                <span className="text-sm text-primary cursor-pointer hover:underline">
                  ⭐ Soyez le premier à donner votre avis !
                </span>
              )}
            </div>

            {/* Price Section */}
            <div className="bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4 rounded-2xl border border-primary/10">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary">
                  {salePrice.toLocaleString()} <span className="text-lg">FCFA</span>
                </span>
                {originalPrice > salePrice && (
                  <span className="text-base sm:text-lg text-muted-foreground line-through">
                    {originalPrice.toLocaleString()} FCFA
                  </span>
                )}
              </div>
              {discount > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-promo text-promo-foreground text-xs font-bold px-2.5">
                    <Tag className="w-3 h-3 mr-1" />-{discount}%
                  </Badge>
                  <span className="text-xs text-success font-medium">
                    Vous économisez {(originalPrice - salePrice).toLocaleString()} FCFA
                  </span>
                </div>
              )}
            </div>

            {/* Countdown for offers */}
            {isOfferActive(product) && !offerExpired && (
              <BoostCountdown 
                boostedUntil={product.boosted_until!}
                onExpire={() => {
                  setOfferExpired(true);
                  toast({ title: "Offre expirée", description: "Cette offre spéciale n'est plus disponible." });
                }}
              />
            )}

            {/* Stock & Quantity */}
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${product.stock_quantity && product.stock_quantity > 0 ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                <span className="text-sm font-medium">
                  {product.stock_quantity && product.stock_quantity > 0 
                    ? <span className="text-success">{product.stock_quantity} en stock</span>
                    : <span className="text-destructive">Rupture de stock</span>}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-10 text-center font-bold tabular-nums">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity >= (product.stock_quantity || 0)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                className="w-full h-14 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={!product.stock_quantity || product.stock_quantity === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Ajouter au panier — {(salePrice * quantity).toLocaleString()} FCFA
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <QuickOrderDialog productId={product.id} productTitle={product.title} productPrice={salePrice} sellerId={product.seller_id} />
                <ContactSellerButton productId={product.id} sellerId={product.seller_id} productTitle={product.title} productPrice={salePrice} productImage={productImage} />
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: "Paiement sécurisé", color: "text-success" },
                { icon: Truck, label: "Livraison rapide", color: "text-primary" },
                { icon: RotateCcw, label: "Retour possible", color: "text-accent-foreground" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-muted/30 text-center">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="border-t border-border/50 pt-5">
              <h3 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
                📋 Description
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Category clickable */}
            <button
              onClick={() => navigate(`/categories?category=${encodeURIComponent(product.category)}`)}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              {CategoryIcon && <CategoryIcon className="w-5 h-5 text-primary" />}
              <div className="text-left flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Catégorie</p>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{product.category}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            {/* ===== SELLER INFO BLOCK ===== */}
            {shop && (
              <div className="border border-border/50 rounded-2xl p-4 space-y-4 bg-card shadow-sm">
                <div className="flex items-start gap-3">
                  {shop.logo_url ? (
                    <img src={shop.logo_url} alt={shop.shop_name} className="w-14 h-14 rounded-xl object-cover border-2 border-primary/20 flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Store className="w-7 h-7 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-foreground truncate">{shop.shop_name}</h3>
                      {shopStats?.isVerified && (
                        <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1">
                          <BadgeCheck className="w-3 h-3" /> Vérifié
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {shopStats && shopStats.avgRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-accent fill-current" />
                          <span className="text-xs font-semibold">{shopStats.avgRating.toFixed(1)}</span>
                        </div>
                      )}
                      {shopStats && shopStats.totalSales > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShoppingBag className="w-3 h-3" />
                          <span>{shopStats.totalSales} vente{shopStats.totalSales > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {shopStats?.city && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{shopStats.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-primary/30 hover:bg-primary/5"
                    onClick={() => navigate(`/boutique/${shop.shop_slug}`)}
                    onMouseEnter={() => prefetchShopBySlug(shop.shop_slug)}
                  >
                    <Store className="w-4 h-4 mr-1.5" />
                    Voir la boutique
                  </Button>
                  <ContactSellerButton
                    productId={product.id}
                    sellerId={product.seller_id}
                    productTitle={product.title}
                    productPrice={salePrice}
                    productImage={productImage}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===== RECOMMENDED PRODUCTS FROM SHOP ===== */}
      {shopProducts.length > 0 && (
        <section className="container mx-auto px-4 py-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="w-4 h-4 text-primary" />
              </div>
              Recommandés de cette boutique
            </h2>
            {shop && (
              <Button variant="ghost" size="sm" onClick={() => navigate(`/boutique/${shop.shop_slug}`)} className="text-primary hover:bg-primary/5 rounded-full">
                Voir tout <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          <div className="relative">
            <Carousel opts={{ align: "start", loop: false }} className="w-full">
              <CarouselContent className="-ml-3">
                {shopProducts.map((prod) => (
                  <CarouselItem key={prod.id} className="basis-[45%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-3">
                    <ProductMiniCard product={prod} onClick={() => navigate(`/product/${prod.id}`)} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-3 hidden sm:flex" />
              <CarouselNext className="-right-3 hidden sm:flex" />
            </Carousel>
          </div>
        </section>
      )}

      {/* ===== SIMILAR PRODUCTS ===== */}
      {similarProducts.length > 0 && (
        <section className="container mx-auto px-4 py-6 border-t border-border/30">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-accent-foreground" />
            </div>
            Produits similaires
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {similarProducts.map((prod) => (
              <ProductMiniCard key={prod.id} product={prod} onClick={() => navigate(`/product/${prod.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* ===== SIMILAR SHOPS ===== */}
      {similarShops.length > 0 && (
        <section className="container mx-auto px-4 py-6 border-t border-border/30">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Store className="w-4 h-4 text-success" />
            </div>
            Autres boutiques similaires
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {similarShops.map((s) => (
              <div
                key={s.id}
                className="cursor-pointer group p-4 border border-border/50 rounded-2xl hover:shadow-xl hover:border-primary/30 transition-all duration-300 bg-card"
                onClick={() => navigate(`/boutique/${s.shop_slug}`)}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={s.shop_name} className="w-16 h-16 rounded-xl object-cover border-2 border-primary/20 group-hover:border-primary group-hover:scale-105 transition-all shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-105 transition-all">
                      <Store className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 w-full space-y-1.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{s.shop_name}</h3>
                      {s.stats?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-success flex-shrink-0" />}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      {s.stats && s.stats.avgRating > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-accent fill-current" />
                          {s.stats.avgRating.toFixed(1)}
                        </span>
                      )}
                      {s.stats && s.stats.totalSales > 0 && (
                        <span>{s.stats.totalSales} vente{s.stats.totalSales > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    {s.stats?.city && (
                      <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {s.stats.city}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs rounded-xl border-primary/30 hover:bg-primary/5 font-medium" onClick={(e) => { e.stopPropagation(); navigate(`/boutique/${s.shop_slug}`); }}>
                    <Store className="w-3 h-3 mr-1" /> Voir la boutique
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

/* ===== Mini Product Card for recommendations ===== */
const ProductMiniCard = ({ product, onClick }: { product: Product; onClick: () => void }) => (
  <div onClick={onClick} className="cursor-pointer group">
    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted/10 mb-2">
      <img
        src={getProductImage(product.images, 0)}
        alt={product.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        onError={(e) => handleImageError(e)}
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl" />
      {product.discount_percentage && product.discount_percentage > 0 && (
        <Badge className="absolute top-2 left-2 bg-promo text-promo-foreground text-[10px] font-bold shadow-sm">
          -{product.discount_percentage}%
        </Badge>
      )}
      {product.is_flash_sale && (
        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] shadow-sm">
          <Zap className="w-2.5 h-2.5 mr-0.5" />Flash
        </Badge>
      )}
      {product.badge && !product.is_flash_sale && (
        <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-[10px] shadow-sm">
          {product.badge}
        </Badge>
      )}
    </div>
    <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
      {product.title}
    </h3>
    <p className="text-sm sm:text-base font-bold text-primary">
      {product.price.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
    </p>
    {product.original_price && product.original_price > product.price && (
      <p className="text-xs text-muted-foreground line-through">
        {product.original_price.toLocaleString()} FCFA
      </p>
    )}
  </div>
);

export default ProductDetail;
