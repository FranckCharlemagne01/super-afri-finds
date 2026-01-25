import { memo } from 'react';
import { motion } from 'framer-motion';
import { Building2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
      className="space-y-5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Section header */}
      <div className="text-center pb-1">
        <h2 className="text-lg font-bold text-foreground">
          Pourquoi rejoignez-vous Djassa ?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choisissez votre profil pour une expérience personnalisée
        </p>
      </div>

      {/* Account type selector with enhanced styling */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 rounded-2xl p-5 border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            Votre objectif
          </h3>
        </div>
        
        <AccountTypeSelector value={userRole} onChange={onUserRoleChange} />
      </div>

      {/* Shop name for sellers */}
      {userRole === 'seller' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <OptimizedInput
            id="shopName"
            label="Nom de votre boutique"
            icon={Building2}
            placeholder="Ex : Boutique Mode, Tech Shop..."
            value={shopName}
            onChange={onShopNameChange}
            required
            maxLength={100}
            hint="Ce nom sera visible par vos clients"
            autoComplete="organization"
          />
        </motion.div>
      )}

      {/* Benefits preview */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {userRole === 'buyer' ? 'Avantages acheteur' : 'Avantages vendeur'}
        </p>
        <ul className="text-sm text-foreground space-y-1.5">
          {userRole === 'buyer' ? (
            <>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Accès à des milliers de produits
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Paiement sécurisé
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Suivi de vos commandes
              </li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> 50 jetons offerts pour démarrer
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Votre boutique personnalisée
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> 28 jours d'essai gratuit
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 h-13 rounded-xl font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>
        <Button
          type="submit"
          className="flex-[2] h-13 rounded-xl font-bold shadow-lg shadow-primary/20"
          disabled={!isValid}
        >
          Continuer
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.form>
  );
});

StepAccountType.displayName = 'StepAccountType';

export default StepAccountType;
