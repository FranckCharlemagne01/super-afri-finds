export const ShopPromoBanner = () => {
  const message = "Créez une boutique dès aujourd'hui sur Djassa et profitez de l'offre gratuite pendant 28 jours !";
  
  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-3 mb-3 px-1 rounded-lg">
      <div className="relative flex">
        <div className="flex animate-[scroll_20s_linear_infinite]">
          <span className="text-lg sm:text-xl font-bold text-foreground whitespace-nowrap px-4">
            ✨ {message}
          </span>
          <span className="text-lg sm:text-xl font-bold text-foreground whitespace-nowrap px-4">
            ✨ {message}
          </span>
        </div>
        <div className="flex animate-[scroll_20s_linear_infinite]" aria-hidden="true">
          <span className="text-lg sm:text-xl font-bold text-foreground whitespace-nowrap px-4">
            ✨ {message}
          </span>
          <span className="text-lg sm:text-xl font-bold text-foreground whitespace-nowrap px-4">
            ✨ {message}
          </span>
        </div>
      </div>
    </div>
  );
};
