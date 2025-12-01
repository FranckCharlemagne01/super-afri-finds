import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Star, Store, MessageCircle, ExternalLink } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { useStableAuth } from '@/hooks/useStableAuth';

interface OptimizedProductCardProps {
  id: string;
  image: string;
  title: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  rating: number;
  reviews: number;
  badge?: string;
  shop_slug?: string;
  shop_name?: string;
  isFlashSale?: boolean;
  seller_id?: string;
  videoUrl?: string;
  isBoosted?: boolean;
  boostedUntil?: string;
}

/**
 * Optimized Product Card with React.memo to prevent unnecessary re-renders
 * Uses useCallback for event handlers to maintain referential stability
 */
export const OptimizedProductCard = memo(({
  id,
  image,
  title,
  originalPrice,
  salePrice,
  discount,
  rating,
  reviews,
  badge,
  shop_slug,
  shop_name,
  isFlashSale,
  seller_id,
  videoUrl,
  isBoosted,
  boostedUntil
}: OptimizedProductCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { userId } = useStableAuth();
  
  const isFavorite = favoriteIds.includes(id);

  const handleCardClick = useCallback(() => {
    navigate(`/product/${id}`);
  }, [navigate, id]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(id);
  }, [addToCart, id]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (userId) {
      toggleFavorite(id);
    }
  }, [toggleFavorite, id, userId]);

  const handleShopClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (shop_slug) {
      navigate(`/boutique/${shop_slug}`);
    }
  }, [navigate, shop_slug]);

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden h-full flex flex-col"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden bg-muted/30 aspect-square rounded-t-lg">
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
        
        {discount > 0 && (
          <Badge className="absolute top-2 left-2 bg-promo text-promo-foreground">
            -{discount}%
          </Badge>
        )}
        
        {badge && (
          <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm">
            {badge}
          </Badge>
        )}
        
        {isFlashSale && (
          <Badge className="absolute bottom-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse-promo">
            ⚡ Vente Flash
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          className={`absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white hover:scale-110 transition-all ${
            isFavorite ? 'text-promo' : 'text-muted-foreground'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </Button>
      </div>

      <CardContent className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
          {title}
        </h3>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-primary">
            {salePrice.toLocaleString()} FCFA
          </span>
          {discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              {originalPrice.toLocaleString()} FCFA
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <div className="flex items-center">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="ml-1">{rating.toFixed(1)}</span>
          </div>
          <span>({reviews})</span>
        </div>

        {shop_name && (
          <button
            onClick={handleShopClick}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline mb-3 group/shop"
          >
            <Store className="h-3 w-3" />
            <span className="truncate">{shop_name}</span>
            <ExternalLink className="h-3 w-3 opacity-0 group-hover/shop:opacity-100 transition-opacity" />
          </button>
        )}

        <Button
          onClick={handleAddToCart}
          size="sm"
          className="w-full mt-auto"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Ajouter au panier
        </Button>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-render prevention
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.salePrice === nextProps.salePrice &&
    prevProps.image === nextProps.image &&
    prevProps.isBoosted === nextProps.isBoosted
  );
});

OptimizedProductCard.displayName = 'OptimizedProductCard';
