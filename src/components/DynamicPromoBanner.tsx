import { ShoppingBag, Sparkles, Gift } from "lucide-react";
import { motion } from "framer-motion";

export const DynamicPromoBanner = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full overflow-hidden rounded-2xl shadow-md"
    >
      <div className="relative min-h-[120px] sm:min-h-[140px] p-4 sm:p-5 md:p-6 gradient-accent">
        {/* Icônes décoratives animées */}
        <motion.div 
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-3 right-3 sm:top-4 sm:right-4"
        >
          <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-primary opacity-15" />
        </motion.div>
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4"
        >
          <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-primary opacity-10" />
        </motion.div>

        <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 relative z-10 text-center">
          {/* Icônes principales */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse" />
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>

          {/* Titre principal */}
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
            🚀 Lancez votre boutique sur Djassa !
          </h3>
          
          {/* Sous-titre */}
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Inscrivez-vous et commencez à vendre immédiatement. Commission uniquement après chaque vente.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
