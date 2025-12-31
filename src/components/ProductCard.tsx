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
import { BoostCountdown } from "@/components/BoostCountdown";
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
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="h-full"
    >
      <Card 
        className={`relative overflow-hidden cursor-pointer border border-border/40 shadow-sm rounded-xl bg-card transition-all duration-200 h-full flex flex-col ${
          isActiveBoosted 
            ? 'ring-1 ring-amber-400/60 shadow-md' 
            : 'hover:shadow-md active:shadow-sm'
        }`} 
        onClick={handleProductClick}
      >
        {/* Gradient overlay pour produits boostés */}
        {isActiveBoosted && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-transparent to-transparent pointer-events-none z-0" />
        )}
        
        {/* Badges - Compact mobile style */}
        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-0.5">
          {isProductSold && (
            <Badge className="bg-destructive/90 text-destructive-foreground text-[9px] px-1.5 py-0.5 font-semibold shadow-sm rounded-md">
              VENDU
            </Badge>
          )}
          {!isProductSold && isActiveBoosted && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] px-1.5 py-0.5 font-medium shadow-sm rounded-md">
              ⭐ Vedette
            </Badge>
          )}
          {!isProductSold && badge && !isActiveBoosted && (
            <Badge className="bg-success/90 text-success-foreground text-[9px] px-1.5 py-0.5 rounded-md">
              {badge}
            </Badge>
          )}
          {!isProductSold && isFlashSale && (
            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] px-1.5 py-0.5 rounded-md">
              ⚡ Flash
            </Badge>
          )}
          {!isProductSold && discount > 0 && (
            <Badge className="bg-promo text-promo-foreground text-[9px] px-1.5 py-0.5 font-bold rounded-md">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Heart Icon - Compact touch target */}
        <motion.button 
          onClick={handleToggleFavorite}
          whileTap={{ scale: 0.9 }}
          className="absolute top-1.5 right-1.5 z-10 w-8 h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center active:bg-gray-50"
        >
          <Heart className={`w-3.5 h-3.5 transition-colors ${
            isFavorite(id) 
              ? 'text-red-500 fill-current' 
              : 'text-gray-400'
          }`} />
        </motion.button>

        {/* Product Image - Uniform fixed height display */}
        <div className="relative w-full h-[200px] sm:h-[240px] md:h-[280px] overflow-hidden rounded-t-xl bg-[#f5f5f5]">
          <img 
            src={image} 
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          
          {/* Video indicator overlay */}
          {videoUrl && (
            <div className="absolute bottom-1.5 right-1.5 z-10">
              <div className="bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5 backdrop-blur-sm">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 5v10l7-5-7-5z"/>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Product Info - Compact native mobile style */}
        <div className="p-2 sm:p-3 flex-1 flex flex-col gap-1.5 relative z-10">
          <h3 className={`text-[11px] sm:text-xs lg:text-sm font-medium text-foreground line-clamp-2 leading-tight ${
            isActiveBoosted ? 'font-semibold' : ''
          }`}>
            {title}
          </h3>
          
          {/* Rating - Compact inline */}
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                    i < Math.floor(rating)
                      ? "text-amber-400 fill-current"
                      : "text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">({reviews})</span>
          </div>

          {/* Price - Clear hierarchy */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-foreground">
              {salePrice.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">FCFA</span>
            {originalPrice > salePrice && (
              <span className="text-[9px] sm:text-[10px] text-muted-foreground/70 line-through">
                {originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Countdown Timer for boosted products - 24h Chrono Style */}
          {isActiveBoosted && boostedUntil && (
            <BoostCountdown 
              boostedUntil={boostedUntil} 
              compact={true}
            />
          )}

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1" />

          {/* Boutique du vendeur - Minimal */}
          {shop_slug && shop_name && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/boutique/${shop_slug}`);
              }}
              className="w-full text-left py-1 -mx-0.5 px-0.5 rounded transition-colors"
            >
              <div className="flex items-center gap-1">
                <Store className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                <p className="text-[9px] sm:text-[10px] font-medium text-primary truncate">{shop_name}</p>
              </div>
            </motion.button>
          )}

          {/* Action Buttons - Native mobile style */}
          <div className="pt-1.5 mt-auto">
            {/* Desktop: Full buttons */}
            <div className="hidden sm:flex flex-col gap-1.5">
              <Button 
                variant="default" 
                size="sm" 
                className="w-full text-xs h-9 rounded-lg font-medium"
                onClick={handleAddToCart}
                disabled={isUnavailable}
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                {isUnavailable ? 'Épuisé' : 'Ajouter'}
              </Button>
              
              <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                <div className="flex-1">
                  <QuickOrderDialog
                    productId={id}
                    productTitle={title}
                    productPrice={salePrice}
                    sellerId={seller_id}
                    iconOnly={true}
                  />
                </div>
                <div className="flex-1">
                  <ContactSellerButton
                    productId={id}
                    sellerId={seller_id}
                    productTitle={title}
                    productPrice={salePrice}
                    productImage={image}
                    iconOnly={true}
                  />
                </div>
              </div>
            </div>

            {/* Mobile: Single row compact buttons */}
            <div className="flex sm:hidden gap-1">
              <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full h-8 rounded-lg text-[10px] px-2"
                  onClick={handleAddToCart}
                  disabled={isUnavailable}
                >
                  <ShoppingCart className="w-3 h-3" />
                </Button>
              </motion.div>
              
              <motion.div whileTap={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="flex-1">
                <QuickOrderDialog
                  productId={id}
                  productTitle={title}
                  productPrice={salePrice}
                  sellerId={seller_id}
                  iconOnly={true}
                />
              </motion.div>
              
              <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
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