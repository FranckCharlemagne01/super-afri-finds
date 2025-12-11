import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Globe, Eye, EyeOff, AlertCircle, ShoppingCart, Store, Mail, Loader2, Lock, User, Phone, MapPin, Building2 } from 'lucide-react';
import { CountrySelect } from '@/components/CountrySelect';
import { CitySelect } from '@/components/CitySelect';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getCountryByCode } from '@/data/countries';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, resetPassword } = useStableAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('CI');
  const [city, setCity] = useState('');
  const [dialCode, setDialCode] = useState('+225');
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
  const [shopName, setShopName] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [updatePasswordMode, setUpdatePasswordMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [resetFormError, setResetFormError] = useState('');
  const [updatePasswordError, setUpdatePasswordError] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendingOtp, setResendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

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

  useEffect(() => {
    const redirectToHome = async () => {
      if (!user || updatePasswordMode || !registrationSuccess) return;

      toast({
        title: "✅ Inscription réussie !",
        description: "Bienvenue sur Djassa.",
        duration: 3000,
      });

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    };

    redirectToHome();
  }, [user, updatePasswordMode, registrationSuccess, navigate, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    try {
      const { error } = await signIn(loginIdentifier, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials') ||
            error.message.includes('Invalid email or password') ||
            error.message.includes('Invalid password')) {
          setFormError('Email ou mot de passe incorrect. Vérifiez vos informations et réessayez.');
        } else if (error.message.includes('Email not confirmed')) {
          setFormError('Veuillez confirmer votre email avant de vous connecter.');
        } else if (error.message.includes('Too many requests')) {
          setFormError('Trop de tentatives de connexion. Veuillez patienter quelques minutes.');
        } else {
          setFormError('Email ou mot de passe incorrect. Vérifiez vos informations et réessayez.');
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
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 500);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setFormError('Email ou mot de passe incorrect. Vérifiez vos informations et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const PASSWORD_MIN_LENGTH = 12;
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    
    if (password.length < PASSWORD_MIN_LENGTH) {
      const errorMsg = `Le mot de passe doit contenir au moins 12 caractères (actuellement ${password.length}).`;
      setFormError(errorMsg);
      toast({
        title: "❌ Mot de passe trop court",
        description: errorMsg,
        variant: "destructive",
        duration: 6000,
      });
      return;
    }
    
    if (!PASSWORD_REGEX.test(password)) {
      const errorMsg = 'Le mot de passe doit contenir au moins 12 caractères, incluant majuscules, minuscules, chiffres et caractères spéciaux (@$!%*?&).';
      setFormError(errorMsg);
      toast({
        title: "❌ Mot de passe non conforme",
        description: errorMsg,
        variant: "destructive",
        duration: 6000,
      });
      return;
    }

    setLoading(true);

    try {
      const fullPhoneNumber = phone.trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const shopNameToSend = userRole === 'seller' && shopName.trim() ? shopName.trim() : '';
      
      const { error: signUpError, data: signUpData } = await signUp(
        email,
        password,
        fullName,
        fullPhoneNumber,
        country || 'CI',
        userRole || 'buyer',
        shopNameToSend
      );
      
      if (signUpError) {
        let errorMsg = signUpError.message || "Une erreur est survenue lors de l'inscription.";
        let errorTitle = "❌ Erreur d'inscription";
        
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
          errorMsg = 'Cet email possède déjà un compte. Veuillez vous connecter.';
          errorTitle = "⚠️ Compte existant";
        } else if (signUpError.message.includes('Invalid email')) {
          errorMsg = 'Veuillez saisir une adresse email valide.';
          errorTitle = "⚠️ Email invalide";
        } else if (signUpError.message.includes('Password')) {
          errorMsg = 'Le mot de passe ne respecte pas les exigences de sécurité.';
          errorTitle = "⚠️ Mot de passe invalide";
        }
        
        setFormError(errorMsg);
        toast({ title: errorTitle, description: errorMsg, variant: "destructive", duration: 6000 });
        return;
      }

      const userIdentities = signUpData?.user?.identities;
      const hasNoIdentities = !userIdentities || userIdentities.length === 0;
      
      if (hasNoIdentities && signUpData?.user) {
        const errorMsg = 'Cet email possède déjà un compte. Veuillez vous connecter.';
        setFormError(errorMsg);
        toast({ title: "⚠️ Compte existant", description: errorMsg, variant: "destructive", duration: 6000 });
        return;
      }

      if (!signUpData?.user) {
        const errorMsg = "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
        setFormError(errorMsg);
        toast({ title: "❌ Erreur d'inscription", description: errorMsg, variant: "destructive", duration: 6000 });
        return;
      }

      setOtpEmail(email);
      setRegistrationSuccess(true);
      
      toast({
        title: "✅ Inscription réussie !",
        description: "Un email de confirmation vous a été envoyé.",
        duration: 8000,
      });

      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setShopName('');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur inattendue est survenue";
      const errorMsg = `Erreur: ${errorMessage}. Veuillez réessayer.`;
      setFormError(errorMsg);
      toast({ title: "❌ Erreur d'inscription", description: errorMsg, variant: "destructive", duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpCode.length !== 6) {
      setOtpError('Veuillez saisir un code à 6 chiffres.');
      return;
    }
    setVerifyingOtp(true);
    setOtpError('');
    try {
      const { error } = await supabase.auth.verifyOtp({ email: otpEmail, token: otpCode, type: 'email' });
      if (error) {
        if (error.message.includes('expired') || error.message.includes('Token has expired')) {
          setOtpError('⏱️ Le code a expiré. Demandez-en un nouveau.');
        } else if (error.message.includes('invalid') || error.message.includes('Token is invalid')) {
          setOtpError('❌ Code invalide. Vérifiez et réessayez.');
        } else {
          setOtpError('❌ Erreur lors de la vérification.');
        }
      } else {
        setRegistrationSuccess(true);
        setShowOtpVerification(false);
        toast({ title: "✅ Compte vérifié !", description: "Redirection en cours...", duration: 3000 });
        setTimeout(() => navigate('/', { replace: true }), 1000);
      }
    } catch {
      setOtpError('❌ Erreur lors de la vérification.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setOtpError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: otpEmail, options: { shouldCreateUser: false } });
      if (error) {
        setOtpError('❌ Erreur lors du renvoi du code.');
      } else {
        setOtpCode('');
        toast({ title: "📧 Code renvoyé", description: "Vérifiez votre email.", duration: 4000 });
      }
    } catch {
      setOtpError('❌ Erreur lors du renvoi du code.');
    } finally {
      setResendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetFormError('');
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        setResetFormError(error.message.includes('Unable to validate') ? "Aucun compte n'est associé à cette adresse email." : 'Une erreur est survenue.');
      } else {
        setResetSuccess(true);
        toast({ title: "📧 Email envoyé", description: "Consultez votre boîte email.", duration: 4000 });
      }
    } catch {
      setResetFormError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatePasswordError('');
    if (newPassword !== confirmPassword) {
      setUpdatePasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setUpdatePasswordError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setUpdatePasswordError('Une erreur est survenue.');
      } else {
        toast({ title: "✅ Mot de passe mis à jour", description: "Votre mot de passe a été modifié avec succès !", duration: 4000 });
        navigate('/');
      }
    } catch {
      setUpdatePasswordError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const inputVariants = {
    focus: { scale: 1.01, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } }
  };

  // Reusable styled input wrapper
  const InputField = ({
    id,
    label,
    icon: Icon,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false,
    maxLength,
    hint,
    error,
    showPasswordToggle = false,
    showPasswordState,
    onTogglePassword
  }: {
    id: string;
    label: string;
    icon?: any;
    type?: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    maxLength?: number;
    hint?: string;
    error?: boolean;
    showPasswordToggle?: boolean;
    showPasswordState?: boolean;
    onTogglePassword?: () => void;
  }) => (
    <motion.div 
      className="space-y-2"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Label htmlFor={id} className="text-sm font-semibold text-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        {label}
      </Label>
      <motion.div 
        className="relative"
        whileFocus="focus"
        variants={inputVariants}
      >
        <Input
          id={id}
          type={showPasswordToggle ? (showPasswordState ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          maxLength={maxLength}
          className={`
            h-14 text-base rounded-2xl border-2 bg-background/50
            px-4 pr-${showPasswordToggle ? '14' : '4'}
            transition-all duration-300 ease-out
            placeholder:text-muted-foreground/50 placeholder:text-sm
            focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background
            hover:border-primary/30 hover:bg-background
            ${error ? 'border-destructive ring-2 ring-destructive/20' : 'border-input'}
          `}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted/50 transition-colors"
            onClick={onTogglePassword}
          >
            {showPasswordState ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </motion.div>
      {hint && (
        <motion.p 
          className="text-xs text-muted-foreground pl-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {hint}
        </motion.p>
      )}
    </motion.div>
  );

  // Error alert component
  const ErrorAlert = ({ message }: { message: string }) => (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm font-medium text-destructive">{message}</p>
      </div>
    </motion.div>
  );

  // Submit button component
  const SubmitButton = ({ loading, text, loadingText }: { loading: boolean; text: string; loadingText: string }) => (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button 
        type="submit" 
        className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" 
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {loadingText}
          </span>
        ) : text}
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md space-y-4">
        {/* Back button */}
        <AnimatePresence mode="wait">
          {(authMode === 'signup' || resetMode || authMode === 'signin') && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Button
                variant="ghost"
                onClick={() => {
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
                }}
                className="h-12 px-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/80"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {resetMode ? 'Retour' : authMode === 'signup' ? 'Retour' : "Retour à l'accueil"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={authMode + (resetMode ? '-reset' : '') + (updatePasswordMode ? '-update' : '')}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-card/95 backdrop-blur-sm border-0 shadow-2xl shadow-black/10 rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="text-center p-6 pb-2 space-y-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30"
              >
                {updatePasswordMode ? (
                  <Lock className="w-8 h-8 text-primary-foreground" />
                ) : resetMode ? (
                  <Mail className="w-8 h-8 text-primary-foreground" />
                ) : authMode === 'signup' ? (
                  <User className="w-8 h-8 text-primary-foreground" />
                ) : (
                  <Store className="w-8 h-8 text-primary-foreground" />
                )}
              </motion.div>
              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              >
                Djassa
              </motion.h1>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground"
              >
                {updatePasswordMode 
                  ? "Créez un nouveau mot de passe sécurisé" 
                  : resetMode
                  ? "Réinitialisez votre mot de passe"
                  : authMode === 'signup'
                  ? "Créez votre compte en quelques étapes"
                  : "Connectez-vous à votre espace"
                }
              </motion.p>
            </div>

            {/* Content */}
            <div className="p-6 pt-4">
              {/* Update Password Form */}
              {updatePasswordMode ? (
                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <AnimatePresence>
                    {updatePasswordError && <ErrorAlert message={updatePasswordError} />}
                  </AnimatePresence>
                  
                  <InputField
                    id="newPassword"
                    label="Nouveau mot de passe"
                    icon={Lock}
                    placeholder="Entrez votre nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    hint="Minimum 6 caractères"
                    showPasswordToggle
                    showPasswordState={showNewPassword}
                    onTogglePassword={() => setShowNewPassword(!showNewPassword)}
                  />
                  
                  <InputField
                    id="confirmPassword"
                    label="Confirmer le mot de passe"
                    icon={Lock}
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    showPasswordToggle
                    showPasswordState={showConfirmPassword}
                    onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                  
                  <SubmitButton loading={loading} text="Mettre à jour" loadingText="Mise à jour..." />
                </form>
              ) : showOtpVerification ? (
                /* OTP Verification */
                <div className="space-y-6 py-4">
                  <div className="text-center space-y-2">
                    <motion.div 
                      className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Mail className="w-7 h-7 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-semibold">Vérifiez votre email</h3>
                    <p className="text-sm text-muted-foreground">
                      Code envoyé à <strong className="text-foreground">{otpEmail}</strong>
                    </p>
                  </div>

                  <AnimatePresence>
                    {otpError && <ErrorAlert message={otpError} />}
                  </AnimatePresence>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                      <InputOTP
                        maxLength={6}
                        value={otpCode}
                        onChange={(value) => {
                          setOtpCode(value);
                          setOtpError('');
                          if (value.length === 6) setTimeout(handleVerifyOtp, 300);
                        }}
                      >
                        <InputOTPGroup className="gap-2">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} className="w-12 h-14 text-lg rounded-xl border-2" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                      <p className="text-xs text-muted-foreground">Expire dans 5 minutes</p>
                    </div>

                    <SubmitButton loading={verifyingOtp} text="Confirmer" loadingText="Vérification..." />
                  </form>

                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Pas reçu le code ?</p>
                    <Button variant="outline" onClick={handleResendOtp} disabled={resendingOtp} className="w-full h-12 rounded-xl">
                      {resendingOtp ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Envoi...</> : "Renvoyer le code"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setShowOtpVerification(false); setOtpCode(''); setOtpError(''); }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Modifier l'email
                    </button>
                  </div>
                </div>
              ) : registrationSuccess ? (
                /* Registration Success */
                <motion.div 
                  className="text-center space-y-4 py-8"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold">Bienvenue sur Djassa !</h3>
                  <p className="text-muted-foreground">Votre compte est prêt. Commencez à explorer.</p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={() => navigate('/')} className="h-12 px-8 rounded-xl font-semibold">
                      Commencer
                    </Button>
                  </motion.div>
                </motion.div>
              ) : resetMode ? (
                /* Reset Password Form */
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <AnimatePresence>
                    {resetFormError && <ErrorAlert message={resetFormError} />}
                  </AnimatePresence>

                  {resetSuccess ? (
                    <motion.div 
                      className="text-center py-6 space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="mx-auto w-14 h-14 bg-success/10 rounded-full flex items-center justify-center">
                        <Mail className="w-7 h-7 text-success" />
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
                    </motion.div>
                  ) : (
                    <>
                      <InputField
                        id="resetEmail"
                        label="Adresse email"
                        icon={Mail}
                        type="email"
                        placeholder="exemple : nom@email.com"
                        value={resetEmail}
                        onChange={(e) => { setResetEmail(e.target.value); if (resetFormError) setResetFormError(''); }}
                        required
                      />
                      <SubmitButton loading={loading} text="Envoyer le lien" loadingText="Envoi..." />
                    </>
                  )}
                </form>
              ) : authMode === 'signup' ? (
                /* Sign Up Form */
                <form onSubmit={handleSignUp} className="space-y-4">
                  <AnimatePresence>
                    {formError && !formError.toLowerCase().includes('email') && <ErrorAlert message={formError} />}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      id="lastName"
                      label="Nom"
                      icon={User}
                      placeholder="Ex : Koné"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      maxLength={50}
                    />
                    <InputField
                      id="firstName"
                      label="Prénom"
                      placeholder="Ex : Aminata"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <InputField
                      id="signupEmail"
                      label="Adresse email"
                      icon={Mail}
                      type="email"
                      placeholder="exemple : nom@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (formError) setFormError(''); }}
                      required
                      maxLength={255}
                      error={formError.toLowerCase().includes('email')}
                    />
                    <AnimatePresence>
                      {formError && formError.toLowerCase().includes('email') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
                        >
                          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-destructive">Cet email est déjà utilisé</p>
                            <button
                              type="button"
                              className="text-xs text-primary font-medium mt-1 hover:underline"
                              onClick={() => { setAuthMode('signin'); setLoginIdentifier(email); setFormError(''); }}
                            >
                              Se connecter →
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      Pays
                    </Label>
                    <CountrySelect
                      value={country}
                      onValueChange={(value) => {
                        setCountry(value);
                        setCity('');
                        const selectedCountry = getCountryByCode(value);
                        if (selectedCountry) {
                          setDialCode(selectedCountry.dialCode);
                          if (!phone || phone.startsWith('+')) setPhone(selectedCountry.dialCode + ' ');
                        }
                      }}
                    />
                  </motion.div>

                  <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Ville
                    </Label>
                    <CitySelect countryCode={country} value={city} onValueChange={setCity} placeholder="Sélectionnez votre ville" />
                  </motion.div>

                  <InputField
                    id="phone"
                    label="Téléphone"
                    icon={Phone}
                    placeholder={`${dialCode} 07 07 07 07 07`}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^[+\d\s]*$/.test(val)) setPhone(val);
                    }}
                    required
                    maxLength={20}
                    hint={`Format : ${dialCode} 0707070707`}
                  />

                  {/* Account Type Selection */}
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label className="text-sm font-semibold">Type de compte</Label>
                    <RadioGroup 
                      value={userRole} 
                      onValueChange={(value) => setUserRole(value as 'buyer' | 'seller')}
                      className="grid grid-cols-2 gap-3"
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Label 
                          htmlFor="buyer" 
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            userRole === 'buyer' 
                              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                              : 'border-input hover:border-primary/30 hover:bg-muted/50'
                          }`}
                        >
                          <RadioGroupItem value="buyer" id="buyer" className="sr-only" />
                          <ShoppingCart className={`w-6 h-6 ${userRole === 'buyer' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${userRole === 'buyer' ? 'text-primary' : 'text-foreground'}`}>Acheteur</span>
                        </Label>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Label 
                          htmlFor="seller" 
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            userRole === 'seller' 
                              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                              : 'border-input hover:border-primary/30 hover:bg-muted/50'
                          }`}
                        >
                          <RadioGroupItem value="seller" id="seller" className="sr-only" />
                          <Store className={`w-6 h-6 ${userRole === 'seller' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${userRole === 'seller' ? 'text-primary' : 'text-foreground'}`}>Vendeur</span>
                        </Label>
                      </motion.div>
                    </RadioGroup>
                  </motion.div>

                  <AnimatePresence>
                    {userRole === 'seller' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 bg-primary/5 p-4 rounded-2xl border border-primary/20">
                          <InputField
                            id="shopName"
                            label="Nom de votre boutique"
                            icon={Building2}
                            placeholder="Ex : Boutique Mode, Tech Shop..."
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            maxLength={100}
                            hint="Optionnel. Vous pourrez le modifier plus tard."
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <InputField
                    id="signupPassword"
                    label="Mot de passe"
                    icon={Lock}
                    placeholder="Créez un mot de passe sécurisé"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    hint="12+ caractères avec majuscules, chiffres et symboles (@$!%*?&)"
                    showPasswordToggle
                    showPasswordState={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                  />

                  <div className="pt-2">
                    <SubmitButton loading={loading} text="Créer mon compte" loadingText="Création..." />
                  </div>
                </form>
              ) : (
                /* Sign In Form */
                <form onSubmit={handleSignIn} className="space-y-5">
                  <AnimatePresence>
                    {formError && <ErrorAlert message={formError} />}
                  </AnimatePresence>
                  
                  <InputField
                    id="loginIdentifier"
                    label="Email ou téléphone"
                    icon={Mail}
                    placeholder="exemple : nom@email.com"
                    value={loginIdentifier}
                    onChange={(e) => { setLoginIdentifier(e.target.value); if (formError) setFormError(''); }}
                    required
                  />

                  <InputField
                    id="password"
                    label="Mot de passe"
                    icon={Lock}
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (formError) setFormError(''); }}
                    required
                    showPasswordToggle
                    showPasswordState={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                  />

                  <SubmitButton loading={loading} text="Se connecter" loadingText="Connexion..." />

                  <div className="flex flex-col gap-3 text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setResetMode(true); setFormError(''); }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Mot de passe oublié ?
                    </button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">ou</span>
                      </div>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => { setAuthMode('signup'); setFormError(''); setPassword(''); }}
                      className="text-sm text-primary hover:text-primary/80 font-semibold py-2 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Créer un compte
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;
