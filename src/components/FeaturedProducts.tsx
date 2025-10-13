import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { useUserLocation } from "@/hooks/useUserLocation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Sparkles, TrendingUp } from "lucide-react";
import marketplaceShowcase from "@/assets/marketplace-showcase-clean.jpg";
import { useNavigate } from "react-router-dom";
import { useStableAuth } from "@/hooks/useStableAuth";
import { useStableRole } from "@/hooks/useStableRole";
import { Button } from "@/components/ui/button";

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
}

export const FeaturedProducts = () => {
  const { location: userLocation } = useUserLocation();
  const [boostedProducts, setBoostedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useStableAuth();
  const { isSeller } = useStableRole();

  const handleStartSelling = () => {
    if (!isAuthenticated) {
      navigate('/auth?role=seller');
    } else if (isSeller) {
      navigate('/seller/dashboard');
    } else {
      navigate('/?upgrade=seller');
    }
  };

  useEffect(() => {
    fetchBoostedProducts();
  }, [userLocation.city, userLocation.country]);

  const fetchBoostedProducts = async () => {
    try {
      setLoading(true);
      
      const now = new Date().toISOString();
      let query = supabase
        .from("products")
        .select("*")
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
      setBoostedProducts(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des produits boostés:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 px-4 bg-gradient-to-b from-amber-50/30 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-7 h-7 text-amber-500" />
            <h2 className="text-3xl font-bold">Produits mis en avant par nos vendeurs</h2>
          </div>
          <p className="text-muted-foreground mb-8">
            Découvrez les articles les plus populaires et sponsorisés de la semaine !
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (boostedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-amber-50/30 to-background relative overflow-hidden">
      {/* Effet de lumière douce en arrière-plan */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Titre de la section */}
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-7 h-7 text-amber-500 animate-pulse" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
            Produits Vedette
          </h2>
        </div>
        <p className="text-muted-foreground mb-8">
          Découvrez nos boutiques partenaires • Marketplace dynamique
        </p>

        {/* Image marketplace */}
        <div className="mb-6 relative w-full overflow-hidden rounded-2xl shadow-lg">
          <img 
            src={marketplaceShowcase} 
            alt="Marketplace Djassa - Vitrine de produits vedettes"
            className="w-full h-auto object-cover transition-transform duration-500 hover:scale-[1.02]"
            loading="lazy"
          />
        </div>

        {/* Bouton Commencer à vendre */}
        <div className="mb-8 flex justify-end md:justify-end justify-center">
          <Button
            onClick={handleStartSelling}
            className="group bg-[#FF6600] hover:bg-[#FF8533] text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 rounded-full"
          >
            <TrendingUp className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Commencer à vendre sur Djassa
          </Button>
        </div>

        {/* Carrousel produits boostés */}
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
                <div className="relative">
                  {/* Badge Sponsorisé */}
                  <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                    ⭐ Sponsorisé
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
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4 bg-background/80 backdrop-blur-sm hover:bg-background" />
          <CarouselNext className="hidden md:flex -right-4 bg-background/80 backdrop-blur-sm hover:bg-background" />
        </Carousel>

        {/* Indicateur du nombre de produits sponsorisés */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {boostedProducts.length} produit{boostedProducts.length > 1 ? "s" : ""} sponsorisé{boostedProducts.length > 1 ? "s" : ""} actuellement
          </p>
        </div>
      </div>
    </section>
  );
};
