import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProductImage, handleImageError } from "@/utils/productImageHelper";
import { useProductPrefetch } from "@/hooks/useProductCache";

export interface ExplorerProductCardProps {
  id: string;
  image: string;
  title: string;
  salePrice: number;
  originalPrice?: number;
  discount?: number;
  badge?: string;
  isFlashSale?: boolean;
  hasVideo?: boolean;
  shopName?: string;
}

/**
 * Lightweight product card for Explorer feed.
 * Shows ONLY: image, title, price, old price, promo/new badge, 🎥 icon, shop name.
 * No rating, no favorites button, no quick view — keeps the list fast & clean.
 * Full details available on the product detail page.
 */
export const ExplorerProductCard = memo(({
  id,
  image,
  title,
  salePrice,
  originalPrice,
  discount = 0,
  badge,
  isFlashSale,
  hasVideo,
  shopName,
}: ExplorerProductCardProps) => {
  const navigate = useNavigate();
  const { prefetchOnHover, cancelPrefetch } = useProductPrefetch();
  const [loaded, setLoaded] = useState(false);

  const handleClick = useCallback(() => {
    navigate(`/product/${id}`);
  }, [navigate, id]);

  const safeSrc = getProductImage([image], 0);

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => prefetchOnHover(id)}
      onMouseLeave={cancelPrefetch}
      onTouchStart={() => prefetchOnHover(id)}
      className="relative bg-card rounded-xl overflow-hidden cursor-pointer border border-border/50 shadow-sm transition-transform duration-150 active:scale-[0.98]"
    >
      {/* Image */}
      <div className="relative w-full h-[180px] sm:h-[220px] md:h-[260px] bg-muted overflow-hidden">
        <img
          src={safeSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={handleImageError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Top-left badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5 z-10">
          {discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0.5 font-bold rounded-md shadow-sm">
              -{discount}%
            </Badge>
          )}
          {isFlashSale && (
            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] px-1.5 py-0.5 rounded-md shadow-sm">
              ⚡ Flash
            </Badge>
          )}
          {!isFlashSale && badge && (
            <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-md shadow-sm">
              {badge}
            </Badge>
          )}
        </div>

        {/* Video indicator */}
        {hasVideo && (
          <div className="absolute bottom-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center shadow-md pointer-events-none">
            <Video className="w-3.5 h-3.5 text-white" fill="currentColor" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 space-y-1">
        <h3 className="text-[11px] sm:text-xs font-medium text-foreground line-clamp-2 leading-tight min-h-[2rem]">
          {title}
        </h3>

        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="text-sm sm:text-base font-bold text-foreground tabular-nums">
            {salePrice.toLocaleString()}
          </span>
          <span className="text-[9px] text-muted-foreground font-medium">FCFA</span>
          {originalPrice && originalPrice > salePrice && (
            <span className="text-[9px] text-muted-foreground line-through tabular-nums ml-1">
              {originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {shopName && (
          <p className="text-[9px] text-muted-foreground truncate">
            {shopName}
          </p>
        )}
      </div>
    </div>
  );
});

ExplorerProductCard.displayName = "ExplorerProductCard";
export default ExplorerProductCard;
