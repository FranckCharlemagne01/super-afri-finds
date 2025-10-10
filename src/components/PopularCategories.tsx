import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { categories } from "@/data/categories";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

export const PopularCategories = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [popularCategories, setPopularCategories] = useState<typeof categories>([]);
  const isMobile = useIsMobile();

  // Récupérer les catégories avec des produits actifs
  useEffect(() => {
    const fetchActiveCategories = async () => {
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('category')
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching active categories:', error);
          setPopularCategories(categories.slice(0, 12));
          return;
        }

        // Extraire les catégories uniques depuis les produits
        const activeCategories = new Set(products?.map(p => p.category) || []);
        
        // Filtrer les catégories qui ont des produits actifs
        const filteredCategories = categories.filter(cat => 
          cat.subcategories.some(sub => activeCategories.has(sub.slug))
        );

        setPopularCategories(filteredCategories.slice(0, 12));
      } catch (error) {
        console.error('Error:', error);
        setPopularCategories(categories.slice(0, 12));
      }
    };

    fetchActiveCategories();
  }, []);

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
      {/* Barre défilante horizontale - style TEMU sans flèches */}
      <div
        ref={scrollRef}
        className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1 touch-pan-x"
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
            className="flex-shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-gradient-to-br from-muted/60 to-muted/40 hover:from-primary/15 hover:to-primary/10 hover:shadow-lg text-sm sm:text-base font-semibold text-foreground whitespace-nowrap transition-all duration-300 border border-border/50 hover:border-primary/30 active:scale-95"
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};
