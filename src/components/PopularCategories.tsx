import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import { categories } from "@/data/categories";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const PopularCategories = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Support du défilement avec la molette de souris
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        scrollElement.scrollBy({
          left: e.deltaY,
          behavior: "auto",
        });
      }
    };

    scrollElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => scrollElement.removeEventListener("wheel", handleWheel);
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full py-6 bg-muted/30 rounded-xl">
      <h2 className="text-xl md:text-2xl font-black mb-6 px-4 md:px-6 uppercase bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent drop-shadow-sm animate-fade-in">
        ✨ Explorez vos centres d'intérêt
      </h2>
      <div className="relative group px-2">
        {/* Flèche gauche */}
        <button
          onClick={scrollLeft}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg text-primary p-2 md:p-3 rounded-full transition-all",
            "md:opacity-100 opacity-60 hover:scale-110 active:scale-95"
          )}
          aria-label="Défiler vers la gauche"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Flèche droite */}
        <button
          onClick={scrollRight}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg text-primary p-2 md:p-3 rounded-full transition-all",
            "md:opacity-100 opacity-60 hover:scale-110 active:scale-95"
          )}
          aria-label="Défiler vers la droite"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-8 md:px-10 touch-pan-x relative pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => navigate(`/category/${category.slug}`)}
                className="flex-shrink-0 flex flex-col items-center gap-2 p-4 min-w-[100px] sm:min-w-[110px] rounded-2xl bg-card border border-border/40 hover:border-primary/30 hover:bg-accent/30 transition-all duration-300 active:scale-95 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-foreground text-center line-clamp-2">
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
