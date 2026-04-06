import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories } from "@/data/categories";

// Top 10 categories for quick access on homepage
const quickCategories = categories.slice(0, 10);

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

  const categoryColors: Record<string, string> = {
    "mode-vetements": "from-primary to-[hsl(16,100%,50%)]",
    "chaussures": "from-slate-600 to-slate-700",
    "sacs-accessoires": "from-pink-500 to-rose-500",
    "telephones-electronique": "from-blue-500 to-blue-600",
    "beaute-coiffure": "from-purple-500 to-violet-500",
    "maison-cuisine": "from-[hsl(var(--success))] to-emerald-600",
    "meubles": "from-amber-600 to-yellow-700",
    "auto-moto": "from-red-500 to-rose-600",
    "bebe-enfants": "from-cyan-500 to-teal-500",
    "alimentation": "from-orange-500 to-amber-500",
  };

  return (
    <div className="w-full py-3 sm:py-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm sm:text-base md:text-lg font-bold text-foreground">
          Catégories
        </h2>
        <button
          onClick={() => navigate('/categories')}
          className="text-xs text-primary font-medium"
        >
          Voir tout →
        </button>
      </div>
      <div className="relative group">
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
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-1 sm:px-2 pb-2 scroll-snap-x touch-scroll-x scroll-gpu"
        >
          {quickCategories.map((cat) => {
            const Icon = cat.icon;
            const color = categoryColors[cat.slug] || "from-gray-500 to-gray-600";
            return (
              <button
                key={cat.slug}
                onClick={() => navigate(`/category/${cat.slug}`)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[60px] sm:w-[72px] group/cat"
              >
                <div className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-sm transition-transform duration-200 group-active/cat:scale-95",
                  color
                )}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-foreground text-center leading-tight line-clamp-1">
                  {cat.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
