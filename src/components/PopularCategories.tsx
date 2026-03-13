import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const quickCategories = [
  { name: "Mode Homme", slug: "mode-homme" },
  { name: "Mode Femme", slug: "mode-femme" },
  { name: "Mode Enfant", slug: "enfants-bebes" },
  { name: "Chaussures Homme", slug: "chaussures-homme" },
  { name: "Chaussures Femme", slug: "chaussures-femme" },
  { name: "Téléphones", slug: "telephones-portables-accessoires" },
  { name: "Accessoires Téléphones", slug: "accessoires-telephones" },
  { name: "Montres Homme", slug: "montres-homme" },
  { name: "Montres Femme", slug: "montres-femme" },
  { name: "Beauté", slug: "beaute-cosmetique" },
  { name: "Maison & Décoration", slug: "maison-vie-quotidienne" },
  { name: "Jouets Enfants", slug: "jouets-jeux-educatifs" },
];

export const PopularCategories = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        scrollElement.scrollBy({ left: e.deltaY, behavior: "auto" });
      }
    };

    scrollElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => scrollElement.removeEventListener("wheel", handleWheel);
  }, []);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  return (
    <div className="w-full py-4 sm:py-5">
      <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
        ✨ Explorez vos centres d'intérêt
      </h2>
      <div className="relative group px-1">
        <button
          onClick={scrollLeft}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card shadow-md text-foreground p-1.5 rounded-full transition-all",
            "opacity-0 group-hover:opacity-100 hidden sm:flex"
          )}
          aria-label="Défiler vers la gauche"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={scrollRight}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card shadow-md text-foreground p-1.5 rounded-full transition-all",
            "opacity-0 group-hover:opacity-100 hidden sm:flex"
          )}
          aria-label="Défiler vers la droite"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-3 sm:px-6 touch-pan-x pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {quickCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="flex-shrink-0 px-4 py-2.5 rounded-full border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 shadow-sm"
            >
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
