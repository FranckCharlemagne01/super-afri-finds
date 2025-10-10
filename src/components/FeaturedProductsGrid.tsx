import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          seller_shops!shop_id(shop_slug, shop_name)
        `)
        .eq("is_active", true)
        .eq("is_boosted", true)
        .gte("boosted_until", new Date().toISOString())
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
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-xl">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
              ✨ Produits Vedettes
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Mis en avant par nos vendeurs • Offres exclusives
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-[320px] sm:h-[360px] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-xl animate-pulse-slow">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
            ✨ Produits Vedettes
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Mis en avant par nos vendeurs • {featuredProducts.length} produits exclusifs
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {featuredProducts.map((product) => (
          <div key={product.id} className="group relative">
            {/* Badge Vedette - Style TEMU */}
            <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-amber-500 via-orange-600 to-pink-600 text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-current" />
              Vedette
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
    </section>
  );
};
