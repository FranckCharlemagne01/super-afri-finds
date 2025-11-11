import { Sparkles, Star, Zap } from "lucide-react";

export const OffersPromoBanner = () => {
  return (
    <div className="w-full overflow-hidden rounded-lg sm:rounded-xl shadow-lg mb-6 sm:mb-8">
      <div className="relative min-h-[160px] sm:min-h-[200px] p-6 sm:p-8 md:p-10 gradient-accent animate-gradient">
        {/* Icônes décoratives animées */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 animate-pulse">
          <Star className="w-10 h-10 sm:w-14 sm:h-14 text-white/20" />
        </div>
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 animate-bounce-subtle">
          <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-white/20" />
        </div>

        <div className="relative z-10 text-center">
          {/* Icône principale */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" />
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white" />
          </div>

          {/* Titre principal */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 animate-fade-in drop-shadow-lg">
            Profitez des Offres Spéciales avec Djassa !
          </h2>

          {/* Sous-titre */}
          <p className="text-base sm:text-lg md:text-xl text-white/95 mb-2 font-medium">
            Boostez vos ventes facilement et augmentez votre visibilité
          </p>

          {/* Badge animé */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full animate-pulse-slow">
            <Zap className="w-4 h-4 text-white" />
            <span className="text-sm sm:text-base font-semibold text-white">
              Produits mis en avant par nos vendeurs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
