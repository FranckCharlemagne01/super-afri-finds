import { useState, useEffect } from "react";
import { Clock, ShoppingCart, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const PromoBanner = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 28,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Simuler un compte à rebours (en production, cela devrait être basé sur une vraie date)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-primary text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full animate-bounce-subtle transform -translate-x-10 -translate-y-10"></div>
        <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full animate-pulse-promo transform translate-x-8 -translate-y-8"></div>
        <div className="absolute bottom-0 left-1/4 w-12 h-12 bg-white rounded-full animate-bounce-subtle animation-delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-6 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Left side - Main message */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <ShoppingCart className="w-6 h-6 animate-bounce-subtle" />
              <span className="text-xl font-bold">Le Djassa</span>
            </div>
            <p className="text-lg lg:text-xl font-semibold mb-2">
              Achetez et revendez en toute simplicité, sécurité et sans bouger de chez vous !
            </p>
          </div>

          {/* Center - Trial message for sellers */}
          <div className="flex items-center gap-3 bg-white/10 rounded-xl px-6 py-4 backdrop-blur-sm border border-white/20">
            <Gift className="w-8 h-8 text-amber-300 animate-pulse-promo" />
            <div className="text-center">
              <p className="font-bold text-lg">
                🎁 Vendeurs : Essai gratuit de 28 jours
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Il vous reste</span>
                <Badge variant="secondary" className="bg-amber-500 text-black font-bold px-2 py-1 animate-pulse-promo">
                  {timeLeft.days} jours
                </Badge>
                <span className="text-xs opacity-80">
                  {String(timeLeft.hours).padStart(2, "0")}:
                  {String(timeLeft.minutes).padStart(2, "0")}:
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Call to action */}
          <div className="text-center lg:text-right">
            <div className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-full font-bold hover-lift transition-all duration-300 cursor-pointer">
              <span>Commencer maintenant</span>
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    </div>
  );
};