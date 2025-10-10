import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BannerSlide {
  type: "promo" | "product";
  title: string;
  subtitle?: string;
  image?: string;
  cta?: string;
  link?: string;
}

const slides: BannerSlide[] = [
  {
    type: "promo",
    title: "Achetez & vendez en toute simplicité",
    subtitle: "Rejoignez des milliers de vendeurs sur Djassa",
    cta: "Commencer maintenant"
  },
  {
    type: "product",
    title: "Offres Flash du jour",
    subtitle: "Jusqu'à -70% sur une sélection de produits",
    cta: "Voir les offres",
    link: "/flash-sales"
  },
  {
    type: "promo",
    title: "Devenez vendeur premium",
    subtitle: "28 jours d'essai gratuit + 50 jetons offerts",
    cta: "S'inscrire"
  }
];

export const DynamicPromoBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsAnimating(false);
      }, 300);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    const slide = slides[currentSlide];
    if (slide.link) {
      navigate(slide.link);
    } else if (slide.cta === "Commencer maintenant" || slide.cta === "S'inscrire") {
      navigate('/auth?mode=signup&role=seller');
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-lg sm:rounded-xl">
      <div
        className={`gradient-accent p-4 sm:p-6 md:p-8 transition-opacity duration-300 ${
          isAnimating ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2">
              {slides[currentSlide].title}
            </h3>
            {slides[currentSlide].subtitle && (
              <p className="text-sm sm:text-base text-muted-foreground">
                {slides[currentSlide].subtitle}
              </p>
            )}
          </div>
          {slides[currentSlide].cta && (
            <Button
              onClick={handleClick}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-2 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap"
            >
              {slides[currentSlide].cta}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
        
        {/* Indicateurs de slide */}
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
