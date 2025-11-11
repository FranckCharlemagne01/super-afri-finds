import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { CountdownTimer } from "./CountdownTimer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  images: string[];
  rating: number;
  reviews_count: number;
  badge: string | null;
  is_flash_sale: boolean;
  seller_id: string;
  video_url: string | null;
  is_boosted: boolean;
  boosted_until: string | null;
  boosted_at: string | null;
  seller_shops?: {
    shop_slug: string;
    shop_name: string;
  };
}

export const BoostedProductsSection = () => {
  const [boostedProducts, setBoostedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoostedProducts();
    
    // Rafraîchir toutes les 30 secondes pour retirer les produits expirés
    const interval = setInterval(() => {
      fetchBoostedProducts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchBoostedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          seller_shops!products_shop_id_fkey (
            shop_slug,
            shop_name
          )
        `)
        .eq("is_active", true)
        .eq("is_boosted", true)
        .gte("boosted_until", new Date().toISOString())
        .order("boosted_until", { ascending: true })
        .limit(10);

      if (error) throw error;
      setBoostedProducts(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des produits vedettes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Star className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Produits Vedettes
            </h2>
            <p className="text-sm text-muted-foreground">
              Mis en avant par nos vendeurs
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[380px] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (boostedProducts.length === 0) {
    return null;
  }

  // Si 5 produits ou moins, afficher en grille simple
  if (boostedProducts.length <= 5) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg animate-pulse">
            <Star className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Offres Spéciales
            </h2>
            <p className="text-sm text-muted-foreground">
              Produits boostés par nos vendeurs
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {boostedProducts.map((product) => (
            <div key={product.id} className="group relative hover-scale">
              <ProductCard
                id={product.id}
                image={product.images?.[0] || "/placeholder.svg"}
                title={product.title}
                originalPrice={product.original_price || undefined}
                salePrice={product.price}
                discount={product.discount_percentage || undefined}
                rating={product.rating}
                reviews={product.reviews_count}
                badge={product.badge || undefined}
                isFlashSale={product.is_flash_sale}
                seller_id={product.seller_id}
                videoUrl={product.video_url || undefined}
                isBoosted={product.is_boosted}
                boostedUntil={product.boosted_until || undefined}
                boostedAt={product.boosted_at || undefined}
                shop_slug={product.seller_shops?.shop_slug}
                shop_name={product.seller_shops?.shop_name}
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Si plus de 5 produits, afficher en carousel
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg animate-pulse">
          <Star className="w-6 h-6 text-white fill-current" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Offres Spéciales
          </h2>
          <p className="text-sm text-muted-foreground">
            Produits boostés par nos vendeurs • {boostedProducts.length} produits
          </p>
        </div>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {boostedProducts.map((product) => (
            <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
              <div className="group relative hover-scale">
                <ProductCard
                  id={product.id}
                  image={product.images?.[0] || "/placeholder.svg"}
                  title={product.title}
                  originalPrice={product.original_price || undefined}
                  salePrice={product.price}
                  discount={product.discount_percentage || undefined}
                  rating={product.rating}
                  reviews={product.reviews_count}
                  badge={product.badge || undefined}
                  isFlashSale={product.is_flash_sale}
                  seller_id={product.seller_id}
                  videoUrl={product.video_url || undefined}
                  isBoosted={product.is_boosted}
                  boostedUntil={product.boosted_until || undefined}
                  boostedAt={product.boosted_at || undefined}
                  shop_slug={product.seller_shops?.shop_slug}
                  shop_name={product.seller_shops?.shop_name}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg" />
        <CarouselNext className="hidden md:flex -right-4 bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg" />
      </Carousel>
    </section>
  );
};
