import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import { categories } from "@/data/categories";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    <div className="w-full py-4 sm:py-5 bg-muted/20 rounded-2xl">
      <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
        ✨ Explorez vos centres d'intérêt
      </h2>
      <div className="relative group px-1">
        {/* Flèche gauche */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={scrollLeft}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 shadow-lg text-primary p-2 rounded-full transition-all",
            "opacity-70 hover:opacity-100 active:scale-95"
          )}
          aria-label="Défiler vers la gauche"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </motion.button>

        {/* Flèche droite */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={scrollRight}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 shadow-lg text-primary p-2 rounded-full transition-all",
            "opacity-70 hover:opacity-100 active:scale-95"
          )}
          aria-label="Défiler vers la droite"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </motion.button>

        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-6 sm:px-8 md:px-10 touch-pan-x pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x proximity",
          }}
        >
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.id}
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/category/${category.slug}`)}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  scrollSnapAlign: "start"
                }}
                className="flex-shrink-0 flex flex-col items-center gap-2 p-3 sm:p-4 min-w-[90px] sm:min-w-[100px] rounded-2xl bg-card border border-border/30 hover:border-primary/20 hover:bg-accent/10 transition-all duration-200 shadow-sm hover:shadow-md animate-fade-in"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-center line-clamp-2 text-foreground">
                  {category.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
