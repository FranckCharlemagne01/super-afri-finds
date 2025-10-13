import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ShoppingBag, Zap, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation } from "@/hooks/useUserLocation";

interface BannerSlide {
  type: "promo" | "product" | "featured";
  title: string;
  subtitle?: string;
  image?: string;
  cta?: string;
  link?: string;
  price?: number;
  originalPrice?: number;
}

const promoSlides: BannerSlide[] = [
  {
    type: "promo",
    title: "Djassa – Achetez & vendez en toute simplicité",
    subtitle: "Votre marketplace #1 en Côte d'Ivoire",
    cta: "Découvrir"
  },
  {
    type: "promo",
    title: "Mode Femme -30%",
    subtitle: "Profitez de nos offres exclusives",
    cta: "Voir les offres",
    link: "/category/mode-femme"
  },
  {
    type: "promo",
    title: "Offre spéciale High-Tech",
    subtitle: "Les meilleures marques aux meilleurs prix",
    cta: "Découvrir",
    link: "/category/technologie-electronique"
  }
];

export const DynamicPromoBanner = () => {
  const { location: userLocation } = useUserLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [allSlides, setAllSlides] = useState<BannerSlide[]>(promoSlides);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_boosted', true)
        .eq('is_active', true);
      
      // Filtrage géographique : même ville ET même pays
      if (userLocation.city && userLocation.country) {
        query = query
          .eq('city', userLocation.city)
          .eq('country', userLocation.country);
      }
      
      const { data: products } = await query.limit(3);

      if (products && products.length > 0) {
        const productSlides: BannerSlide[] = products.map(product => ({
          type: "featured" as const,
          title: product.title,
          subtitle: product.category,
          image: product.images?.[0] || "",
          price: Number(product.price),
          originalPrice: product.original_price ? Number(product.original_price) : undefined,
          cta: "Voir",
          link: `/product/${product.id}`
        }));

        // Mélanger les slides: promo, produit, promo, produit...
        const mixed: BannerSlide[] = [];
        const maxLength = Math.max(promoSlides.length, productSlides.length);
        for (let i = 0; i < maxLength; i++) {
          if (i < promoSlides.length) mixed.push(promoSlides[i]);
          if (i < productSlides.length) mixed.push(productSlides[i]);
        }
        setAllSlides(mixed);
      }
    };

    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % allSlides.length);
        setIsAnimating(false);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, [allSlides.length]);

  const handleClick = () => {
    const slide = allSlides[currentSlide];
    if (slide.link) {
      navigate(slide.link);
    } else if (slide.cta === "Découvrir" && slide.type === "promo") {
      // Scroll fluide vers la section "Offres Spéciales"
      const offresSpecialesSection = document.querySelector('section:has(h2:contains("Offres Spéciales"))');
      if (!offresSpecialesSection) {
        // Fallback: rechercher par texte
        const allH2 = document.querySelectorAll('h2');
        const targetH2 = Array.from(allH2).find(h2 => h2.textContent?.includes('Offres Spéciales'));
        if (targetH2) {
          targetH2.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        offresSpecialesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const currentSlideData = allSlides[currentSlide];
  const isFirstSlide = currentSlide === 0;

  return (
    <div className="w-full overflow-hidden rounded-lg sm:rounded-xl shadow-lg">
      <div
        className={`relative min-h-[180px] sm:min-h-[220px] p-4 sm:p-6 md:p-8 transition-all duration-500 ${
          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        } ${
          currentSlideData?.type === "featured" 
            ? "bg-gradient-to-br from-primary/10 via-background to-accent/10" 
            : "gradient-accent animate-gradient"
        }`}
      >
        {/* Icône animée pour la première slide */}
        {isFirstSlide && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 animate-bounce-subtle">
            <ShoppingBag className="w-8 h-8 sm:w-12 sm:h-12 text-primary opacity-20" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          {/* Image pour les produits vedettes */}
          {currentSlideData?.type === "featured" && currentSlideData.image && (
            <div className="w-full sm:w-32 md:w-40 h-32 md:h-40 rounded-lg overflow-hidden shadow-md flex-shrink-0">
              <img 
                src={currentSlideData.image} 
                alt={currentSlideData.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className={`flex-1 text-center ${currentSlideData?.type === "featured" ? "sm:text-left" : "sm:text-left"}`}>
            {/* Badge pour les promotions */}
            {currentSlideData?.type === "promo" && !isFirstSlide && (
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 rounded-full mb-2 animate-pulse-slow">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold text-primary">Offre Spéciale</span>
              </div>
            )}

            {/* Icône pour la première slide */}
            {isFirstSlide && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            )}

            <h3 className={`font-bold text-foreground mb-2 ${
              isFirstSlide 
                ? "text-xl sm:text-2xl md:text-3xl animate-fade-in" 
                : "text-lg sm:text-xl md:text-2xl"
            }`}>
              {currentSlideData?.title}
            </h3>
            
            {currentSlideData?.subtitle && (
              <p className="text-sm sm:text-base text-muted-foreground mb-3">
                {currentSlideData.subtitle}
              </p>
            )}

            {/* Prix pour les produits vedettes */}
            {currentSlideData?.type === "featured" && currentSlideData.price && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <span className="text-xl sm:text-2xl font-bold text-primary">
                  {currentSlideData.price.toLocaleString()} FCFA
                </span>
                {currentSlideData.originalPrice && (
                  <span className="text-sm sm:text-base text-muted-foreground line-through">
                    {currentSlideData.originalPrice.toLocaleString()} FCFA
                  </span>
                )}
              </div>
            )}
          </div>

          {currentSlideData?.cta && (
            <Button
              onClick={handleClick}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-2 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap flex-shrink-0"
            >
              {currentSlideData.cta}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
        
        {/* Indicateurs de slide */}
        <div className="flex justify-center gap-2 mt-6">
          {allSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary shadow-md"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Aller à la slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
