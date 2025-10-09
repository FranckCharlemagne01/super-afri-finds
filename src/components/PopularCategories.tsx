import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { categories } from "@/data/categories";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export const PopularCategories = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Sélectionner les catégories principales les plus populaires
  const popularCategories = [
    categories.find(c => c.slug === "mode-femme"),
    categories.find(c => c.slug === "mode-homme"),
    categories.find(c => c.slug === "technologie-electronique"),
    categories.find(c => c.slug === "beaute-cosmetique"),
    categories.find(c => c.slug === "maison-vie-quotidienne"),
    categories.find(c => c.slug === "enfants-bebes"),
    categories.find(c => c.slug === "sport-sante-bien-etre"),
    categories.find(c => c.slug === "auto-moto"),
  ].filter(Boolean);

  // Calculer dynamiquement le scroll basé sur la largeur d'environ 4 catégories
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.offsetWidth;
      const scrollAmount = containerWidth * 0.75; // Scroll ~75% de la largeur visible (environ 4 catégories)
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

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

  return (
    <div className="relative">
      {/* Bouton scroll gauche */}
      {showLeftArrow && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background shadow-md hover:shadow-lg transition-all duration-300 hidden md:flex border-border/50"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Bouton scroll droite */}
      {showRightArrow && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background shadow-md hover:shadow-lg transition-all duration-300 hidden md:flex border-border/50"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Zone de défilement */}
      <ScrollArea className="w-full whitespace-nowrap" ref={scrollRef}>
        <div className="flex gap-3 py-3 px-1">
          {popularCategories.map((category) => (
            <Button
              key={category!.id}
              variant="outline"
              onClick={() => navigate(`/category/${category!.slug}`)}
              className="rounded-2xl px-6 py-3 h-auto bg-background/50 hover:bg-primary/10 hover:text-primary hover:border-primary/50 hover:shadow-md transition-all duration-300 border whitespace-nowrap text-sm font-medium"
            >
              {category!.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="md:hidden" />
      </ScrollArea>
    </div>
  );
};
