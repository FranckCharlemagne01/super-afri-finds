import { useStableAuth } from "@/hooks/useStableAuth";
import { useStableRole } from "@/hooks/useStableRole";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

interface PromobannerProps {
  onShowSellerUpgrade?: () => void;
}

const PromoBanner = ({ onShowSellerUpgrade }: PromobannerProps) => {
  const { user } = useStableAuth();
  const { isSeller } = useStableRole();
  const navigate = useNavigate();

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
              <span className="block sm:inline">🚀 Lancez votre boutique sur Djassa</span>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-white/90 animate-slide-in-right animation-delay-200">
              Inscrivez-vous et votre boutique en ligne est créée automatiquement pour commencer à vendre immédiatement.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center lg:justify-start gap-1.5 sm:gap-3 text-xs sm:text-sm md:text-base font-medium">
              <span>✔ Aucun frais pour commencer</span>
              <span>✔ Commission uniquement après chaque vente</span>
              <span>✔ 80% à 95% de réduction sur les commissions</span>
            </div>
          </div>
          <Button 
            onClick={handleSellerSignup}
            className="bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg animate-scale-in text-sm sm:text-base md:text-lg w-full sm:w-auto lg:w-auto mt-2 lg:mt-0 min-h-[48px] sm:min-h-[52px] whitespace-nowrap"
          >
            Créer ma boutique gratuitement
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;