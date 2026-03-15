import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, ExternalLink, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getProductImage, getProductImages, handleImageError } from "@/utils/productImageHelper";

export interface QuickViewProduct {
  id: string;
  image: string;
  images?: string[];
  title: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  rating: number;
  reviews: number;
  description?: string;
  badge?: string;
  isFlashSale?: boolean;
  isBoosted?: boolean;
  seller_id?: string;
}

interface QuickViewDialogProps {
  product: QuickViewProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickViewDialog = memo(({ product, open, onOpenChange }: QuickViewDialogProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const handleViewProduct = useCallback(() => {
    if (!product) return;
    onOpenChange(false);
    navigate(`/product/${product.id}`);
  }, [product, navigate, onOpenChange]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addToCart(product.id);
  }, [product, addToCart]);

  const handleToggleFavorite = useCallback(() => {
    if (!product) return;
    toggleFavorite(product.id);
  }, [product, toggleFavorite]);

  if (!product) return null;

  const isFav = isFavorite(product.id);
  
  // Get all valid images, fallback to single image
  const allImages = product.images 
    ? getProductImages(product.images) 
    : [];
  const validImages = allImages.length > 0 
    ? allImages 
    : [getProductImage([product.image], 0)];
  
  const hasMultipleImages = validImages.length > 1;
  const currentImage = validImages[activeIndex] || validImages[0];

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    setImgLoaded(false);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % validImages.length);
    setImgLoaded(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setActiveIndex(0); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 overflow-hidden rounded-2xl border-border/50 gap-0 max-h-[90vh] flex flex-col">
        {/* Image Section - fixed height, no overflow */}
        <div
          className="relative w-full flex-shrink-0 bg-muted overflow-hidden touch-pan-x"
          style={{ height: 'clamp(200px, 50vw, 320px)' }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (!hasMultipleImages || touchStartX.current === null) return;
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(diff) > 40) {
              if (diff < 0) setActiveIndex((prev) => (prev + 1) % validImages.length);
              else setActiveIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
              setImgLoaded(false);
            }
            touchStartX.current = null;
          }}
        >
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.img
              key={activeIndex}
              src={currentImage}
              alt={product.title}
              loading="eager"
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: imgLoaded ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onLoad={() => setImgLoaded(true)}
              onError={handleImageError}
              className="w-full h-full object-contain"
            />
          </AnimatePresence>

          {/* Navigation arrows */}
          {hasMultipleImages && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md flex items-center justify-center text-foreground hover:bg-background transition-colors z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md flex items-center justify-center text-foreground hover:bg-background transition-colors z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* Dots indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {validImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveIndex(i); setImgLoaded(false); }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200",
                      i === activeIndex 
                        ? "bg-background w-4 shadow-sm" 
                        : "bg-background/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {product.isBoosted && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0.5 rounded-lg shadow-sm">
                ⭐ Vedette
              </Badge>
            )}
            {product.isFlashSale && (
              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] px-2 py-0.5 rounded-lg shadow-sm">
                ⚡ Flash
              </Badge>
            )}
            {product.discount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 font-bold rounded-lg shadow-sm">
                -{product.discount}%
              </Badge>
            )}
          </div>

          {/* Favorite button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleToggleFavorite}
            className={cn(
              "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-colors z-10",
              isFav ? "bg-red-50/90 text-red-500" : "bg-background/90 text-muted-foreground"
            )}
          >
            <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
          </motion.button>
        </div>

        {/* Thumbnails strip */}
        {hasMultipleImages && (
          <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto scrollbar-hide">
            {validImages.map((img, i) => (
              <button
                key={i}
                onClick={() => { setActiveIndex(i); setImgLoaded(false); }}
                className={cn(
                  "flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200",
                  i === activeIndex 
                    ? "border-primary ring-1 ring-primary/30" 
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Content Section */}
        <div className="p-4 sm:p-5 space-y-3">
          <DialogHeader className="space-y-1.5 p-0">
            <DialogTitle className="text-base sm:text-lg font-semibold text-foreground leading-snug line-clamp-2">
              {product.title}
            </DialogTitle>
            <DialogDescription className="sr-only">Aperçu rapide du produit</DialogDescription>
          </DialogHeader>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5",
                    i < Math.floor(product.rating)
                      ? "text-amber-400 fill-current"
                      : "text-muted fill-current"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({product.reviews} avis)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
              {product.salePrice.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground font-medium">FCFA</span>
            {product.originalPrice > product.salePrice && (
              <span className="text-sm text-muted-foreground/70 line-through tabular-nums">
                {product.originalPrice.toLocaleString()} FCFA
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {product.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="default"
              className="flex-1 h-11 rounded-xl font-medium text-sm"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Ajouter au panier
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl font-medium text-sm"
              onClick={handleViewProduct}
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Voir le produit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

QuickViewDialog.displayName = 'QuickViewDialog';
