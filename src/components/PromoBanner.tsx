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
    <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 px-4 mb-6 animate-fade-in hover:from-orange-700 hover:to-orange-800 transition-all duration-300">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center lg:text-left">
            <div className="flex items-center gap-2 text-sm md:text-base font-medium animate-slide-in-right">
              <span>✨ Djassa – Achetez et revendez en toute simplicité et sécurité, sans bouger de chez vous ! 🚀</span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <span className="animate-slide-in-right animation-delay-200">🎁 Profitez de 28 jours d'essai gratuit pour publier vos produits ⏳</span>
              <span className="animate-flash-gold-black font-bold text-lg hover:scale-110 transition-transform duration-200 cursor-default">
                {daysRemaining} jours restants
              </span>
            </div>
          </div>
          <Button 
            onClick={handleSellerSignup}
            className="bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg animate-scale-in"
          >
            Commencez à vendre maintenant
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;