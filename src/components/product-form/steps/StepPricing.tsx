import { motion } from 'framer-motion';
import { DollarSign, Tag, Package, Minus, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { NumericInput } from '@/components/ui/validated-input';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface StepPricingProps {
  formData: {
    price: number;
    original_price: number;
    stock_quantity: number;
    badge: string;
  };
  onInputChange: (field: string, value: any) => void;
}

export const StepPricing = ({ formData, onInputChange }: StepPricingProps) => {
  const discountPercentage = formData.original_price > 0 && formData.original_price > formData.price
    ? Math.round(((formData.original_price - formData.price) / formData.original_price) * 100)
    : 0;

  const handleStockChange = (delta: number) => {
    const newValue = Math.max(1, (formData.stock_quantity || 1) + delta);
    onInputChange('stock_quantity', newValue);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 }
    })
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pb-2"
      >
        <h2 className="text-xl font-bold text-foreground">Prix et stock</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Définissez le prix de vente de votre produit
        </p>
      </motion.div>

      {/* Price */}
      <motion.div 
        custom={0}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <Label htmlFor="price" className="flex items-center gap-2 text-sm font-medium">
          <DollarSign className="w-4 h-4 text-primary" />
          Prix de vente *
        </Label>
        <div className="relative">
          <NumericInput
            id="price"
            value={formData.price?.toString() || ''}
            onChange={(value) => onInputChange('price', Number(value) || 0)}
            placeholder="0"
            required
            className="h-16 rounded-2xl text-2xl font-bold px-4 pr-20 bg-muted/30 border-0 focus:ring-2 focus:ring-primary/20"
            inputMode="numeric"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
            FCFA
          </span>
        </div>
        {formData.price <= 0 && (
          <p className="text-xs text-destructive">Le prix doit être supérieur à 0</p>
        )}
      </motion.div>

      {/* Original price */}
      <motion.div 
        custom={1}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <Label htmlFor="original_price" className="flex items-center gap-2 text-sm font-medium">
          <Tag className="w-4 h-4 text-muted-foreground" />
          Prix original (optionnel)
        </Label>
        <div className="relative">
          <NumericInput
            id="original_price"
            value={formData.original_price?.toString() || ''}
            onChange={(value) => onInputChange('original_price', Number(value) || 0)}
            placeholder="0"
            className="h-14 rounded-2xl text-base px-4 pr-20 bg-muted/30 border-0"
            inputMode="numeric"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            FCFA
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Affiche une réduction si supérieur au prix de vente
        </p>
        
        {/* Discount preview */}
        {discountPercentage > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 py-2 px-3 bg-green-50 dark:bg-green-950/30 rounded-xl"
          >
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              🏷️ Réduction de {discountPercentage}% affichée
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Stock quantity */}
      <motion.div 
        custom={2}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Package className="w-4 h-4 text-muted-foreground" />
          Quantité en stock
        </Label>
        
        <div className="flex items-center justify-center gap-4 py-4 bg-muted/30 rounded-2xl">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleStockChange(-1)}
            disabled={formData.stock_quantity <= 1}
            className="w-14 h-14 rounded-2xl"
          >
            <Minus className="w-6 h-6" />
          </Button>
          
          <div className="w-24 text-center">
            <span className="text-4xl font-bold">{formData.stock_quantity || 1}</span>
            <p className="text-xs text-muted-foreground mt-1">unité{(formData.stock_quantity || 1) > 1 ? 's' : ''}</p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleStockChange(1)}
            className="w-14 h-14 rounded-2xl"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Le stock sera automatiquement mis à jour après chaque vente
        </p>
      </motion.div>

      {/* Badge */}
      <motion.div 
        custom={3}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <Label htmlFor="badge" className="flex items-center gap-2 text-sm font-medium">
          Badge (optionnel)
        </Label>
        <Input
          id="badge"
          value={formData.badge}
          onChange={(e) => onInputChange('badge', e.target.value)}
          placeholder="Ex: Nouveau, Populaire, Promo..."
          className="h-14 rounded-2xl text-base px-4 bg-muted/30 border-0"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Un badge attire l'attention des acheteurs
        </p>
      </motion.div>
    </div>
  );
};
