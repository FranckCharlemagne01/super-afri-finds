export const ShopPromoBanner = () => {
  const message = "🚀 Lancez votre boutique sur Djassa – Aucun frais pour commencer, payez uniquement après chaque vente !";
  
  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 py-2.5 sm:py-3 mb-0 rounded-lg shadow-md">
      <div className="relative flex" style={{ 
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility'
      }}>
        <div className="flex animate-[scroll_20s_linear_infinite]" style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}>
          <span className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold sm:font-bold text-white whitespace-nowrap px-4 sm:px-6">
            {message}
          </span>
          <span className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold sm:font-bold text-white whitespace-nowrap px-4 sm:px-6">
            {message}
          </span>
        </div>
        <div className="flex animate-[scroll_20s_linear_infinite]" aria-hidden="true" style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}>
          <span className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold sm:font-bold text-white whitespace-nowrap px-4 sm:px-6">
            {message}
          </span>
          <span className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold sm:font-bold text-white whitespace-nowrap px-4 sm:px-6">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};
