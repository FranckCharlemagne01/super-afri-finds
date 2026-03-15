import { Badge } from "@/components/ui/badge";
import { Star, Heart, Eye } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useNavigate } from "react-router-dom";
import { useState, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getProductImage, handleImageError } from "@/utils/productImageHelper";
import { useProductPrefetch } from "@/hooks/useProductCache";
import { motion } from "framer-motion";
import { QuickViewDialog, type QuickViewProduct } from "@/components/QuickViewDialog";

interface CategoryProductCardProps {
  id: string;
  image: string;
  images?: string[];
  title: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  rating: number;
  reviews: number;
  badge?: string;
  isFlashSale?: boolean;
  isBoosted?: boolean;
  boostedUntil?: string;
  shop_name?: string;
  description?: string;
}

// Composant image optimisé pour les cartes produits dans les catégories
// Hauteur fixe responsive pour éviter le zoom excessif sur mobile
const ProductCardImage = memo(({ 
  src, 
  alt,
  onQuickView 
}: { 
  src: string; 
  alt: string;
  onQuickView?: (e: React.MouseEvent) => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // Secure image source
  const safeSrc = getProductImage([src], 0);
  
  return (
    <div className="group/cimg relative w-full h-[180px] sm:h-[220px] md:h-[260px] overflow-hidden rounded-t-xl bg-muted">
      {/* Loader */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
        </div>
      )}
      
      {/* Image - object-cover for uniform display */}
      <img
        src={hasError ? '/placeholder.svg' : safeSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={(e) => {
          handleError();
          handleImageError(e);
        }}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      />

      {/* Quick View button - bottom left */}
      <button
        onClick={onQuickView}
        className="absolute bottom-2 left-2 z-10 bg-background/90 backdrop-blur-sm text-foreground text-[10px] sm:text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1 opacity-0 group-hover/cimg:opacity-100 transition-all duration-200 hover:bg-background"
      >
        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        Aperçu
      </button>
    </div>
  );
});

ProductCardImage.displayName = 'ProductCardImage';

export const CategoryProductCard = memo(({
  id,
  image,
  images,
  title,
  originalPrice,
  salePrice,
  discount,
  rating,
  reviews,
  badge,
  isFlashSale = false,
  isBoosted = false,
  boostedUntil,
  shop_name,
  description,
}: CategoryProductCardProps) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const { prefetchOnHover, cancelPrefetch } = useProductPrefetch();
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const isActiveBoosted = isBoosted && boostedUntil && new Date(boostedUntil) > new Date();
  const isFav = isFavorite(id);

  const handleClick = useCallback(() => {
    navigate(`/product/${id}`);
  }, [navigate, id]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id);
  }, [toggleFavorite, id]);

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewOpen(true);
  }, []);

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => prefetchOnHover(id)}
      onMouseLeave={cancelPrefetch}
      onTouchStart={() => prefetchOnHover(id)}
      className={cn(
        "relative bg-card rounded-xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98]",
        "border border-border/50 shadow-sm hover:shadow-md",
        isActiveBoosted && "ring-1 ring-amber-400/50"
      )}
    >
      {/* Badges - Position absolue en haut à gauche */}
      <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-0.5">
        {isActiveBoosted && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] px-1.5 py-0.5 font-medium rounded-md shadow-sm">
            ⭐ Vedette
          </Badge>
        )}
        {!isActiveBoosted && badge && (
          <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-md shadow-sm">
            {badge}
          </Badge>
        )}
        {isFlashSale && (
          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] px-1.5 py-0.5 rounded-md shadow-sm">
            ⚡ Flash
          </Badge>
        )}
        {discount > 0 && (
          <Badge className="bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0.5 font-bold rounded-md shadow-sm">
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Bouton favoris - Position absolue en haut à droite */}
      <button
        onClick={handleFavoriteClick}
        className={cn(
          "absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all",
          "bg-background/90 shadow-sm backdrop-blur-sm active:scale-90",
          isFav && "bg-red-50"
        )}
      >
        <Heart 
          className={cn(
            "w-3.5 h-3.5 transition-colors",
            isFav ? "text-red-500 fill-current" : "text-muted-foreground"
          )} 
        />
      </button>

      {/* Image du produit - Aspect ratio 4:5 avec contain */}
      <ProductCardImage src={image} alt={title} onQuickView={handleQuickView} />

      {/* Informations produit - Compact pour mobile */}
      <div className="p-2 space-y-1">
        {/* Titre du produit - Max 2 lignes */}
        <h3 className="text-[11px] sm:text-xs font-medium text-foreground line-clamp-2 leading-tight min-h-[2rem]">
          {title}
        </h3>

        {/* Rating inline compact */}
        <div className="flex items-center gap-0.5">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-2.5 h-2.5",
                  i < Math.floor(rating)
                    ? "text-amber-400 fill-current"
                    : "text-muted fill-current"
                )}
              />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground ml-0.5">({reviews})</span>
        </div>

        {/* Prix - Mise en évidence */}
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="text-sm sm:text-base font-bold text-foreground tabular-nums">
            {salePrice.toLocaleString()}
          </span>
          <span className="text-[9px] text-muted-foreground font-medium">FCFA</span>
        </div>
        
        {originalPrice > salePrice && (
          <span className="text-[9px] text-muted-foreground line-through tabular-nums">
            {originalPrice.toLocaleString()} FCFA
          </span>
        )}

        {/* Nom de la boutique - Masqué pour les clients */}
      </div>

      <QuickViewDialog
        product={{
          id,
          image,
          title,
          originalPrice,
          salePrice,
          discount,
          rating,
          reviews,
          description,
          badge,
          isFlashSale,
          isBoosted: !!isActiveBoosted,
        }}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </div>
  );
});

CategoryProductCard.displayName = 'CategoryProductCard';
export default CategoryProductCard;
