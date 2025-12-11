import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Globe, Mail, Lock, User, Phone, MapPin, Building2, Loader2 } from 'lucide-react';
import { CountrySelect } from '@/components/CountrySelect';
import { CitySelect } from '@/components/CitySelect';
import { supabase } from '@/integrations/supabase/client';
import { getCountryByCode } from '@/data/countries';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import OptimizedInput from '@/components/auth/OptimizedInput';
import AuthErrorAlert from '@/components/auth/AuthErrorAlert';
import AuthSubmitButton from '@/components/auth/AuthSubmitButton';
import AccountTypeSelector from '@/components/auth/AccountTypeSelector';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, resetPassword } = useStableAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form states - grouped logically
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  
  // Sign in states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign up states
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('CI');
  const [city, setCity] = useState('');
  const [dialCode, setDialCode] = useState('+225');
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
  const [shopName, setShopName] = useState('');
  
  // Reset password states
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Update password states
  const [updatePasswordMode, setUpdatePasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // OTP states
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  
  // Error states
  const [formError, setFormError] = useState('');
  const [resetFormError, setResetFormError] = useState('');
  const [updatePasswordError, setUpdatePasswordError] = useState('');
  const [otpError, setOtpError] = useState('');
  
  // Success states
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // URL params handling
  useEffect(() => {
    const type = searchParams.get('type');
    const mode = searchParams.get('mode');
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');
    
    if (type === 'recovery' && access_token && refresh_token) {
      setUpdatePasswordMode(true);
    }
    if (mode === 'signup') {
      setAuthMode('signup');
    }
  }, [searchParams]);

  // Redirect on success
  useEffect(() => {
    if (!user || updatePasswordMode || !registrationSuccess) return;

    toast({
      title: "✅ Inscription réussie !",
      description: "Bienvenue sur Djassa.",
      duration: 3000,
    });

    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 500);

    return () => clearTimeout(timer);
  }, [user, updatePasswordMode, registrationSuccess, navigate, toast]);

  // Memoized handlers to prevent re-renders
  const handleLoginIdentifierChange = useCallback((value: string) => {
    setLoginIdentifier(value);
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
  }, []);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (formError) setFormError('');
  }, [formError]);

  const handleSignupPasswordChange = useCallback((value: string) => {
    setSignupPassword(value);
  }, []);

  const handleFirstNameChange = useCallback((value: string) => {
    setFirstName(value);
  }, []);

  const handleLastNameChange = useCallback((value: string) => {
    setLastName(value);
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    if (value === '' || /^[+\d\s]*$/.test(value)) {
      setPhone(value);
    }
  }, []);

  const handleShopNameChange = useCallback((value: string) => {
    setShopName(value);
  }, []);

  const handleResetEmailChange = useCallback((value: string) => {
    setResetEmail(value);
    if (resetFormError) setResetFormError('');
  }, [resetFormError]);

  const handleNewPasswordChange = useCallback((value: string) => {
    setNewPassword(value);
  }, []);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setConfirmPassword(value);
  }, []);

  const handleCountryChange = useCallback((value: string) => {
    setCountry(value);
    setCity('');
    const selectedCountry = getCountryByCode(value);
    if (selectedCountry) {
      setDialCode(selectedCountry.dialCode);
      setPhone(prev => (!prev || prev.startsWith('+')) ? selectedCountry.dialCode + ' ' : prev);
    }
  }, []);

  const handleCityChange = useCallback((value: string) => {
    setCity(value);
  }, []);

  const handleUserRoleChange = useCallback((value: 'buyer' | 'seller') => {
    setUserRole(value);
  }, []);

  const handleSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    try {
      const { error } = await signIn(loginIdentifier, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials') ||
            error.message.includes('Invalid email or password') ||
            error.message.includes('Invalid password')) {
          setFormError('Email ou mot de passe incorrect.');
        } else if (error.message.includes('Email not confirmed')) {
          setFormError('Veuillez confirmer votre email.');
        } else if (error.message.includes('Too many requests')) {
          setFormError('Trop de tentatives. Patientez quelques minutes.');
        } else {
          setFormError('Email ou mot de passe incorrect.');
        }
      } else {
        toast({
          title: "✅ Connexion réussie",
          description: "Bienvenue sur Djassa !",
          duration: 3000,
        });

        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectUrl);
        } else {
          setTimeout(() => navigate('/', { replace: true }), 500);
        }
      }
    } catch {
      setFormError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  }, [signIn, loginIdentifier, password, toast, navigate]);

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const PASSWORD_MIN_LENGTH = 12;
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    
    if (signupPassword.length < PASSWORD_MIN_LENGTH) {
      setFormError(`Mot de passe: minimum 12 caractères (${signupPassword.length} actuellement).`);
      return;
    }
    
    if (!PASSWORD_REGEX.test(signupPassword)) {
      setFormError('Mot de passe: majuscules, minuscules, chiffres et @$!%*?& requis.');
      return;
    }

    setLoading(true);

    try {
      const fullPhoneNumber = phone.trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const shopNameToSend = userRole === 'seller' && shopName.trim() ? shopName.trim() : '';
      
      const { error: signUpError, data: signUpData } = await signUp(
        email,
        signupPassword,
        fullName,
        fullPhoneNumber,
        country || 'CI',
        userRole || 'buyer',
        shopNameToSend
      );
      
      if (signUpError) {
        const emailExistsPatterns = [
          'already registered', 'already been registered', 'user already registered',
          'email address has already been registered', 'user with this email',
          'email already exists', 'duplicate key', 'unique constraint',
          'already exists', 'email_exists', 'user_already_exists', 'rate limit exceeded'
        ];
        
        const isEmailExistsError = emailExistsPatterns.some(pattern => 
          signUpError.message.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (isEmailExistsError) {
          setFormError('Cet email possède déjà un compte.');
        } else if (signUpError.message.includes('Invalid email')) {
          setFormError('Adresse email invalide.');
        } else if (signUpError.message.includes('Password')) {
          setFormError('Mot de passe non conforme.');
        } else {
          setFormError(signUpError.message);
        }
        return;
      }

      const userIdentities = signUpData?.user?.identities;
      const hasNoIdentities = !userIdentities || userIdentities.length === 0;
      
      if (hasNoIdentities && signUpData?.user) {
        setFormError('Cet email possède déjà un compte.');
        return;
      }

      if (!signUpData?.user) {
        setFormError("Erreur lors de l'inscription. Réessayez.");
        return;
      }

      setOtpEmail(email);
      setRegistrationSuccess(true);
      
      toast({
        title: "✅ Inscription réussie !",
        description: "Email de confirmation envoyé.",
        duration: 8000,
      });

      // Reset form
      setEmail('');
      setSignupPassword('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setShopName('');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inattendue";
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, signupPassword, firstName, lastName, phone, country, userRole, shopName, signUp, toast]);

  const handleVerifyOtp = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpCode.length !== 6) {
      setOtpError('Code à 6 chiffres requis.');
      return;
    }
    setVerifyingOtp(true);
    setOtpError('');
    
    try {
      const { error } = await supabase.auth.verifyOtp({ email: otpEmail, token: otpCode, type: 'email' });
      if (error) {
        if (error.message.includes('expired')) {
          setOtpError('Code expiré. Demandez-en un nouveau.');
        } else if (error.message.includes('invalid')) {
          setOtpError('Code invalide.');
        } else {
          setOtpError('Erreur de vérification.');
        }
      } else {
        setRegistrationSuccess(true);
        setShowOtpVerification(false);
        toast({ title: "✅ Compte vérifié !", description: "Redirection...", duration: 3000 });
        setTimeout(() => navigate('/', { replace: true }), 1000);
      }
    } catch {
      setOtpError('Erreur de vérification.');
    } finally {
      setVerifyingOtp(false);
    }
  }, [otpCode, otpEmail, toast, navigate]);

  const handleResendOtp = useCallback(async () => {
    setResendingOtp(true);
    setOtpError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: otpEmail, options: { shouldCreateUser: false } });
      if (error) {
        setOtpError('Erreur lors du renvoi.');
      } else {
        setOtpCode('');
        toast({ title: "📧 Code renvoyé", description: "Vérifiez votre email.", duration: 4000 });
      }
    } catch {
      setOtpError('Erreur lors du renvoi.');
    } finally {
      setResendingOtp(false);
    }
  }, [otpEmail, toast]);

  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetFormError('');
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        setResetFormError(error.message.includes('Unable to validate') 
          ? "Aucun compte associé à cette adresse." 
          : 'Une erreur est survenue.');
      } else {
        setResetSuccess(true);
        toast({ title: "📧 Email envoyé", description: "Consultez votre boîte email.", duration: 4000 });
      }
    } catch {
      setResetFormError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }, [resetEmail, resetPassword, toast]);

  const handleUpdatePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatePasswordError('');
    if (newPassword !== confirmPassword) {
      setUpdatePasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setUpdatePasswordError('Minimum 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setUpdatePasswordError('Une erreur est survenue.');
      } else {
        toast({ title: "✅ Mot de passe mis à jour", duration: 4000 });
        navigate('/');
      }
    } catch {
      setUpdatePasswordError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }, [newPassword, confirmPassword, toast, navigate]);

  const handleBackClick = useCallback(() => {
    if (resetMode) {
      setResetMode(false);
      setResetSuccess(false);
      setResetEmail('');
      setResetFormError('');
    } else if (authMode === 'signup') {
      setAuthMode('signin');
      setFormError('');
    } else {
      navigate('/');
    }
  }, [resetMode, authMode, navigate]);

  const handleSwitchToSignup = useCallback(() => {
    setAuthMode('signup');
    setFormError('');
  }, []);

  const handleSwitchToSignin = useCallback(() => {
    setAuthMode('signin');
    setLoginIdentifier(email);
    setFormError('');
  }, [email]);

  const handleForgotPassword = useCallback(() => {
    setResetMode(true);
    setResetFormError('');
  }, []);

  const handleOtpChange = useCallback((value: string) => {
    setOtpCode(value);
    setOtpError('');
    if (value.length === 6) {
      setTimeout(() => handleVerifyOtp(), 300);
    }
  }, [handleVerifyOtp]);

  const handleExitOtp = useCallback(() => {
    setShowOtpVerification(false);
    setOtpCode('');
    setOtpError('');
  }, []);

  // Memoized current icon
  const headerIcon = useMemo(() => {
    if (updatePasswordMode) return Lock;
    if (resetMode) return Mail;
    if (authMode === 'signup') return User;
    return Mail;
  }, [updatePasswordMode, resetMode, authMode]);

  const HeaderIcon = headerIcon;

  // Memoized header text
  const headerText = useMemo(() => {
    if (updatePasswordMode) return "Créez un nouveau mot de passe sécurisé";
    if (resetMode) return "Réinitialisez votre mot de passe";
    if (authMode === 'signup') return "Créez votre compte";
    return "Connectez-vous à votre espace";
  }, [updatePasswordMode, resetMode, authMode]);

  const backButtonText = useMemo(() => {
    if (resetMode) return 'Retour';
    if (authMode === 'signup') return 'Retour';
    return "Retour à l'accueil";
  }, [resetMode, authMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md space-y-4">
        {/* Back button */}
        {(authMode === 'signup' || resetMode || authMode === 'signin') && (
          <div className="animate-fade-in">
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="h-12 px-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {backButtonText}
            </Button>
          </div>
        )}

        {/* Main card */}
        <div className="bg-card/95 backdrop-blur-sm border-0 shadow-2xl shadow-black/10 rounded-3xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="text-center p-6 pb-2 space-y-3">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 animate-scale-in">
              <HeaderIcon className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Djassa
            </h1>
            <p className="text-sm text-muted-foreground">
              {headerText}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 pt-4">
            {/* Update Password Form */}
            {updatePasswordMode ? (
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                {updatePasswordError && <AuthErrorAlert message={updatePasswordError} />}
                
                <OptimizedInput
                  id="newPassword"
                  label="Nouveau mot de passe"
                  icon={Lock}
                  placeholder="Entrez votre nouveau mot de passe"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  required
                  hint="Minimum 6 caractères"
                  showPasswordToggle
                  autoComplete="new-password"
                />
                
                <OptimizedInput
                  id="confirmPassword"
                  label="Confirmer le mot de passe"
                  icon={Lock}
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                  showPasswordToggle
                  autoComplete="new-password"
                />
                
                <AuthSubmitButton loading={loading} text="Mettre à jour" loadingText="Mise à jour..." />
              </form>
            ) : showOtpVerification ? (
              /* OTP Verification */
              <div className="space-y-6 py-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center animate-scale-in">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Vérifiez votre email</h3>
                  <p className="text-sm text-muted-foreground">
                    Code envoyé à <strong className="text-foreground">{otpEmail}</strong>
                  </p>
                </div>

                {otpError && <AuthErrorAlert message={otpError} />}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={handleOtpChange}
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} className="w-12 h-14 text-lg rounded-xl border-2" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                    <p className="text-xs text-muted-foreground">Expire dans 5 minutes</p>
                  </div>

                  <AuthSubmitButton loading={verifyingOtp} text="Confirmer" loadingText="Vérification..." />
                </form>

                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Pas reçu le code ?</p>
                  <Button variant="outline" onClick={handleResendOtp} disabled={resendingOtp} className="w-full h-12 rounded-xl">
                    {resendingOtp ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Envoi...</> : "Renvoyer le code"}
                  </Button>
                  <button
                    type="button"
                    onClick={handleExitOtp}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Modifier l'email
                  </button>
                </div>
              </div>
            ) : registrationSuccess ? (
              /* Registration Success */
              <div className="text-center space-y-4 py-8 animate-scale-in">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-bold">Bienvenue sur Djassa !</h3>
                <p className="text-muted-foreground">Votre compte est prêt.</p>
                <Button 
                  onClick={() => navigate('/')} 
                  className="h-12 px-8 rounded-xl font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  Commencer
                </Button>
              </div>
            ) : resetMode ? (
              /* Reset Password Form */
              <form onSubmit={handleResetPassword} className="space-y-5">
                {resetFormError && <AuthErrorAlert message={resetFormError} />}

                {resetSuccess ? (
                  <div className="text-center py-6 space-y-4 animate-fade-in">
                    <div className="mx-auto w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Mail className="w-7 h-7 text-green-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Email envoyé à <strong className="text-foreground">{resetEmail}</strong>
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => { setResetMode(false); setResetSuccess(false); setResetEmail(''); }}
                      className="w-full h-12 rounded-xl"
                    >
                      Retour à la connexion
                    </Button>
                  </div>
                ) : (
                  <>
                    <OptimizedInput
                      id="resetEmail"
                      label="Adresse email"
                      icon={Mail}
                      type="email"
                      placeholder="exemple : nom@email.com"
                      value={resetEmail}
                      onChange={handleResetEmailChange}
                      required
                      autoComplete="email"
                    />
                    <AuthSubmitButton loading={loading} text="Envoyer le lien" loadingText="Envoi..." />
                  </>
                )}
              </form>
            ) : authMode === 'signup' ? (
              /* Sign Up Form */
              <form onSubmit={handleSignUp} className="space-y-4">
                {formError && !formError.toLowerCase().includes('email') && <AuthErrorAlert message={formError} />}

                <div className="grid grid-cols-2 gap-3">
                  <OptimizedInput
                    id="lastName"
                    label="Nom"
                    icon={User}
                    placeholder="Ex : Koné"
                    value={lastName}
                    onChange={handleLastNameChange}
                    required
                    maxLength={50}
                    autoComplete="family-name"
                  />
                  <OptimizedInput
                    id="firstName"
                    label="Prénom"
                    placeholder="Ex : Aminata"
                    value={firstName}
                    onChange={handleFirstNameChange}
                    required
                    maxLength={50}
                    autoComplete="given-name"
                  />
                </div>

                <div className="space-y-2">
                  <OptimizedInput
                    id="signupEmail"
                    label="Adresse email"
                    icon={Mail}
                    type="email"
                    placeholder="exemple : nom@email.com"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    maxLength={255}
                    error={formError.toLowerCase().includes('email')}
                    autoComplete="email"
                  />
                  {formError && formError.toLowerCase().includes('email') && (
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-fade-in">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">Cet email est déjà utilisé</p>
                        <button
                          type="button"
                          className="text-xs text-primary font-medium mt-1 hover:underline"
                          onClick={handleSwitchToSignin}
                        >
                          Se connecter →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Pays
                  </Label>
                  <CountrySelect value={country} onValueChange={handleCountryChange} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Ville
                  </Label>
                  <CitySelect countryCode={country} value={city} onValueChange={handleCityChange} placeholder="Sélectionnez votre ville" />
                </div>

                <OptimizedInput
                  id="phone"
                  label="Téléphone"
                  icon={Phone}
                  placeholder={`${dialCode} 07 07 07 07 07`}
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  maxLength={20}
                  hint={`Format : ${dialCode} 0707070707`}
                  autoComplete="tel"
                />

                <AccountTypeSelector value={userRole} onChange={handleUserRoleChange} />

                {userRole === 'seller' && (
                  <div className="animate-fade-in">
                    <OptimizedInput
                      id="shopName"
                      label="Nom de votre boutique"
                      icon={Building2}
                      placeholder="Ex : Boutique Mode, Tech Shop..."
                      value={shopName}
                      onChange={handleShopNameChange}
                      required
                      maxLength={100}
                      hint="Sera visible par vos clients"
                      autoComplete="organization"
                    />
                  </div>
                )}

                <OptimizedInput
                  id="signupPassword"
                  label="Mot de passe"
                  icon={Lock}
                  placeholder="12+ caractères, sécurisé"
                  value={signupPassword}
                  onChange={handleSignupPasswordChange}
                  required
                  showPasswordToggle
                  hint="Min. 12 caractères, majuscules, minuscules, chiffres, @$!%*?&"
                  autoComplete="new-password"
                />

                <AuthSubmitButton loading={loading} text="Créer mon compte" loadingText="Création..." />

                <p className="text-center text-sm text-muted-foreground pt-2">
                  Déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={handleSwitchToSignin}
                    className="text-primary font-semibold hover:underline"
                  >
                    Se connecter
                  </button>
                </p>
              </form>
            ) : (
              /* Sign In Form */
              <form onSubmit={handleSignIn} className="space-y-5">
                {formError && <AuthErrorAlert message={formError} />}

                <OptimizedInput
                  id="loginEmail"
                  label="Email"
                  icon={Mail}
                  type="email"
                  placeholder="exemple : nom@email.com"
                  value={loginIdentifier}
                  onChange={handleLoginIdentifierChange}
                  required
                  autoComplete="email"
                />

                <OptimizedInput
                  id="loginPassword"
                  label="Mot de passe"
                  icon={Lock}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  showPasswordToggle
                  autoComplete="current-password"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <AuthSubmitButton loading={loading} text="Se connecter" loadingText="Connexion..." />

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSwitchToSignup}
                  className="w-full h-12 rounded-xl font-semibold hover:scale-[1.01] active:scale-[0.98] transition-all"
                >
                  Créer un compte
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          En continuant, vous acceptez les{' '}
          <a href="/legal" className="text-primary hover:underline">
            conditions d'utilisation
          </a>{' '}
          de Djassa.
        </p>
      </div>
    </div>
  );
};

export default Auth;
