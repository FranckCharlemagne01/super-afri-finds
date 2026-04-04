import { useStableAuth } from "@/hooks/useStableAuth";
import { useStableRole } from "@/hooks/useStableRole";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { TrendingUp, Zap, CheckCircle } from "lucide-react";

interface SellerCTABannerProps {
  onShowSellerUpgrade?: () => void;
  variant?: "top" | "bottom";
}

export const SellerCTABanner = ({ onShowSellerUpgrade, variant = "top" }: SellerCTABannerProps) => {
  const { user } = useStableAuth();
  const { isSeller } = useStableRole();
  const navigate = useNavigate();

  const handleClick = () => {
    if (user) {
      if (isSeller) {
        navigate('/seller-dashboard');
      } else {
        onShowSellerUpgrade?.();
      }
    } else {
      navigate('/auth?mode=signup&role=seller');
    }
  };

  if (variant === "top") {
    return (
      <div className="w-full bg-gradient-to-r from-primary via-[hsl(16,100%,55%)] to-primary overflow-hidden">
        <div className="container mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-2.5 sm:py-3 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="w-4 h-4 text-white flex-shrink-0" />
              <p className="text-white text-xs sm:text-sm font-medium truncate">
                🚀 Lancez votre boutique sur Djassa – Commission uniquement après chaque vente !
              </p>
            </div>
            <Button
              onClick={handleClick}
              size="sm"
              className="bg-white text-primary hover:bg-white/90 font-bold text-xs px-4 py-1.5 rounded-full shadow-md flex-shrink-0 h-8"
            >
              Commencer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="my-8 sm:my-12 lg:my-16">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-[hsl(16,100%,55%)] to-[hsl(134,61%,41%)] p-6 sm:p-8 lg:p-12">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3">
              🚀 Lancez votre boutique sur Djassa !
            </h3>
            <p className="text-white/90 text-sm sm:text-base mb-4 max-w-xl">
              Inscrivez-vous et votre boutique en ligne est créée automatiquement. 
              Commission uniquement après chaque vente.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 text-white/95 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-white" />
                Aucun frais pour commencer
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-white" />
                80% à 95% de réduction
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-white" />
                Boutique automatique
              </span>
            </div>
          </div>
          <Button
            onClick={handleClick}
            className="bg-white text-primary hover:bg-white/90 font-bold text-sm sm:text-base px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-all duration-300 h-auto"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Créer ma boutique gratuitement
          </Button>
        </div>
      </div>
    </section>
  );
};
