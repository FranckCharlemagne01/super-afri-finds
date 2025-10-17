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
  stockQuantity = 0,
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
  const isProductSold = isSold || stockQuantity === 0;

  return (
    <Card className={`relative overflow-hidden cursor-pointer border-0 shadow-md transition-all duration-500 animate-fade-in ${
      isActiveBoosted 
        ? 'ring-2 ring-amber-400 hover:ring-amber-500 hover:shadow-2xl hover:shadow-amber-200/50 hover:-translate-y-2 hover:scale-[1.03]' 
        : 'hover-lift hover:shadow-xl'
    }`} onClick={handleProductClick}>
      {/* Gradient overlay pour produits boostés */}
      {isActiveBoosted && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-transparent to-amber-50/20 pointer-events-none z-0" />
      )}
      
      {/* Badges */}
      <div className="absolute top-1 sm:top-2 left-1 sm:left-2 z-10 flex flex-col gap-1">
        {isProductSold && (
          <Badge className="bg-destructive text-destructive-foreground text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 font-bold shadow-lg">
            🔴 VENDU
          </Badge>
        )}
        {!isProductSold && isActiveBoosted && (
          <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 font-semibold shadow-lg animate-pulse flex items-center gap-1">
            <span className="text-xs">⭐</span>
            En vedette
          </Badge>
        )}
        {!isProductSold && badge && !isActiveBoosted && (
          <Badge className="bg-success text-success-foreground text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
            {badge}
          </Badge>
        )}
        {!isProductSold && isFlashSale && (
          <Badge className="gradient-primary text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 animate-pulse-promo">
            ⚡ FLASH
          </Badge>
        )}
        {!isProductSold && discount > 0 && (
          <Badge className="bg-promo text-promo-foreground text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold">
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Heart Icon */}
      <button 
        onClick={handleToggleFavorite}
        className="absolute top-1 sm:top-2 right-1 sm:right-2 z-10 p-1.5 sm:p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
      >
        <Heart className={`w-4 h-4 sm:w-4 sm:h-4 transition-colors ${
          isFavorite(id) 
            ? 'text-promo fill-current' 
            : 'text-muted-foreground hover:text-promo'
        }`} />
      </button>

      {/* Product Image - Optimized Rectangular Aspect Ratio */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-muted rounded-t-lg">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-110 hover:rotate-1"
        />
        {videoUrl && (
          <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 z-10">
            <div className="bg-black/70 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1">
              <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5v10l7-5-7-5z"/>
              </svg>
              <span className="hidden sm:inline">Video</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2 relative z-10">
        <h3 className={`text-xs sm:text-sm font-medium text-foreground line-clamp-2 leading-tight min-h-[2.2rem] sm:min-h-[2.5rem] ${
          isActiveBoosted ? 'font-bold' : ''
        }`}>
          {title}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${
                  i < Math.floor(rating)
                    ? "text-accent fill-current"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({reviews})</span>
        </div>

        {/* Price */}
        <div className="flex flex-col gap-0.5">
          <span className="text-base sm:text-lg font-bold text-promo">
            {salePrice.toLocaleString()} FCFA
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground line-through">
            {originalPrice.toLocaleString()} FCFA
          </span>
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
          <div className="pt-1 border-t border-border/50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/boutique/${shop_slug}`);
              }}
              className="w-full text-left px-2 py-1.5 hover:bg-muted/50 rounded-md transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Store className="w-3 h-3 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-primary truncate">{shop_name}</p>
                  <p className="text-xs text-muted-foreground">Voir la boutique →</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-1">
          {/* Desktop: Full buttons */}
          <div className="hidden sm:flex flex-col space-y-2">
            <Button 
              variant="promo" 
              size="sm" 
              className="w-full text-xs min-h-[44px]"
              onClick={handleAddToCart}
              disabled={isProductSold}
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              {isProductSold ? 'Épuisé' : 'Ajouter au panier'}
            </Button>
            
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

          {/* Mobile: Compact buttons */}
          <div className="flex sm:hidden gap-1">
            <Button 
              variant="promo" 
              size="sm" 
              className="flex-1 text-xs p-2 min-h-[44px] min-w-[44px]"
              onClick={handleAddToCart}
              disabled={isProductSold}
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
            
            <div onClick={(e) => e.stopPropagation()} className="flex-1">
              <QuickOrderDialog
                productId={id}
                productTitle={title}
                productPrice={salePrice}
                sellerId={seller_id}
                iconOnly={true}
              />
            </div>
            
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
    </Card>
  );
};