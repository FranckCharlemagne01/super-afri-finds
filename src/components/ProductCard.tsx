import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingCart, Store } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ContactSellerButton } from "@/components/ContactSellerButton";
import { QuickOrderDialog } from "@/components/QuickOrderDialog";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ProductImage } from "@/components/ui/optimized-image";
import { motion } from "framer-motion";

interface ProductCardProps {
  id?: string;
  image: string;
  title: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  rating: number;
  reviews: number;
  badge?: string;
  isFlashSale?: boolean;
  seller_id?: string;
  videoUrl?: string;
  isBoosted?: boolean;
  boostedUntil?: string;
  boostedAt?: string;
  shop_slug?: string;
  shop_name?: string;
  isSold?: boolean;
  stockQuantity?: number;
  isActive?: boolean;
}

export const ProductCard = ({
  id = 'sample-product',
  image,
  title,
  originalPrice,
  salePrice,
  discount,
  rating,
  reviews,
  badge,
  isFlashSale = false,
  seller_id = 'default-seller',
  videoUrl,
  isBoosted = false,
  boostedUntil,
  boostedAt,
  shop_slug,
  shop_name,
  isSold = false,
  stockQuantity,
}: ProductCardProps) => {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(id);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  const handleProductClick = () => {
    navigate(`/product/${id}`);
  };

  const isActiveBoosted = isBoosted && boostedUntil && new Date(boostedUntil) > new Date();
  const isProductSold = isSold === true;
  const hasStockInfo = typeof stockQuantity === "number";
  const isOutOfStock = hasStockInfo && stockQuantity <= 0;
  const isUnavailable = isSold || isOutOfStock;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="h-full"
    >
      <Card 
        className={`relative overflow-hidden cursor-pointer border-0 shadow-md rounded-2xl lg:rounded-3xl bg-card transition-all duration-300 h-full ${
          isActiveBoosted 
            ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-100/50' 
            : 'hover:shadow-xl lg:hover:shadow-2xl'
        }`} 
        onClick={handleProductClick}
      >
        {/* Gradient overlay pour produits boostés */}
        {isActiveBoosted && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-transparent to-amber-50/20 pointer-events-none z-0" />
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {isProductSold && (
            <Badge className="bg-destructive text-destructive-foreground text-[10px] sm:text-xs px-2 py-0.5 font-bold shadow-md rounded-lg">
              🔴 VENDU
            </Badge>
          )}
          {!isProductSold && isActiveBoosted && (
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] sm:text-xs px-2 py-0.5 font-semibold shadow-md rounded-lg animate-pulse flex items-center gap-1">
              <span>⭐</span>
              En vedette
            </Badge>
          )}
          {!isProductSold && badge && !isActiveBoosted && (
            <Badge className="bg-success text-success-foreground text-[10px] sm:text-xs px-1.5 py-0.5 rounded-lg">
              {badge}
            </Badge>
          )}
          {!isProductSold && isFlashSale && (
            <Badge className="gradient-primary text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-lg animate-pulse-promo">
              ⚡ FLASH
            </Badge>
          )}
          {!isProductSold && discount > 0 && (
            <Badge className="bg-promo text-promo-foreground text-[10px] sm:text-xs px-1.5 py-0.5 font-bold rounded-lg">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Heart Icon - Touch optimized */}
        <motion.button 
          onClick={handleToggleFavorite}
          whileTap={{ scale: 0.85 }}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm min-w-[40px] min-h-[40px] flex items-center justify-center active:bg-white"
        >
          <Heart className={`w-4 h-4 transition-colors ${
            isFavorite(id) 
              ? 'text-promo fill-current' 
              : 'text-muted-foreground'
          }`} />
        </motion.button>

        {/* Product Image - With rounded corners */}
        <div className="overflow-hidden rounded-t-2xl">
          <ProductImage src={image} alt={title} productId={id} enableAutoCleanup={true} />
        </div>
        
        {/* Video indicator */}
        {videoUrl && (
          <div className="absolute bottom-[45%] right-2 z-10">
            <div className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5v10l7-5-7-5z"/>
              </svg>
              <span className="hidden sm:inline text-xs">Video</span>
            </div>
          </div>
        )}

        {/* Product Info - Enhanced spacing for desktop */}
        <div className="p-3 lg:p-4 space-y-2 lg:space-y-3 relative z-10">
          <h3 className={`text-xs sm:text-sm lg:text-base font-medium text-foreground line-clamp-2 leading-snug min-h-[2.5rem] lg:min-h-[3rem] ${
            isActiveBoosted ? 'font-semibold' : ''
          }`}>
            {title}
          </h3>
          
          {/* Rating - Enhanced for desktop */}
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${
                    i < Math.floor(rating)
                      ? "text-accent fill-current"
                      : "text-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] lg:text-xs text-muted-foreground">({reviews})</span>
          </div>

          {/* Price - Enhanced typography for desktop */}
          <div className="flex flex-col gap-0.5 lg:gap-1">
            <span className="text-sm sm:text-base lg:text-lg font-bold text-promo">
              {salePrice.toLocaleString()} FCFA
            </span>
            {originalPrice > salePrice && (
              <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground line-through">
                {originalPrice.toLocaleString()} FCFA
              </span>
            )}
          </div>

          {/* Countdown Timer for boosted products */}
          {isActiveBoosted && boostedUntil && (
            <CountdownTimer 
              expiryDate={boostedUntil} 
              boostedAt={boostedAt}
            />
          )}

          {/* Boutique du vendeur */}
          {shop_slug && shop_name && (
            <div className="pt-1.5 border-t border-border/30">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/boutique/${shop_slug}`);
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Store className="w-3 h-3 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-medium text-primary truncate">{shop_name}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">Voir la boutique →</p>
                  </div>
                </div>
              </motion.button>
            </div>
          )}

          {/* Action Buttons - Enhanced for desktop */}
          <div className="space-y-2 lg:space-y-2.5 pt-2">
            {/* Desktop: Full buttons with better styling */}
            <div className="hidden sm:flex flex-col space-y-2">
              <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}>
                <Button 
                  variant="promo" 
                  size="sm" 
                  className="w-full text-xs lg:text-sm min-h-[44px] lg:min-h-[48px] rounded-xl lg:rounded-2xl font-medium shadow-sm hover:shadow-md transition-all"
                  onClick={handleAddToCart}
                  disabled={isUnavailable}
                >
                  <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  {isUnavailable ? 'Épuisé' : 'Ajouter au panier'}
                </Button>
              </motion.div>
              
              <div onClick={(e) => e.stopPropagation()}>
                <QuickOrderDialog
                  productId={id}
                  productTitle={title}
                  productPrice={salePrice}
                  sellerId={seller_id}
                />
              </div>
              
              <ContactSellerButton
                productId={id}
                sellerId={seller_id}
                productTitle={title}
                productPrice={salePrice}
                productImage={image}
              />
            </div>

            {/* Mobile: Compact buttons with tap feedback */}
            <div className="flex sm:hidden gap-1.5">
              <motion.div whileTap={{ scale: 0.92 }} className="flex-1">
                <Button 
                  variant="promo" 
                  size="sm" 
                  className="w-full text-xs p-2 min-h-[44px] rounded-xl"
                  onClick={handleAddToCart}
                  disabled={isUnavailable}
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </motion.div>
              
              <motion.div whileTap={{ scale: 0.92 }} onClick={(e) => e.stopPropagation()} className="flex-1">
                <QuickOrderDialog
                  productId={id}
                  productTitle={title}
                  productPrice={salePrice}
                  sellerId={seller_id}
                  iconOnly={true}
                />
              </motion.div>
              
              <motion.div whileTap={{ scale: 0.92 }} className="flex-1">
                <ContactSellerButton
                  productId={id}
                  sellerId={seller_id}
                  productTitle={title}
                  productPrice={salePrice}
                  productImage={image}
                  iconOnly={true}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};