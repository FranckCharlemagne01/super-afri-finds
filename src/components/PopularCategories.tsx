import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import { categories } from "@/data/categories";

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

  return (
    <div className="w-full py-3">
      <div
        ref={scrollRef}
        className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-1 touch-pan-x"
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
              className="flex-shrink-0 flex flex-col items-center gap-2 p-3 min-w-[90px] sm:min-w-[100px] rounded-lg hover:bg-accent/50 transition-all duration-200 active:scale-95"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center line-clamp-2">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
