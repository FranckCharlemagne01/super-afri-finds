import { useTrialStatus } from "@/hooks/useTrialStatus";
import { Button } from "./ui/button";

const PromoBanner = () => {
  const { isInTrial, trialEndDate } = useTrialStatus();

  const calculateDaysRemaining = () => {
    if (!trialEndDate) return 28;
    const today = new Date();
    const endDate = new Date(trialEndDate);
    const timeDiff = endDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, daysRemaining);
  };

  const daysRemaining = calculateDaysRemaining();

  const handleSellerSignup = () => {
    window.location.href = '/auth?mode=signup&role=seller';
  };

  return (
    <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 sm:py-4 px-3 sm:px-4 mb-4 sm:mb-6 animate-fade-in hover:from-orange-700 hover:to-orange-800 transition-all duration-300">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2 sm:gap-3 lg:gap-4">
          <div className="flex flex-col gap-1 sm:gap-2 text-center lg:text-left w-full lg:w-auto">
            <div className="text-xs sm:text-sm md:text-base font-medium animate-slide-in-right">
              <span className="block sm:inline">✨ Djassa – Achetez et revendez en toute simplicité</span>
              <span className="block sm:inline sm:ml-1">et sécurité, sans bouger de chez vous ! 🚀</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center lg:justify-start gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
              <span className="animate-slide-in-right animation-delay-200">🎁 28 jours d'essai gratuit ⏳</span>
              <span className="animate-flash-gold-black font-bold text-sm sm:text-base md:text-lg hover:scale-110 transition-transform duration-200 cursor-default">
                {daysRemaining} jours restants
              </span>
            </div>
          </div>
          <Button 
            onClick={handleSellerSignup}
            className="bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg animate-scale-in text-sm sm:text-base w-full sm:w-auto mt-2 lg:mt-0 min-h-[44px]"
          >
            <span className="hidden sm:inline">Commencez à vendre maintenant</span>
            <span className="sm:hidden">Commencer à vendre</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;