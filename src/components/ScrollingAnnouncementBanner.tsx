import { useEffect, useState } from "react";

const announcements = [
  "🎉 Bienvenue sur Djassa - Votre marketplace #1 en Côte d'Ivoire",
  "🔥 Nouveaux produits ajoutés chaque jour",
  "💰 Livraison rapide dans toute la Côte d'Ivoire",
  "✨ Paiement sécurisé avec Orange Money, MTN & Moov Money",
  "🎁 28 jours d'essai gratuit pour les nouveaux vendeurs",
  "📱 Des milliers de produits à découvrir",
  "🚀 Vendez vos produits en quelques clics"
];

export const ScrollingAnnouncementBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
        setIsAnimating(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 py-2 sm:py-3 overflow-hidden">
      <div
        className={`text-center text-white font-medium text-xs sm:text-sm md:text-base px-4 transition-all duration-500 ${
          isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        {announcements[currentIndex]}
      </div>
    </div>
  );
};
