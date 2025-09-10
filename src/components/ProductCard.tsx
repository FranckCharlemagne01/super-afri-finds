import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingCart } from "lucide-react";

interface ProductCardProps {
  image: string;
  title: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  rating: number;
  reviews: number;
  badge?: string;
  isFlashSale?: boolean;
}

export const ProductCard = ({
  image,
  title,
  originalPrice,
  salePrice,
  discount,
  rating,
  reviews,
  badge,
  isFlashSale = false,
}: ProductCardProps) => {
  return (
    <Card className="relative overflow-hidden hover-lift cursor-pointer border-0 shadow-lg">
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
      <button className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors">
        <Heart className="w-4 h-4 text-muted-foreground hover:text-promo transition-colors" />
      </button>

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
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

        {/* Add to Cart Button */}
        <Button 
          variant="promo" 
          size="sm" 
          className="w-full mt-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Ajouter au panier
        </Button>
      </div>
    </Card>
  );
};