import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Gift, Zap } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

export const HeroSection = () => {
  // Set countdown to 6 hours from now
  const endTime = new Date(Date.now() + 6 * 60 * 60 * 1000);

  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
      <div className="absolute inset-0 gradient-primary opacity-90" />
      <img 
        src={heroBanner} 
        alt="Promotions exceptionnelles" 
        className="w-full h-32 sm:h-40 md:h-48 lg:h-64 object-cover"
      />
      
      <div className="absolute inset-0 flex flex-col justify-center p-4 sm:p-6 text-white">
        <div className="max-w-xs sm:max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent animate-bounce-subtle" />
            <span className="text-accent font-bold text-xs sm:text-sm uppercase tracking-wider">
              VENTE FLASH
            </span>
          </div>
          
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 leading-tight">
            Jusqu'à <span className="text-accent text-xl sm:text-2xl md:text-3xl lg:text-4xl">85%</span> de réduction
          </h1>
          
          <p className="text-white/90 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-none">
            Des milliers de produits à prix incroyables !
            Livraison rapide en Côte d'Ivoire.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Button variant="accent" size="sm" className="shadow-lg text-sm sm:text-base">
              <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Découvrir les offres
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-sm sm:text-base">
              Voir tout
            </Button>
          </div>
          
          <div className="scale-90 sm:scale-100 origin-left">
            <CountdownTimer 
              endTime={endTime}
              onExpire={() => console.log("Promotion expirée!")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};