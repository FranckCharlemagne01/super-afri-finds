import { Clock, ShoppingCart, Gift, Zap } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";

export const PromoBanner = () => {
  // Set countdown to 28 days from now for trial period
  const endTime = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);

  return (
    <div className="bg-orange-dark text-white relative overflow-hidden">
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-dark via-orange-dark/95 to-orange-dark opacity-95" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full animate-bounce-subtle transform -translate-x-10 -translate-y-10"></div>
        <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full animate-pulse-promo transform translate-x-8 -translate-y-8"></div>
        <div className="absolute bottom-0 left-1/4 w-12 h-12 bg-white rounded-full animate-bounce-subtle animation-delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-6 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Left side - Main message */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
              <ShoppingCart className="w-6 h-6 text-accent animate-bounce-subtle" />
              <span className="text-xl font-bold text-white">Le Djassa</span>
            </div>
            <h1 className="text-lg lg:text-xl font-bold mb-4 text-white leading-tight">
              🛒 Achetez et revendez en toute simplicité, sécurité et sans bouger de chez vous !
            </h1>
          </div>

          {/* Center - Professional trial message */}
          <div className="bg-white/15 rounded-xl px-6 py-4 backdrop-blur-sm border border-white/30 shadow-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-accent animate-bounce-subtle" />
                <span className="text-accent font-bold text-sm uppercase tracking-wider">
                  OFFRE EXCLUSIVE
                </span>
              </div>
              
              <p className="font-bold text-lg text-white mb-3">
                🎁 Vendeurs : <span className="text-accent">28 jours d'essai gratuit</span>
              </p>
              
              <div className="scale-90 origin-center">
                <CountdownTimer 
                  endTime={endTime}
                  onExpire={() => console.log("Période d'essai expirée!")}
                />
              </div>
            </div>
          </div>

          {/* Right side - Call to action */}
          <div className="text-center lg:text-right">
            <Button 
              variant="accent" 
              size="lg" 
              className="shadow-lg hover-lift transition-all duration-300"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Commencer maintenant
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-accent/60 to-transparent"></div>
    </div>
  );
};