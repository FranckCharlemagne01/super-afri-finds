import React, { memo, useCallback } from 'react';
import { ShoppingBag, Store, Check, Star, Zap, Shield, TrendingUp, Gift, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface AccountTypeSelectorProps {
  value: 'buyer' | 'seller';
  onChange: (value: 'buyer' | 'seller') => void;
}

const AccountTypeSelector = memo(function AccountTypeSelector({ 
  value, 
  onChange 
}: AccountTypeSelectorProps) {
  const handleBuyerClick = useCallback(() => {
    onChange('buyer');
  }, [onChange]);

  const handleSellerClick = useCallback(() => {
    onChange('seller');
  }, [onChange]);

  return (
    <div className="space-y-4">
      {/* Buyer Option */}
      <motion.button
        type="button"
        onClick={handleBuyerClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`relative w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 group ${
          value === 'buyer'
            ? 'border-primary bg-gradient-to-br from-primary/8 via-primary/5 to-transparent shadow-xl shadow-primary/10 ring-1 ring-primary/20'
            : 'border-border/60 bg-card hover:border-primary/40 hover:bg-muted/30 hover:shadow-md'
        }`}
      >
        {/* Icon container */}
        <div className={`relative flex-shrink-0 p-3.5 rounded-xl transition-all duration-300 ${
          value === 'buyer' 
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
            : 'bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
        }`}>
          <ShoppingBag className="w-6 h-6" />
          {value === 'buyer' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md"
            >
              <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
            </motion.div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-base transition-colors ${
              value === 'buyer' ? 'text-primary' : 'text-foreground group-hover:text-primary'
            }`}>
              Je veux acheter
            </h3>
            {value === 'buyer' && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full"
              >
                Sélectionné
              </motion.span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            Découvrez des produits uniques près de chez vous et achetez en toute confiance.
          </p>
          
          {/* Features */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <Shield className="w-3 h-3" /> Paiement sécurisé
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <Users className="w-3 h-3" /> Vendeurs vérifiés
            </span>
          </div>
        </div>
      </motion.button>

      {/* Seller Option */}
      <motion.button
        type="button"
        onClick={handleSellerClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`relative w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 group ${
          value === 'seller'
            ? 'border-primary bg-gradient-to-br from-primary/8 via-primary/5 to-transparent shadow-xl shadow-primary/10 ring-1 ring-primary/20'
            : 'border-border/60 bg-card hover:border-primary/40 hover:bg-muted/30 hover:shadow-md'
        }`}
      >
        {/* Popular badge */}
        <div className="absolute -top-2.5 left-4 flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
          <Star className="w-3 h-3 fill-current" /> Populaire
        </div>

        {/* Icon container */}
        <div className={`relative flex-shrink-0 p-3.5 rounded-xl transition-all duration-300 mt-2 ${
          value === 'seller' 
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
            : 'bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
        }`}>
          <Store className="w-6 h-6" />
          {value === 'seller' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md"
            >
              <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
            </motion.div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2 mt-2">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-base transition-colors ${
              value === 'seller' ? 'text-primary' : 'text-foreground group-hover:text-primary'
            }`}>
              Je veux vendre
            </h3>
            {value === 'seller' && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full"
              >
                Sélectionné
              </motion.span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            Créez votre boutique en ligne et vendez vos produits à des milliers d'acheteurs.
          </p>
          
          {/* Features */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <Gift className="w-3 h-3" /> 50 jetons offerts
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <Zap className="w-3 h-3" /> 28 jours gratuits
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <TrendingUp className="w-3 h-3" /> Statistiques
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
});

export default AccountTypeSelector;
