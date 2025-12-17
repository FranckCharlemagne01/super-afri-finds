import React, { memo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Package, Camera, Check } from 'lucide-react';
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
      <Label className="text-base font-semibold text-foreground">
        Pourquoi rejoins-tu Djassa ?
      </Label>
      
      <div className="flex flex-col gap-3">
        {/* Buyer Option */}
        <motion.button
          type="button"
          onClick={handleBuyerClick}
          whileTap={{ scale: 0.98 }}
          className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
            value === 'buyer'
              ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
              : 'border-input bg-background hover:border-primary/30 hover:bg-muted/30'
          }`}
        >
          <div className={`flex-shrink-0 p-3 rounded-xl ${
            value === 'buyer' ? 'bg-primary/10' : 'bg-muted'
          }`}>
            <Package className={`w-6 h-6 ${
              value === 'buyer' ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-base ${
              value === 'buyer' ? 'text-primary' : 'text-foreground'
            }`}>
              📦 Découvrir des produits près de moi
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Explorer les produits et contacter des vendeurs.
            </div>
          </div>
          
          {value === 'buyer' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-primary-foreground" />
            </motion.div>
          )}
        </motion.button>

        {/* Seller Option */}
        <motion.button
          type="button"
          onClick={handleSellerClick}
          whileTap={{ scale: 0.98 }}
          className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
            value === 'seller'
              ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
              : 'border-input bg-background hover:border-primary/30 hover:bg-muted/30'
          }`}
        >
          <div className={`flex-shrink-0 p-3 rounded-xl ${
            value === 'seller' ? 'bg-primary/10' : 'bg-muted'
          }`}>
            <Camera className={`w-6 h-6 ${
              value === 'seller' ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-base ${
              value === 'seller' ? 'text-primary' : 'text-foreground'
            }`}>
              📸 Publier et vendre mes produits
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Mettre mes produits en ligne et gérer ma boutique.
            </div>
          </div>
          
          {value === 'seller' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-primary-foreground" />
            </motion.div>
          )}
        </motion.button>
      </div>
    </div>
  );
});

export default AccountTypeSelector;
