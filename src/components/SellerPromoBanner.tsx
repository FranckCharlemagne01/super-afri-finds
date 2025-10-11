import { useNavigate } from "react-router-dom";
import { useStableAuth } from "@/hooks/useStableAuth";
import { useStableRole } from "@/hooks/useStableRole";

export const SellerPromoBanner = () => {
  const navigate = useNavigate();
  const { user } = useStableAuth();
  const { isSeller } = useStableRole();
  
  const message = "💼 Devenez vendeur sur Djassa - 28 jours d'essai gratuit pour créer votre boutique !";
  
  const handleClick = () => {
    if (user) {
      if (isSeller) {
        navigate('/seller-dashboard');
      } else {
        navigate('/');
        setTimeout(() => {
          const sellerSection = document.querySelector('[data-seller-upgrade]');
          if (sellerSection) {
            sellerSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      navigate('/auth?mode=signup&role=seller');
    }
  };
  
  return (
    <div 
      className="w-full overflow-hidden bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 py-2.5 sm:py-3 rounded-lg shadow-md cursor-pointer hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 transition-all duration-300 active:scale-[0.99]"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="relative flex" style={{ 
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility'
      }}>
        <div className="flex animate-[scroll_25s_linear_infinite]" style={{
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
        <div className="flex animate-[scroll_25s_linear_infinite]" aria-hidden="true" style={{
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
