import { Sparkles } from "lucide-react";
import marketplaceShowcase from "@/assets/marketplace-showcase.jpg";

export const FeaturedProductsGrid = () => {
  return (
    <section className="mb-12 animate-fade-in">
      <div className="bg-gradient-to-br from-muted/30 via-muted/10 to-transparent p-6 sm:p-8 rounded-2xl shadow-sm border border-border/30">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-xl animate-float">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
              ✨ PRODUITS VEDETTES
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Découvrez nos boutiques partenaires • Marketplace dynamique
            </p>
          </div>
        </div>
        
        <div className="relative w-full overflow-hidden rounded-2xl shadow-lg">
          <img 
            src={marketplaceShowcase} 
            alt="Marketplace Djassa - Vitrine de produits"
            className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};
