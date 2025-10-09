import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { categories } from "@/data/categories";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

export const PopularCategories = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group">
      {/* Bouton scroll gauche */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/95 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Bouton scroll droite */}
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/95 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
        onClick={() => scroll("right")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Zone de défilement */}
      <ScrollArea className="w-full whitespace-nowrap" ref={scrollRef}>
        <div className="flex gap-2 py-2">
          {popularCategories.map((category) => {
            const Icon = category!.icon;
            return (
              <Button
                key={category!.id}
                variant="outline"
                onClick={() => navigate(`/category/${category!.slug}`)}
                className="rounded-full px-4 py-2 h-auto bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-2 hover:scale-105 whitespace-nowrap"
              >
                <Icon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{category!.name}</span>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="md:hidden" />
      </ScrollArea>
    </div>
  );
};
