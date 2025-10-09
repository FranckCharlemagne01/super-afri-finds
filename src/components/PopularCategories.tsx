import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { categories } from "@/data/categories";
import { useIsMobile } from "@/hooks/use-mobile";

export const PopularCategories = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const isMobile = useIsMobile();

  // Sélectionner les catégories principales les plus populaires
  const popularCategories = categories.slice(0, 12);

  // Défilement fluide avec la molette ou scroll horizontal
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.6; // Défiler environ 60% (3-5 catégories)
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Support du défilement avec la molette de souris
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        scrollElement.scrollBy({
          left: e.deltaY,
          behavior: "auto", // Immédiat pour la molette
        });
      }
    };

    scrollElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => scrollElement.removeEventListener("wheel", handleWheel);
  }, []);

  // Mettre à jour la visibilité des flèches
  const updateArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", updateArrows);
      // Vérifier au montage
      updateArrows();
      return () => scrollElement.removeEventListener("scroll", updateArrows);
    }
  }, []);

  if (popularCategories.length === 0) return null;

  return (
    <div className="relative py-2">
      {/* Boutons de navigation - visibles uniquement sur desktop */}
      {!isMobile && showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 shadow-sm hover:bg-background hover:shadow-md transition-all duration-200"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}

      {!isMobile && showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 shadow-sm hover:bg-background hover:shadow-md transition-all duration-200"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}

      {/* Barre défilante horizontale */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {popularCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => navigate(`/category/${category.slug}`)}
            className="flex-shrink-0 px-4 py-2 rounded-full bg-muted/50 hover:bg-primary/10 hover:shadow-md text-sm font-medium text-foreground whitespace-nowrap transition-all duration-200 border border-transparent hover:border-primary/20"
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};
