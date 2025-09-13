import { useTrialStatus } from "@/hooks/useTrialStatus";
import { Button } from "@/components/ui/button";
import { Gift, Zap } from "lucide-react";

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

  return (
    <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-6 px-4 mb-6 rounded-lg shadow-vibrant">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Main Title */}
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent animate-bounce-subtle" />
            <h2 className="text-xl md:text-2xl font-bold">
              ✨ Djassa – Achetez et revendez en toute simplicité ! 🚀
            </h2>
          </div>
          
          {/* Subtitle */}
          <p className="text-white/90 text-sm md:text-base max-w-2xl">
            Des milliers de produits à prix incroyables ! Livraison rapide en Côte d'Ivoire.
          </p>
          
          {/* Trial Offer */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <Gift className="w-4 h-4" />
              <span className="text-sm md:text-base font-medium">
                🎁 28 jours d'essai gratuit pour publier vos produits
              </span>
            </div>
            <div className="animate-flash-gold-black font-bold text-lg bg-black/20 px-3 py-1 rounded">
              ⏳ {daysRemaining} jours restants
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button 
              variant="default" 
              size="sm" 
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-lg"
            >
              <Gift className="w-4 h-4 mr-2" />
              Découvrir les offres
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              Voir tout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;