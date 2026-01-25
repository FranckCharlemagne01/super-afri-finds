import { memo } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Globe, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import OptimizedInput from '@/components/auth/OptimizedInput';
import { CountrySelect } from '@/components/CountrySelect';
import { CitySelect } from '@/components/CitySelect';
import AuthErrorAlert from '@/components/auth/AuthErrorAlert';

interface StepPersonalInfoProps {
  firstName: string;
  lastName: string;
  phone: string;
  dialCode: string;
  country: string;
  city: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  error?: string;
}

const StepPersonalInfo = memo(({
  firstName,
  lastName,
  phone,
  dialCode,
  country,
  city,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onCountryChange,
  onCityChange,
  onNext,
  onBack,
  error
}: StepPersonalInfoProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const isValid = firstName.trim() && lastName.trim() && phone.trim().length >= 8;

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
          Parlez-nous de vous
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ces informations nous aident à personnaliser votre expérience
        </p>
      </div>

      {error && <AuthErrorAlert message={error} />}

      {/* Name fields */}
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

      {/* Country select */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          Pays
        </Label>
        <CountrySelect value={country} onValueChange={onCountryChange} />
      </div>

      {/* City select */}
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

      {/* Phone field */}
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

StepPersonalInfo.displayName = 'StepPersonalInfo';

export default StepPersonalInfo;
