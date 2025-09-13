import { useTrialStatus } from "@/hooks/useTrialStatus";

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
    <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-4 mb-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-center">
          <div className="flex items-center gap-2 text-sm md:text-base font-medium">
            <span>✨ Djassa – Achetez et revendez en toute simplicité et sécurité, sans bouger de chez vous ! 🚀</span>
          </div>
          <div className="flex items-center gap-2 text-sm md:text-base">
            <span>🎁 Profitez de 28 jours d'essai gratuit pour publier vos produits ⏳</span>
            <span className="animate-flash-gold-black font-bold text-lg">
              {daysRemaining} jours restants
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;