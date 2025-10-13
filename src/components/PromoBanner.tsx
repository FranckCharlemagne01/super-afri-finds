import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useStableAuth } from "@/hooks/useStableAuth";
import { useStableRole } from "@/hooks/useStableRole";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

interface PromobannerProps {
  onShowSellerUpgrade?: () => void;
}

const PromoBanner = ({ onShowSellerUpgrade }: PromobannerProps) => {
  const { isInTrial, trialEndDate } = useTrialStatus();
  const { user } = useStableAuth();
  const { isSeller } = useStableRole();
  const navigate = useNavigate();

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
    // Si l'utilisateur est connecté
    if (user) {
      // Si c'est déjà un vendeur, aller à l'espace vendeur
      if (isSeller) {
        navigate('/seller-dashboard');
      } else {
        // Sinon, c'est un client qui veut devenir vendeur - afficher le formulaire directement
        onShowSellerUpgrade?.();
      }
    } else {
      // Utilisateur non connecté - rediriger vers inscription
      navigate('/auth?mode=signup&role=seller');
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 sm:py-5 md:py-6 px-4 sm:px-5 md:px-6 mb-4 sm:mb-6 animate-fade-in hover:from-orange-700 hover:to-orange-800 transition-all duration-300 rounded-xl sm:rounded-2xl shadow-md">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4 lg:gap-6">
          <div className="flex flex-col gap-2 sm:gap-2.5 text-center lg:text-left w-full lg:w-auto">
            <div className="text-sm sm:text-base md:text-lg font-semibold animate-slide-in-right leading-relaxed">
              <span className="block sm:inline">✨ Djassa – Achetez et revendez en toute simplicité</span>
              <span className="block sm:inline sm:ml-1">et sécurité, sans bouger de chez vous ! 🚀</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center lg:justify-start gap-2 sm:gap-3 text-sm sm:text-base md:text-lg">
              <span className="animate-slide-in-right animation-delay-200 font-medium">🎁 28 jours d'essai gratuit ⏳</span>
              <span className="animate-flash-gold-black font-bold text-base sm:text-lg md:text-xl hover:scale-110 transition-transform duration-200 cursor-default">
                {daysRemaining} jours restants
              </span>
            </div>
          </div>
          <Button 
            onClick={handleSellerSignup}
            className="bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg animate-scale-in text-sm sm:text-base md:text-lg w-full sm:w-auto lg:w-auto mt-2 lg:mt-0 min-h-[48px] sm:min-h-[52px] whitespace-nowrap"
          >
            <span className="hidden md:inline">Commencez à vendre maintenant</span>
            <span className="md:hidden">Commencer à vendre</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;