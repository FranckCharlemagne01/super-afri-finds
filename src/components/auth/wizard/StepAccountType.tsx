import { memo } from 'react';
import { motion } from 'framer-motion';
import { Building2, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OptimizedInput from '@/components/auth/OptimizedInput';
import AccountTypeSelector from '@/components/auth/AccountTypeSelector';

interface StepAccountTypeProps {
  userRole: 'buyer' | 'seller';
  shopName: string;
  onUserRoleChange: (value: 'buyer' | 'seller') => void;
  onShopNameChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const StepAccountType = memo(({
  userRole,
  shopName,
  onUserRoleChange,
  onShopNameChange,
  onNext,
  onBack
}: StepAccountTypeProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const isValid = userRole === 'buyer' || (userRole === 'seller' && shopName.trim().length > 0);

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Section header */}
      <div className="text-center space-y-2 pb-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-2"
        >
          <Sparkles className="w-7 h-7 text-primary" />
        </motion.div>
        <h2 className="text-xl font-bold text-foreground">
          Comment souhaitez-vous utiliser Djassa ?
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Choisissez votre profil pour une expérience sur mesure. Vous pourrez toujours changer plus tard.
        </p>
      </div>

      {/* Account type selector */}
      <AccountTypeSelector value={userRole} onChange={onUserRoleChange} />

      {/* Shop name for sellers */}
      {userRole === 'seller' && (
        <motion.div 
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-2xl p-4 border border-primary/10">
            <OptimizedInput
              id="shopName"
              label="Nom de votre boutique"
              icon={Building2}
              placeholder="Ex : Mode Élégante, Tech Store..."
              value={shopName}
              onChange={onShopNameChange}
              required
              maxLength={100}
              hint="Ce nom sera visible par vos futurs clients"
              autoComplete="organization"
            />
          </div>
        </motion.div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 rounded-xl font-medium border-border/60 hover:bg-muted/50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>
        <Button
          type="submit"
          className="flex-[2] h-12 rounded-xl font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
          disabled={!isValid}
        >
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Trust badge */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs text-muted-foreground pt-2"
      >
        🔒 Vos informations sont protégées et confidentielles
      </motion.p>
    </motion.form>
  );
});

StepAccountType.displayName = 'StepAccountType';

export default StepAccountType;
