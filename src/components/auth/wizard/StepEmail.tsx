import { memo } from 'react';
import { motion } from 'framer-motion';
import { Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OptimizedInput from '@/components/auth/OptimizedInput';
import GoogleAuthButton from '@/components/GoogleAuthButton';

interface StepEmailProps {
  email: string;
  onEmailChange: (value: string) => void;
  onNext: () => void;
  onGoogleSignIn: () => void;
  onSwitchToSignin: () => void;
  loading: boolean;
  error?: string;
}

const StepEmail = memo(({
  email,
  onEmailChange,
  onNext,
  onGoogleSignIn,
  onSwitchToSignin,
  loading,
  error
}: StepEmailProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Welcome message */}
      <div className="text-center space-y-3 pb-2">
        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Bienvenue sur Djassa !
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Créez votre compte en quelques étapes simples
          </p>
        </div>
      </div>

      {/* Email input */}
      <OptimizedInput
        id="signupEmail"
        label="Adresse email"
        icon={Mail}
        type="email"
        placeholder="exemple : nom@email.com"
        value={email}
        onChange={onEmailChange}
        required
        maxLength={255}
        autoComplete="email"
        error={!!error}
        hint={error || "Vous recevrez un email de confirmation"}
      />

      {/* Continue button */}
      <Button
        type="submit"
        className="w-full h-14 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 
          hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.98]
          transition-all duration-200"
        disabled={!email || !email.includes('@') || loading}
      >
        Continuer avec cet email
      </Button>

      {/* Divider */}
      <div className="relative py-3">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-4 text-muted-foreground font-medium">ou</span>
        </div>
      </div>

      {/* Google auth */}
      <GoogleAuthButton 
        onClick={onGoogleSignIn} 
        disabled={loading}
        mode="signup"
      />

      {/* Switch to login */}
      <p className="text-center text-sm text-muted-foreground pt-2">
        Déjà inscrit ?{' '}
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

StepEmail.displayName = 'StepEmail';

export default StepEmail;
