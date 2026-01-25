import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock, ChevronLeft, Shield, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OptimizedInput from '@/components/auth/OptimizedInput';
import AuthErrorAlert from '@/components/auth/AuthErrorAlert';
import AuthSubmitButton from '@/components/auth/AuthSubmitButton';

interface StepPasswordProps {
  password: string;
  email: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onSwitchToSignin: () => void;
  loading: boolean;
  error?: string;
}

const StepPassword = memo(({
  password,
  email,
  onPasswordChange,
  onSubmit,
  onBack,
  onSwitchToSignin,
  loading,
  error
}: StepPasswordProps) => {
  // Password validation rules
  const validations = useMemo(() => ({
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&]/.test(password)
  }), [password]);

  const isValid = Object.values(validations).every(Boolean);
  const validCount = Object.values(validations).filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onSubmit(e);
    }
  };

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
        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary/20 to-success/20 rounded-xl flex items-center justify-center mb-3">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          Sécurisez votre compte
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Créez un mot de passe fort pour <strong className="text-foreground">{email}</strong>
        </p>
      </div>

      {error && <AuthErrorAlert message={error} />}

      {/* Password input */}
      <OptimizedInput
        id="signupPassword"
        label="Mot de passe"
        icon={Lock}
        placeholder="Créez un mot de passe sécurisé"
        value={password}
        onChange={onPasswordChange}
        required
        showPasswordToggle
        autoComplete="new-password"
      />

      {/* Password strength indicator */}
      <div className="space-y-3">
        {/* Visual strength bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              validCount <= 2 
                ? 'bg-destructive' 
                : validCount <= 4 
                  ? 'bg-amber-500' 
                  : 'bg-success'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${(validCount / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Validation checklist */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <ValidationItem valid={validations.minLength} text="12 caractères min" />
          <ValidationItem valid={validations.hasUppercase} text="1 majuscule" />
          <ValidationItem valid={validations.hasLowercase} text="1 minuscule" />
          <ValidationItem valid={validations.hasNumber} text="1 chiffre" />
          <ValidationItem valid={validations.hasSpecial} text="1 spécial (@$!%*?&)" />
        </div>
      </div>

      {/* Email already used error with switch to login */}
      {error && error.toLowerCase().includes('email') && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Cet email est déjà utilisé</p>
            <button
              type="button"
              className="text-xs text-primary font-medium mt-1 hover:underline"
              onClick={onSwitchToSignin}
            >
              Se connecter →
            </button>
          </div>
        </motion.div>
      )}

      {/* Navigation buttons */}
      <div className="space-y-3 pt-2">
        <AuthSubmitButton 
          loading={loading} 
          text="Créer mon compte" 
          loadingText="Création en cours..."
          disabled={!isValid}
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full h-12 rounded-xl font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Précédent
        </Button>
      </div>

      {/* Switch to login */}
      <p className="text-center text-sm text-muted-foreground pt-1">
        Déjà un compte ?{' '}
        <button
          type="button"
          onClick={onSwitchToSignin}
          className="text-primary font-semibold hover:underline transition-colors"
        >
          Se connecter
        </button>
      </p>
    </motion.form>
  );
});

// Validation item component
const ValidationItem = memo(({ valid, text }: { valid: boolean; text: string }) => (
  <div className={`flex items-center gap-1.5 ${valid ? 'text-success' : 'text-muted-foreground'}`}>
    {valid ? (
      <Check className="w-3.5 h-3.5" strokeWidth={3} />
    ) : (
      <X className="w-3.5 h-3.5" />
    )}
    <span>{text}</span>
  </div>
));

ValidationItem.displayName = 'ValidationItem';
StepPassword.displayName = 'StepPassword';

export default StepPassword;
