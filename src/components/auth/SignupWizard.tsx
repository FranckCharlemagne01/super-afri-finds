import { useState, useCallback, memo, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  WizardProgress,
  StepEmail, 
  StepPersonalInfo, 
  StepAccountType, 
  StepPassword 
} from './wizard';

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

const STEP_LABELS = [
  'Votre email',
  'Informations personnelles',
  'Votre profil',
  'Sécurité'
];

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
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});

  // Validation for each step
  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        if (!email.trim() || !email.includes('@')) {
          setStepErrors(prev => ({ ...prev, 1: 'Veuillez entrer une adresse email valide' }));
          return false;
        }
        break;
      case 2:
        if (!lastName.trim()) {
          setStepErrors(prev => ({ ...prev, 2: 'Veuillez entrer votre nom' }));
          return false;
        }
        if (!firstName.trim()) {
          setStepErrors(prev => ({ ...prev, 2: 'Veuillez entrer votre prénom' }));
          return false;
        }
        if (!phone.trim() || phone.length < 8) {
          setStepErrors(prev => ({ ...prev, 2: 'Veuillez entrer un numéro de téléphone valide' }));
          return false;
        }
        break;
      case 3:
        if (userRole === 'seller' && !shopName.trim()) {
          setStepErrors(prev => ({ ...prev, 3: 'Veuillez entrer le nom de votre boutique' }));
          return false;
        }
        break;
    }
    setStepErrors(prev => ({ ...prev, [step]: '' }));
    return true;
  }, [email, lastName, firstName, phone, userRole, shopName]);

  // Navigate to next step
  const handleNextStep = useCallback((step: number) => {
    if (validateStep(step)) {
      setCurrentStep(step + 1);
    }
  }, [validateStep]);

  // Navigate to previous step
  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  }, []);

  // Clear error when email changes
  const handleEmailChange = useCallback((value: string) => {
    onEmailChange(value);
    if (stepErrors[1]) {
      setStepErrors(prev => ({ ...prev, 1: '' }));
    }
  }, [onEmailChange, stepErrors]);

  // Memoized current error including form error
  const currentError = useMemo(() => {
    if (currentStep === 4 && formError) {
      return formError;
    }
    return stepErrors[currentStep] || '';
  }, [currentStep, formError, stepErrors]);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <WizardProgress 
        currentStep={currentStep} 
        totalSteps={4} 
        stepLabels={STEP_LABELS}
      />

      {/* Step content with animations */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <StepEmail
            key="step-email"
            email={email}
            onEmailChange={handleEmailChange}
            onNext={() => handleNextStep(1)}
            onGoogleSignIn={onGoogleSignIn}
            onSwitchToSignin={onSwitchToSignin}
            loading={loading}
            error={stepErrors[1]}
          />
        )}

        {currentStep === 2 && (
          <StepPersonalInfo
            key="step-personal"
            firstName={firstName}
            lastName={lastName}
            phone={phone}
            dialCode={dialCode}
            country={country}
            city={city}
            onFirstNameChange={onFirstNameChange}
            onLastNameChange={onLastNameChange}
            onPhoneChange={onPhoneChange}
            onCountryChange={onCountryChange}
            onCityChange={onCityChange}
            onNext={() => handleNextStep(2)}
            onBack={handlePrevStep}
            error={stepErrors[2]}
          />
        )}

        {currentStep === 3 && (
          <StepAccountType
            key="step-account"
            userRole={userRole}
            shopName={shopName}
            onUserRoleChange={onUserRoleChange}
            onShopNameChange={onShopNameChange}
            onNext={() => handleNextStep(3)}
            onBack={handlePrevStep}
          />
        )}

        {currentStep === 4 && (
          <StepPassword
            key="step-password"
            password={signupPassword}
            email={email}
            onPasswordChange={onPasswordChange}
            onSubmit={onSubmit}
            onBack={handlePrevStep}
            onSwitchToSignin={onSwitchToSignin}
            loading={loading}
            error={currentError}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

SignupWizard.displayName = 'SignupWizard';

export default SignupWizard;
