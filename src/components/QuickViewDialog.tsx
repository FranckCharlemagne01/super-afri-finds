import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, ExternalLink, Heart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getProductImage, handleImageError } from "@/utils/productImageHelper";

export interface QuickViewProduct {
  id: string;
  image: string;
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
  const safeSrc = getProductImage([product.image], 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 overflow-hidden rounded-2xl border-border/50 gap-0">
        {/* Image Section */}
        <div className="relative w-full aspect-square sm:aspect-[4/3] bg-muted overflow-hidden">
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
            </div>
          )}
          <img
            src={safeSrc}
            alt={product.title}
            loading="eager"
            onLoad={() => setImgLoaded(true)}
            onError={handleImageError}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
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
              "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-colors",
              isFav ? "bg-red-50/90 text-red-500" : "bg-background/90 text-muted-foreground"
            )}
          >
            <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
          </motion.button>
        </div>

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
