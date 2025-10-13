import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Sparkles } from "lucide-react";

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
  seller_shops?: {
    shop_slug: string;
    shop_name: string;
  };
}

export const FeaturedProductsGrid = () => {
  const { location: userLocation } = useUserLocation();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [userLocation.city, userLocation.country]);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      
      const now = new Date().toISOString();
      let query = supabase
        .from("products")
        .select(`
          *,
          seller_shops!shop_id(shop_slug, shop_name)
        `)
        .eq("is_active", true)
        .eq("is_boosted", true)
        .gte("boosted_until", now);
      
      // Filtrage géographique : même ville ET même pays
      if (userLocation.city && userLocation.country) {
        query = query
          .eq("city", userLocation.city)
          .eq("country", userLocation.country);
      }
      
      const { data, error } = await query
        .order("boosted_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des produits vedettes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-12 animate-fade-in">
        <div className="bg-gradient-to-br from-muted/30 via-muted/10 to-transparent p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-xl animate-float">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
                ✨ PRODUITS VEDETTES
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Découvrez nos boutiques partenaires • Offres exclusives du moment
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[3/4] rounded-2xl shadow-md" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="mb-12 animate-fade-in">
      <div className="bg-gradient-to-br from-muted/30 via-muted/10 to-transparent p-6 sm:p-8 rounded-2xl shadow-sm border border-border/30">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-xl animate-float">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
              ✨ PRODUITS VEDETTES
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Découvrez nos boutiques partenaires • {featuredProducts.length} produits exclusifs
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
          {featuredProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="group relative w-full animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Badge Vedette modernisé */}
              <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-500 via-orange-600 to-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-pulse-slow">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Vedette</span>
              </div>
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
                shop_slug={product.seller_shops?.shop_slug}
                shop_name={product.seller_shops?.shop_name}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
