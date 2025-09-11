import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingCart, MessageSquare } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ContactSellerButton } from "@/components/ContactSellerButton";
import { QuickOrderDialog } from "@/components/QuickOrderDialog";

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
}: ProductCardProps) => {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/product/${id}`);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  const handleProductClick = () => {
    navigate(`/product/${id}`);
  };

  return (
    <Card className="relative overflow-hidden hover-lift cursor-pointer border-0 shadow-lg" onClick={handleProductClick}>
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {badge && (
          <Badge className="bg-success text-success-foreground text-xs px-2 py-1">
            {badge}
          </Badge>
        )}
        {isFlashSale && (
          <Badge className="gradient-primary text-white text-xs px-2 py-1 animate-pulse-promo">
            ⚡ FLASH
          </Badge>
        )}
        <Badge className="bg-promo text-promo-foreground text-xs px-2 py-1 font-bold">
          -{discount}%
        </Badge>
      </div>

      {/* Heart Icon */}
      <button 
        onClick={handleToggleFavorite}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
      >
        <Heart className={`w-4 h-4 transition-colors ${
          isFavorite(id) 
            ? 'text-promo fill-current' 
            : 'text-muted-foreground hover:text-promo'
        }`} />
      </button>

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        {videoUrl && (
          <div className="absolute bottom-2 right-2 z-10">
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5v10l7-5-7-5z"/>
              </svg>
              <span>Video</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
          {title}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
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
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-promo">
            {salePrice.toLocaleString()} FCFA
          </span>
          <span className="text-sm text-muted-foreground line-through">
            {originalPrice.toLocaleString()} FCFA
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Desktop: Full buttons */}
          <div className="hidden sm:flex flex-col space-y-2">
            <Button 
              variant="promo" 
              size="sm" 
              className="w-full"
              onClick={handleOrder}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Commander
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
            />
          </div>

          {/* Mobile: Icon buttons */}
          <div className="flex sm:hidden justify-between gap-2">
            <Button 
              variant="promo" 
              size="sm" 
              className="flex-1"
              onClick={handleOrder}
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
              iconOnly={true}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};