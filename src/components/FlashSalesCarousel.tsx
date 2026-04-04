import { ProductCard } from "./ProductCard";
import { getProductImage } from "@/utils/productImageHelper";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Zap, Timer } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  images?: string[];
  rating?: number;
  reviews_count?: number;
  badge?: string;
  is_flash_sale?: boolean;
  seller_id: string;
  video_url?: string;
  is_boosted?: boolean;
  boosted_until?: string;
  is_sold?: boolean;
  stock_quantity?: number;
  is_active?: boolean;
  description?: string;
  shop?: { shop_slug: string; shop_name: string };
}

interface FlashSalesCarouselProps {
  products: Product[];
}

export const FlashSalesCarousel = ({ products }: FlashSalesCarouselProps) => {
  const navigate = useNavigate();

  if (products.length === 0) return null;

  return (
    <section className="mb-6 sm:mb-8 lg:mb-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[hsl(var(--promo))] to-[hsl(0,84%,50%)] rounded-xl flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              Offres Flash
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Timer className="w-3 h-3 text-[hsl(var(--promo))]" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Durée limitée</span>
            </div>
          </div>
          <Badge className="bg-[hsl(var(--promo))] text-white animate-pulse text-[10px] sm:text-xs px-2.5 py-0.5 rounded-lg ml-2">
            ⚡ FLASH
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/flash-sales')}
          className="text-xs lg:text-sm hover:text-primary transition-colors rounded-lg"
        >
          Voir tout →
        </Button>
      </div>

      {/* Horizontal carousel */}
      <Carousel
        opts={{ align: "start", loop: true }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 sm:-ml-3">
          {products.slice(0, 12).map((product, index) => (
            <CarouselItem
              key={product.id}
              className="pl-2 sm:pl-3 basis-[48%] sm:basis-1/3 lg:basis-1/4 xl:basis-1/5"
            >
              <div className="animate-fade-in" style={{ animationDelay: `${index * 40}ms` }}>
                <ProductCard
                  id={product.id}
                  image={getProductImage(product.images, 0)}
                  images={product.images}
                  title={product.title}
                  originalPrice={product.original_price || product.price}
                  salePrice={product.price}
                  discount={product.discount_percentage || 0}
                  rating={product.rating || 0}
                  reviews={product.reviews_count || 0}
                  badge={product.badge}
                  isFlashSale={product.is_flash_sale || false}
                  seller_id={product.seller_id}
                  videoUrl={product.video_url}
                  isBoosted={product.is_boosted || false}
                  boostedUntil={product.boosted_until}
                  isSold={product.is_sold || false}
                  stockQuantity={product.stock_quantity}
                  description={product.description}
                  shop_slug={product.shop?.shop_slug}
                  shop_name={product.shop?.shop_name}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-3 bg-background/90 backdrop-blur-sm hover:bg-background shadow-md" />
        <CarouselNext className="hidden md:flex -right-3 bg-background/90 backdrop-blur-sm hover:bg-background shadow-md" />
      </Carousel>
    </section>
  );
};
