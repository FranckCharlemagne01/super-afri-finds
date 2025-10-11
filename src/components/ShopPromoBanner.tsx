export const ShopPromoBanner = () => {
  const message = "🎁 Créez une boutique dès aujourd'hui sur Djassa et profitez de l'offre gratuite pendant 28 jours !";
  
  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 py-3 mb-3 rounded-lg shadow-md">
      <div className="relative flex">
        <div className="flex animate-[scroll_20s_linear_infinite]">
          <span className="text-lg sm:text-xl font-bold text-white whitespace-nowrap px-6">
            {message}
          </span>
          <span className="text-lg sm:text-xl font-bold text-white whitespace-nowrap px-6">
            {message}
          </span>
        </div>
        <div className="flex animate-[scroll_20s_linear_infinite]" aria-hidden="true">
          <span className="text-lg sm:text-xl font-bold text-white whitespace-nowrap px-6">
            {message}
          </span>
          <span className="text-lg sm:text-xl font-bold text-white whitespace-nowrap px-6">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};
