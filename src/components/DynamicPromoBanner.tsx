import promoBanner from "@/assets/promo-banner-special-offer.jpg";

export const DynamicPromoBanner = () => {
  return (
    <div className="w-full overflow-hidden rounded-lg sm:rounded-xl shadow-lg animate-fade-in">
      <img 
        src={promoBanner} 
        alt="🎉 Offre Spéciale Djassa – 85% de réduction pour les premiers vendeurs ! Créez votre boutique maintenant et profitez de cette offre exclusive !" 
        className="w-full h-auto object-cover"
        loading="lazy"
      />
    </div>
  );
};
