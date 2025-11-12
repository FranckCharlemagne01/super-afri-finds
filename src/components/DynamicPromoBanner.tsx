import { ShoppingBag, Sparkles, Gift } from "lucide-react";

export const DynamicPromoBanner = () => {
  return (
    <div className="w-full overflow-hidden rounded-lg sm:rounded-xl shadow-lg">
      <div className="relative min-h-[140px] sm:min-h-[160px] p-4 sm:p-6 md:p-8 gradient-accent animate-gradient">
        {/* Icônes décoratives animées */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 animate-bounce-subtle">
          <ShoppingBag className="w-8 h-8 sm:w-12 sm:h-12 text-primary opacity-20" />
        </div>
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 animate-pulse">
          <Gift className="w-6 h-6 sm:w-10 sm:h-10 text-primary opacity-15" />
        </div>

        <div className="flex flex-col items-center justify-center gap-3 relative z-10 text-center">
          {/* Icônes principales */}
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>

          {/* Titre principal */}
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground animate-fade-in">
            🛍️ Bienvenue sur Djassa !
          </h3>
          
          {/* Sous-titre */}
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl">
            Profitez des bonus, réductions limitées et avantages exclusifs pour nos vendeurs et acheteurs.
          </p>
        </div>
      </div>
    </div>
  );
};
