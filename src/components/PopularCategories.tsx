import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Smartphone, Shirt, Watch, Sparkles, Home, Baby, Car, Dumbbell, Headphones, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const quickCategories = [
  { name: "Téléphones", slug: "telephones-portables-accessoires", icon: Smartphone, color: "from-blue-500 to-blue-600" },
  { name: "Mode Homme", slug: "mode-homme", icon: Shirt, color: "from-primary to-[hsl(16,100%,50%)]" },
  { name: "Mode Femme", slug: "mode-femme", icon: ShoppingBag, color: "from-pink-500 to-rose-500" },
  { name: "Beauté", slug: "beaute-cosmetique", icon: Sparkles, color: "from-purple-500 to-violet-500" },
  { name: "Maison", slug: "maison-vie-quotidienne", icon: Home, color: "from-[hsl(var(--success))] to-emerald-600" },
  { name: "Montres", slug: "montres-homme", icon: Watch, color: "from-amber-500 to-orange-500" },
  { name: "Enfants", slug: "enfants-bebes", icon: Baby, color: "from-cyan-500 to-teal-500" },
  { name: "Chaussures", slug: "chaussures-homme", icon: Dumbbell, color: "from-slate-600 to-slate-700" },
  { name: "Accessoires", slug: "accessoires-telephones", icon: Headphones, color: "from-indigo-500 to-blue-600" },
  { name: "Auto", slug: "auto-moto", icon: Car, color: "from-red-500 to-rose-600" },
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
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-1 sm:px-2 touch-pan-x pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {quickCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.slug}
                onClick={() => navigate(`/category/${cat.slug}`)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[60px] sm:w-[72px] group/cat"
              >
                <div className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-sm transition-transform duration-200 group-active/cat:scale-95",
                  cat.color
                )}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-foreground text-center leading-tight line-clamp-1">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
