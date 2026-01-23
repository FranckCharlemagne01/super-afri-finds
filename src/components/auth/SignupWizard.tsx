import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  User, Mail, Phone, Globe, MapPin, Building2, Lock, 
  ChevronRight, ChevronLeft, Sparkles 
} from 'lucide-react';
import { CountrySelect } from '@/components/CountrySelect';
import { CitySelect } from '@/components/CitySelect';
import OptimizedInput from '@/components/auth/OptimizedInput';
import AuthErrorAlert from '@/components/auth/AuthErrorAlert';
import AuthSubmitButton from '@/components/auth/AuthSubmitButton';
import AccountTypeSelector from '@/components/auth/AccountTypeSelector';
import GoogleAuthButton from '@/components/GoogleAuthButton';

interface SignupWizardProps {
  // Step 1 fields
  lastName: string;
  firstName: string;
  email: string;
  country: string;
  city: string;
  phone: string;
  dialCode: string;
  // Step 2 fields
  userRole: 'buyer' | 'seller';
  shopName: string;
  signupPassword: string;
  // Handlers
  onLastNameChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onUserRoleChange: (value: 'buyer' | 'seller') => void;
  onShopNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onSwitchToSignin: () => void;
  // State
  loading: boolean;
  formError: string;
}

const StepIndicator = memo(({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
        currentStep === 1 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-primary/20 text-primary'
      }`}>
        1
      </div>
      <div className={`w-12 h-1 rounded-full transition-all ${
        currentStep === 2 ? 'bg-primary' : 'bg-muted'
      }`} />
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
        currentStep === 2 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      }`}>
        2
      </div>
    </div>
  </div>
));
StepIndicator.displayName = 'StepIndicator';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0
  })
};

const SignupWizard = memo(({
  lastName,
  firstName,
  email,
  country,
  city,
  phone,
  dialCode,
  userRole,
  shopName,
  signupPassword,
  onLastNameChange,
  onFirstNameChange,
  onEmailChange,
  onCountryChange,
  onCityChange,
  onPhoneChange,
  onUserRoleChange,
  onShopNameChange,
  onPasswordChange,
  onSubmit,
  onGoogleSignIn,
  onSwitchToSignin,
  loading,
  formError
}: SignupWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [step1Error, setStep1Error] = useState('');

  const validateStep1 = useCallback(() => {
    if (!lastName.trim()) {
      setStep1Error('Veuillez entrer votre nom');
      return false;
    }
    if (!firstName.trim()) {
      setStep1Error('Veuillez entrer votre prénom');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setStep1Error('Veuillez entrer une adresse email valide');
      return false;
    }
    if (!phone.trim() || phone.length < 8) {
      setStep1Error('Veuillez entrer un numéro de téléphone valide');
      return false;
    }
    setStep1Error('');
    return true;
  }, [lastName, firstName, email, phone]);

  const handleNextStep = useCallback(() => {
    if (validateStep1()) {
      setDirection(1);
      setCurrentStep(2);
    }
  }, [validateStep1]);

  const handlePrevStep = useCallback(() => {
    setDirection(-1);
    setCurrentStep(1);
  }, []);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  }, [onSubmit]);

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />
      
      {/* Step label */}
      <p className="text-center text-sm text-muted-foreground mb-4">
        Étape {currentStep}/2 • {currentStep === 1 ? 'Informations personnelles' : 'Motivation & Sécurité'}
      </p>

      <AnimatePresence mode="wait" custom={direction}>
        {currentStep === 1 ? (
          <motion.div
            key="step1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            {step1Error && <AuthErrorAlert message={step1Error} />}

            <div className="grid grid-cols-2 gap-3">
              <OptimizedInput
                id="lastName"
                label="Nom"
                icon={User}
                placeholder="Ex : Koné"
                value={lastName}
                onChange={onLastNameChange}
                required
                maxLength={50}
                autoComplete="family-name"
              />
              <OptimizedInput
                id="firstName"
                label="Prénom"
                placeholder="Ex : Aminata"
                value={firstName}
                onChange={onFirstNameChange}
                required
                maxLength={50}
                autoComplete="given-name"
              />
            </div>

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
            />

            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                Pays
              </Label>
              <CountrySelect value={country} onValueChange={onCountryChange} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Ville
              </Label>
              <CitySelect 
                countryCode={country} 
                value={city} 
                onValueChange={onCityChange} 
                placeholder="Sélectionnez votre ville" 
              />
            </div>

            <OptimizedInput
              id="phone"
              label="Téléphone"
              icon={Phone}
              placeholder={`${dialCode} 07 07 07 07 07`}
              value={phone}
              onChange={onPhoneChange}
              required
              maxLength={20}
              hint={`Format : ${dialCode} 0707070707`}
              autoComplete="tel"
            />

            {/* Next button */}
            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full h-14 rounded-xl font-semibold text-base mt-4 gap-2"
            >
              Suivant
              <ChevronRight className="w-5 h-5" />
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">ou</span>
              </div>
            </div>

            <GoogleAuthButton 
              onClick={onGoogleSignIn} 
              disabled={loading}
              mode="signup"
            />

            <p className="text-center text-sm text-muted-foreground pt-2">
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={onSwitchToSignin}
                className="text-primary font-semibold hover:underline"
              >
                Se connecter
              </button>
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="step2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-5"
            onSubmit={handleFormSubmit}
          >
            {formError && !formError.toLowerCase().includes('email') && (
              <AuthErrorAlert message={formError} />
            )}

            {/* Enhanced motivation section */}
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 rounded-2xl p-5 border border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Pourquoi rejoins-tu Djassa ?
                </h3>
              </div>
              
              <AccountTypeSelector value={userRole} onChange={onUserRoleChange} />
            </div>

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
                  hint="Sera visible par vos clients"
                  autoComplete="organization"
                />
              </motion.div>
            )}

            <OptimizedInput
              id="signupPassword"
              label="Mot de passe"
              icon={Lock}
              placeholder="12+ caractères, sécurisé"
              value={signupPassword}
              onChange={onPasswordChange}
              required
              showPasswordToggle
              hint="Min. 12 caractères, majuscules, minuscules, chiffres, @$!%*?&"
              autoComplete="new-password"
            />

            {formError && formError.toLowerCase().includes('email') && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-fade-in">
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
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <AuthSubmitButton loading={loading} text="Créer mon compte" loadingText="Création..." />
              
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="w-full h-12 rounded-xl font-medium gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Précédent
              </Button>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">ou</span>
              </div>
            </div>

            <GoogleAuthButton 
              onClick={onGoogleSignIn} 
              disabled={loading}
              mode="signup"
            />

            <p className="text-center text-sm text-muted-foreground pt-2">
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={onSwitchToSignin}
                className="text-primary font-semibold hover:underline"
              >
                Se connecter
              </button>
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
});

SignupWizard.displayName = 'SignupWizard';

export default SignupWizard;
