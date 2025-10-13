import { Sparkles } from "lucide-react";
import marketplaceShowcase from "@/assets/marketplace-showcase.jpg";

export const FeaturedProductsGrid = () => {
  return (
    <section className="mb-8 sm:mb-12 animate-fade-in">
      <div className="bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-pink-50/20 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-pink-950/10 p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg border border-amber-200/30 dark:border-amber-800/30">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-xl animate-pulse">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
              ✨ PRODUITS VEDETTES
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1">
              Découvrez nos boutiques partenaires • Marketplace dynamique
            </p>
          </div>
        </div>
        
        <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl">
          <img 
            src={marketplaceShowcase} 
            alt="Marketplace Djassa - Vitrine de produits variés avec offres spéciales"
            className="w-full h-auto object-cover transition-transform duration-700 hover:scale-[1.02] cursor-pointer"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};
