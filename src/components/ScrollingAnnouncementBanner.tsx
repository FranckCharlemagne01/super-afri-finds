import { useEffect, useState } from "react";

const announcements = [
  "🎉 Bienvenue sur Djassa - Votre marketplace #1 en Côte d'Ivoire",
  "🔥 Nouveaux produits ajoutés chaque jour",
  "💰 Livraison rapide dans toute la Côte d'Ivoire",
  "✨ Paiement sécurisé avec Orange Money, MTN & Moov Money",
  "🚀 Lancez votre boutique gratuitement – Commission uniquement après vente",
  "📱 Des milliers de produits à découvrir",
  "✔ 80% à 95% de réduction sur les commissions pour les vendeurs"
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
    <div className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 py-3 sm:py-3.5 overflow-hidden shadow-md">
      <div
        className={`text-center text-white font-semibold text-xs sm:text-sm md:text-base px-4 transition-all duration-500 ease-out ${
          isAnimating 
            ? "opacity-0 translate-y-3 scale-95" 
            : "opacity-100 translate-y-0 scale-100"
        }`}
      >
        <span className="inline-block animate-fade-in">
          {announcements[currentIndex]}
        </span>
      </div>
    </div>
  );
};
