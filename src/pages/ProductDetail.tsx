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
import { 
  ArrowLeft, 
  Heart, 
  Star, 
  ShoppingCart,
  Plus,
  Minus,
  Store
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
}

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
    // Utiliser l'historique du navigateur pour revenir en arrière
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback vers marketplace si pas d'historique
      navigate('/marketplace');
    }
  };

  // ✅ Initialize from cache for instant display
  const cachedProduct = useMemo(() => id ? getCachedProduct(id) : null, [id]);
  const cachedShop = useMemo(() => cachedProduct?.shop_id ? getCachedShop(cachedProduct.shop_id) : null, [cachedProduct?.shop_id]);

  const [quantity, setQuantity] = useState(1);
  
  const [showVideo, setShowVideo] = useState(false);
  const [product, setProduct] = useState<Product | null>(cachedProduct as Product | null);
  const [shop, setShop] = useState<Shop | null>(cachedShop as Shop | null);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [similarShops, setSimilarShops] = useState<Shop[]>([]);
  // ✅ If we have cache, no loading state needed
  const [loading, setLoading] = useState(!cachedProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [offerExpired, setOfferExpired] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Helper function to check if a special offer is still active
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

  const fetchProduct = async (productId: string) => {
    try {
      // ✅ Only show loading if no cached data
      if (!product) {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        console.error('Error fetching product:', error);
        setLoading(false);
        toast({
          title: "Produit introuvable",
          description: "Ce produit n'existe plus ou a été supprimé.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      
      // ✅ Cache the product for instant future access
      setCachedProduct(data);
      setProduct(data);
      
      // Track category visit
      trackCategoryVisit(data.category);
      
      // Fetch shop info if shop_id exists
      if (data.shop_id) {
        const { data: shopData } = await supabase
          .from('seller_shops')
          .select('*')
          .eq('id', data.shop_id)
          .single();
        
        if (shopData) {
          // ✅ Cache shop for instant future access
          setCachedShop(shopData);
          setShop(shopData);
          
          // Track shop visit
          trackShopVisit(shopData.id);
          
          // Fetch intelligent shop products
          const intelligentShopProducts = await getShopProducts(data.shop_id, productId, 6);
          setShopProducts(intelligentShopProducts as Product[]);
        }
      }
      
      // Fetch intelligent similar products from other shops
      const intelligentSimilarProducts = await getSimilarProducts(
        productId, 
        data.shop_id, 
        data.category, 
        8
      );
      setSimilarProducts(intelligentSimilarProducts as Product[]);
      
      // Fetch similar shops (shops that have similar products)
      if (intelligentSimilarProducts.length > 0) {
        const similarShopIds = Array.from(
          new Set(intelligentSimilarProducts.map(p => p.shop_id).filter(Boolean))
        );
        
        if (similarShopIds.length > 0) {
          const { data: similarShopsData } = await supabase
            .from('seller_shops')
            .select('*')
            .in('id', similarShopIds)
            .eq('is_active', true)
            .limit(4);
          
          if (similarShopsData) {
            setSimilarShops(similarShopsData);
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

  // ✅ Show skeleton instead of "Chargement du produit..."
  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return null;
  }

  const handleAddToCart = () => {
    // Add to cart with the selected quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(product.id);
    }
    
    // Show success message
    toast({
      title: "Produit ajouté au panier",
      description: `${quantity} ${quantity > 1 ? 'articles ajoutés' : 'article ajouté'} avec succès`,
    });
  };

  const handleOrder = () => {
    if (!user) {
      // SECURITY: Validate redirect URL is safe (relative path only)
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/') && !currentPath.startsWith('//')) {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      navigate('/auth');
      return;
    }
    // Open quick order dialog will be handled by the QuickOrderDialog component
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product.stock_quantity || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product.id);
  };

  const productImages = getProductImages(product.images);
  const safeSelectedIndex = Math.min(selectedImageIndex, Math.max(productImages.length - 1, 0));
  const productImage = productImages[safeSelectedIndex];
  
  // Check if offer is still active for price display
  const hasActiveOffer = isOfferActive(product) && !offerExpired;
  // Always use product.price as the main price - this is what the seller entered
  const salePrice = product.price;
  // original_price is only used for showing crossed-out price when there's a discount
  const originalPrice = product.original_price && product.original_price > product.price ? product.original_price : product.price;
  const discount = hasActiveOffer && product.discount_percentage ? product.discount_percentage : 0;
  const rating = product.rating || 0;
  const reviewsCount = product.reviews_count || 0;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* SEO Head */}
      <SEOHead 
        title={product.title}
        description={product.description || `Achetez ${product.title} sur Djassa Marketplace. Livraison en Côte d'Ivoire.`}
        keywords={`${product.title}, ${product.category}, achat en ligne, Djassa Marketplace, Côte d'Ivoire`}
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
      
      {/* Header - Desktop: always visible, Mobile: hide on scroll down */}
      <header 
        className={`
          sticky top-0 z-50 bg-white shadow-sm border-b
          transition-transform duration-300 ease-out
          md:translate-y-0
          ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'}
        `}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBackNavigation}
                className="hover:bg-secondary transition-all flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <h1 
                className="text-base sm:text-lg md:text-xl font-bold gradient-text-primary cursor-pointer transition-transform hover:scale-105 truncate" 
                onClick={() => navigate('/marketplace')}
              >
                Djassa
              </h1>
            </div>
            {shop && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackNavigation}
                className="hidden md:flex items-center gap-2 transition-all hover:bg-secondary flex-shrink-0"
              >
                <Store className="w-4 h-4" />
                <span className="truncate max-w-[150px]">Retour à la boutique</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Back to Shop Button - Mobile & Desktop */}
        {shop && (
          <Button
            variant="ghost"
            onClick={handleBackNavigation}
            className="mb-4 flex items-center gap-2 text-primary hover:bg-primary/10 transition-all max-w-full"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Retour à {shop.shop_name}</span>
          </Button>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image/Video Gallery */}
          <div className="space-y-4">
            <div className="relative">
              {showVideo && product.video_url ? (
                <div className="relative">
                  <video
                    controls
                    className="w-full h-96 lg:h-[500px] object-cover rounded-lg"
                    poster={productImage}
                  >
                    <source src={product.video_url} type="video/mp4" />
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-3 right-3 bg-white/90"
                    onClick={() => setShowVideo(false)}
                  >
                    Voir les images
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image principale avec loader et fallback */}
                  <div 
                    className="relative cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <OptimizedImage
                      src={productImage}
                      alt={`${product.title} - Image ${selectedImageIndex + 1}`}
                      aspectRatio="auto"
                      objectFit="cover"
                      className="w-full h-96 lg:h-[500px] rounded-lg"
                      containerClassName="w-full h-96 lg:h-[500px] rounded-lg"
                    />
                    {product.video_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-3 right-3 bg-white/90 flex items-center gap-2 z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowVideo(true);
                        }}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l7-5-7-5z"/>
                        </svg>
                        Voir la vidéo
                      </Button>
                    )}
                    
                    {product.badge && (
                      <Badge className="absolute top-3 left-3 bg-promo text-promo-foreground z-20">
                        {product.badge}
                      </Badge>
                    )}
                    {product.is_flash_sale && isOfferActive(product) && !offerExpired && (
                      <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground animate-pulse-promo z-20">
                        ⚡ Flash Sale
                      </Badge>
                    )}
                    {discount > 0 && (
                      <Badge className="absolute bottom-3 left-3 bg-success text-success-foreground z-20">
                        -{discount}%
                      </Badge>
                    )}
                    
                    {productImages.length > 1 && (
                      <Badge className="absolute bottom-3 right-3 bg-black/60 text-white border-0 z-20">
                        {selectedImageIndex + 1}/{productImages.length}
                      </Badge>
                    )}
                  </div>

                  {/* Miniatures cliquables - Carousel si plus d'une image */}
                  {productImages.length > 1 && (
                    <div className="relative px-8">
                      <Carousel
                        opts={{
                          align: "start",
                          loop: false,
                        }}
                        className="w-full"
                      >
                        <CarouselContent className="-ml-2">
                          {productImages.map((image, index) => (
                            <CarouselItem key={index} className="basis-1/3 md:basis-1/4 lg:basis-1/5 pl-2">
                              <button
                                onClick={() => setSelectedImageIndex(index)}
                                className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                  selectedImageIndex === index
                                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <OptimizedImage
                                  src={image}
                                  alt={`${product.title} - Miniature ${index + 1}`}
                                  aspectRatio="square"
                                  objectFit="cover"
                                  showLoader={false}
                                />
                                {selectedImageIndex === index && (
                                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                    <Badge className="text-xs">Actuelle</Badge>
                                  </div>
                                )}
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
              )}
            </div>
          </div>

          {/* Image Lightbox - Premium viewer with download + watermark */}
          <ImageLightbox
            images={productImages}
            initialIndex={selectedImageIndex}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            alt={product.title}
            productTitle={product.title}
          />

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-3 break-words leading-tight">
                {product.title}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        i < Math.floor(rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {rating.toFixed(1)} ({reviewsCount} avis)
                </span>
              </div>

              {/* Price */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary break-words">
                  {salePrice.toLocaleString()} FCFA
                </span>
                {originalPrice > salePrice && (
                  <span className="text-sm sm:text-lg text-muted-foreground line-through break-words">
                    {originalPrice.toLocaleString()} FCFA
                  </span>
                )}
                {discount > 0 && (
                  <Badge className="bg-promo text-promo-foreground text-xs">
                    -{discount}%
                  </Badge>
                )}
              </div>

              {/* Countdown Timer for Special Offers - 24h Chrono Style */}
              {isOfferActive(product) && !offerExpired && (
                <div className="mb-3 sm:mb-4">
                  <BoostCountdown 
                    boostedUntil={product.boosted_until!}
                    onExpire={() => {
                      setOfferExpired(true);
                      toast({
                        title: "Offre expirée",
                        description: "Cette offre spéciale n'est plus disponible. Le produit reste consultable au prix normal.",
                      });
                    }}
                  />
                </div>
              )}

              {/* Stock Status - Compact */}
              <div className="mb-3 sm:mb-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${product.stock_quantity && product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {product.stock_quantity && product.stock_quantity > 0 
                    ? `${product.stock_quantity} en stock` 
                    : 'Rupture de stock'}
                </span>
              </div>

              {/* ============ MOBILE ACTION SECTION - Style app native ============ */}
              <div className="lg:hidden space-y-3 mb-4 pb-4 border-b">
                {/* Quantity Selector - Compact Mobile Native */}
                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl">
                  <label className="text-sm font-semibold text-foreground">Quantité</label>
                  <div className="flex items-center gap-1 bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none hover:bg-muted/50 active:scale-95 transition-transform"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-bold text-lg tabular-nums">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none hover:bg-muted/50 active:scale-95 transition-transform"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= (product.stock_quantity || 0)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile Action Buttons - Style app native */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full h-14 text-base font-bold shadow-lg rounded-xl active:scale-[0.98] transition-transform"
                  disabled={!product.stock_quantity || product.stock_quantity === 0}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Ajouter au panier
                </Button>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <QuickOrderDialog
                      productId={product.id}
                      productTitle={product.title}
                      productPrice={salePrice}
                      sellerId={product.seller_id}
                    />
                  </div>
                  <div className="flex-1">
                    <ContactSellerButton
                      productId={product.id}
                      sellerId={product.seller_id}
                      productTitle={product.title}
                      productPrice={salePrice}
                      productImage={productImage}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleToggleFavorite}
                    className="h-12 w-12 rounded-xl shadow-sm active:scale-95 transition-transform flex-shrink-0"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* ============ DESKTOP ACTION SECTION ============ */}
              <div className="hidden lg:block space-y-4 mb-6 pb-6 border-b">
                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Quantité</label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= (product.stock_quantity || 0)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Primary Action - Add to Cart */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 h-12 text-base font-semibold"
                    disabled={!product.stock_quantity || product.stock_quantity === 0}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="truncate">Ajouter au panier - {salePrice.toLocaleString()} FCFA</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleToggleFavorite}
                    className="h-12 px-4 hover:scale-105 transition-transform flex-shrink-0"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                </div>

                {/* Secondary Actions */}
                <div className="flex gap-3">
                  <QuickOrderDialog
                    productId={product.id}
                    productTitle={product.title}
                    productPrice={salePrice}
                    sellerId={product.seller_id}
                  />
                  <ContactSellerButton
                    productId={product.id}
                    sellerId={product.seller_id}
                    productTitle={product.title}
                    productPrice={salePrice}
                    productImage={productImage}
                  />
                </div>
              </div>

              {/* ============ DESCRIPTION & DETAILS - After action buttons ============ */}
              
              {/* Description */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-2">Description</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              {/* Category */}
              <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Catégorie:</span>
                <Badge variant="secondary" className="text-xs sm:text-sm">{product.category}</Badge>
              </div>

              {/* Link to Shop - with prefetch on hover/touch */}
              {shop && (
                <div className="mb-4 sm:mb-6">
                  <Button
                    onClick={() => navigate(`/boutique/${shop.shop_slug}`)}
                    onMouseEnter={() => prefetchShopBySlug(shop.shop_slug)}
                    onTouchStart={() => prefetchShopBySlug(shop.shop_slug)}
                    onFocus={() => prefetchShopBySlug(shop.shop_slug)}
                    variant="outline"
                    className="w-full h-12 text-sm sm:text-base font-medium border-primary/30 hover:bg-primary/5 hover:border-primary transition-colors"
                  >
                    <Store className="w-4 h-4 mr-2 flex-shrink-0" />
                    Voir la boutique
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Products from the Same Shop */}
      {shopProducts.length > 0 && (
        <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-foreground break-words">Produits recommandés de cette boutique</h2>
            {shop && (
              <Button
                variant="outline"
                onClick={() => navigate(`/boutique/${shop.shop_slug}`)}
                className="text-xs sm:text-sm w-full sm:w-auto min-h-[44px] flex-shrink-0"
              >
                <span className="truncate">Voir tous</span>
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {shopProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => navigate(`/product/${prod.id}`)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-2">
                  <img
                    src={getProductImage(prod.images, 0)}
                    alt={prod.title}
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e)}
                  />
                  {prod.discount_percentage && prod.discount_percentage > 0 && (
                    <Badge className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-promo text-promo-foreground text-xs">
                      -{prod.discount_percentage}%
                    </Badge>
                  )}
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 mb-1 break-words">
                  {prod.title}
                </h3>
                <p className="text-sm sm:text-lg font-bold text-primary break-words">
                  {prod.price.toLocaleString()} FCFA
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Products from Other Shops */}
      {similarProducts.length > 0 && (
        <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 border-t">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-4 break-words">
            Produits similaires
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {similarProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => navigate(`/product/${prod.id}`)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-2">
                  <img
                    src={getProductImage(prod.images, 0)}
                    alt={prod.title}
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e)}
                  />
                  {prod.discount_percentage && prod.discount_percentage > 0 && (
                    <Badge className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-promo text-promo-foreground text-xs">
                      -{prod.discount_percentage}%
                    </Badge>
                  )}
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 mb-1 break-words">
                  {prod.title}
                </h3>
                <p className="text-sm sm:text-lg font-bold text-primary break-words">
                  {prod.price.toLocaleString()} FCFA
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Shops */}
      {similarShops.length > 0 && (
        <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 border-t">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-4 break-words">
            Autres boutiques similaires
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {similarShops.map((similarShop) => (
              <div
                key={similarShop.id}
                onClick={() => navigate(`/boutique/${similarShop.shop_slug}`)}
                className="cursor-pointer group p-3 sm:p-4 border rounded-lg hover:shadow-lg transition-all duration-300 bg-card"
              >
                <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                  {similarShop.logo_url ? (
                    <img
                      src={similarShop.logo_url}
                      alt={similarShop.shop_name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-primary/20 group-hover:border-primary transition-colors flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <span className="text-xl sm:text-2xl">🏪</span>
                    </div>
                  )}
                  <div className="min-w-0 w-full">
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 break-words">
                      {similarShop.shop_name}
                    </h3>
                    {similarShop.shop_description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 break-words">
                        {similarShop.shop_description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/boutique/${similarShop.shop_slug}`);
                    }}
                  >
                    <span className="truncate">Voir la boutique</span>
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

export default ProductDetail;