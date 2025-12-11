import { Badge } from "@/components/ui/badge";
import { Star, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useNavigate } from "react-router-dom";
import { useState, memo, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CategoryProductCardProps {
  id: string;
  image: string;
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
}

// Composant image optimisé pour les cartes produits dans les catégories
const ProductCardImage = memo(({ 
  src, 
  alt 
}: { 
  src: string; 
  alt: string;
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

  return (
    <div className="relative w-full bg-gray-50 overflow-hidden" style={{ paddingBottom: '100%' }}>
      {/* Loader */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-primary animate-spin" />
        </div>
      )}
      
      {/* Image */}
      <img
        src={hasError ? '/placeholder.svg' : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "absolute inset-0 w-full h-full object-contain p-1 transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  );
});

ProductCardImage.displayName = 'ProductCardImage';

export const CategoryProductCard = memo(({
  id,
  image,
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
}: CategoryProductCardProps) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();

  const isActiveBoosted = isBoosted && boostedUntil && new Date(boostedUntil) > new Date();
  const isFav = isFavorite(id);

  const handleClick = useCallback(() => {
    navigate(`/product/${id}`);
  }, [navigate, id]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id);
  }, [toggleFavorite, id]);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98]",
        "border border-gray-100 shadow-sm hover:shadow-md",
        isActiveBoosted && "ring-1 ring-amber-400/50"
      )}
    >
      {/* Badges - Position absolue en haut à gauche */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {isActiveBoosted && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0.5 font-medium rounded-md shadow-sm">
            ⭐ Vedette
          </Badge>
        )}
        {!isActiveBoosted && badge && (
          <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-md shadow-sm">
            {badge}
          </Badge>
        )}
        {isFlashSale && (
          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] px-2 py-0.5 rounded-md shadow-sm">
            ⚡ Flash
          </Badge>
        )}
        {discount > 0 && (
          <Badge className="bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-md shadow-sm">
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Bouton favoris - Position absolue en haut à droite */}
      <button
        onClick={handleFavoriteClick}
        className={cn(
          "absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all",
          "bg-white/90 shadow-sm backdrop-blur-sm active:scale-90",
          isFav && "bg-red-50"
        )}
      >
        <Heart 
          className={cn(
            "w-4 h-4 transition-colors",
            isFav ? "text-red-500 fill-current" : "text-gray-400"
          )} 
        />
      </button>

      {/* Image du produit - Aspect ratio 1:1 avec contain */}
      <ProductCardImage src={image} alt={title} />

      {/* Informations produit */}
      <div className="p-2.5 space-y-1.5">
        {/* Titre du produit - Max 2 lignes */}
        <h3 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug min-h-[2.5rem]">
          {title}
        </h3>

        {/* Rating inline compact */}
        <div className="flex items-center gap-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < Math.floor(rating)
                    ? "text-amber-400 fill-current"
                    : "text-gray-200 fill-current"
                )}
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-400">({reviews})</span>
        </div>

        {/* Prix - Mise en évidence */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-bold text-gray-900">
            {salePrice.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-500 font-medium">FCFA</span>
        </div>
        
        {originalPrice > salePrice && (
          <span className="text-[10px] text-gray-400 line-through">
            {originalPrice.toLocaleString()} FCFA
          </span>
        )}

        {/* Nom de la boutique */}
        {shop_name && (
          <p className="text-[10px] text-primary truncate pt-0.5">
            {shop_name}
          </p>
        )}
      </div>
    </div>
  );
});

CategoryProductCard.displayName = 'CategoryProductCard';

export default CategoryProductCard;
