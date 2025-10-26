import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextInput, NumericInput } from '@/components/ui/validated-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Globe, Eye, EyeOff, AlertCircle, ShoppingCart, Store, Mail } from 'lucide-react';
import { CountrySelect } from '@/components/CountrySelect';
import { CitySelect } from '@/components/CitySelect';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getCountryByCode } from '@/data/countries';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
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
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const type = searchParams.get('type');
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');
    
    if (type === 'recovery' && access_token && refresh_token) {
      setUpdatePasswordMode(true);
    }

    // Gérer les messages de vérification
    if (verified === 'already') {
      toast({
        title: "✅ Compte déjà vérifié",
        description: "Votre compte est déjà actif. Connectez-vous pour continuer.",
        duration: 5000,
      });
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/auth');
    }

    if (error === 'verification_failed') {
      toast({
        variant: "destructive",
        title: "❌ Erreur de vérification",
        description: "Le lien de vérification est invalide ou a expiré. Essayez de vous connecter ou demandez un nouveau lien.",
        duration: 7000,
      });
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/auth');
    }
  }, [searchParams, toast]);

  // Rediriger automatiquement les utilisateurs connectés vers leur dashboard
  useEffect(() => {
    const redirectToDashboard = async () => {
      if (!user || updatePasswordMode || !registrationSuccess) return;

      try {
        // Récupérer le rôle de l'utilisateur
        const { data: roleData } = await supabase.rpc('get_user_role', { 
          _user_id: user.id 
        });

        toast({
          title: "✅ Inscription réussie !",
          description: "Bienvenue sur Djassa.",
          duration: 3000,
        });

        // Rediriger vers le tableau de bord approprié selon le rôle
        setTimeout(() => {
          if (roleData === 'seller') {
            navigate('/seller-dashboard', { replace: true });
          } else if (roleData === 'superadmin') {
            navigate('/superadmin', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 500);
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Fallback vers la page d'accueil
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);
      }
    };

    redirectToDashboard();
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
        // Récupérer le rôle de l'utilisateur pour rediriger vers le bon dashboard
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (currentUser) {
            const { data: roleData } = await supabase.rpc('get_user_role', { 
              _user_id: currentUser.id 
            });

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
                // Rediriger selon le rôle
                if (roleData === 'seller') {
                  navigate('/seller-dashboard', { replace: true });
                } else if (roleData === 'superadmin') {
                  navigate('/superadmin', { replace: true });
                } else {
                  navigate('/', { replace: true });
                }
              }, 500);
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          // Fallback vers la page d'accueil
          navigate('/', { replace: true });
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
    setLoading(true);
    setFormError('');

    try {
      // Le numéro de téléphone peut contenir le code pays ou pas
      const fullPhoneNumber = phone.trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const shopNameToSend = userRole === 'seller' && shopName.trim() ? shopName.trim() : '';
      
      // Créer le compte utilisateur avec confirmation email activée par défaut
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: 'https://djassa.djassa.tech/auth/callback',
          data: {
            full_name: fullName,
            phone: fullPhoneNumber,
            country: country || 'CI',
            city: city || '',
            user_role: userRole || 'buyer',
            shop_name: shopNameToSend,
          }
        }
      });
      
      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          setFormError('Un compte avec cet email existe déjà. Essayez de vous connecter.');
          toast({
            title: "⚠️ Compte existant",
            description: "Un compte avec cet email existe déjà. Essayez de vous connecter.",
            variant: "destructive",
            duration: 5000,
          });
        } else if (signUpError.message.includes('Invalid email')) {
          setFormError('Veuillez saisir une adresse email valide.');
          toast({
            title: "⚠️ Email invalide",
            description: "Veuillez saisir une adresse email valide.",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          setFormError(signUpError.message || "Une erreur est survenue lors de l'inscription.");
          toast({
            title: "❌ Erreur d'inscription",
            description: signUpError.message || "Une erreur est survenue lors de l'inscription. Veuillez vérifier votre adresse e-mail et réessayer.",
            variant: "destructive",
            duration: 5000,
          });
        }
        return;
      }

      // Succès - afficher le message de vérification
      setOtpEmail(email);
      setRegistrationSuccess(true);
      toast({
        title: "✅ Inscription réussie !",
        description: "Un email de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception (et vos spams).",
        duration: 6000,
      });

      // Réinitialiser le formulaire
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setShopName('');
      
      // Passer en mode connexion après 3 secondes
      setTimeout(() => {
        setAuthMode('signin');
        setRegistrationSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Signup error:', error);
      setFormError("Une erreur est survenue. Veuillez réessayer ou vérifier votre adresse e-mail.");
      toast({
        title: "❌ Erreur d'inscription",
        description: "Une erreur est survenue. Veuillez réessayer ou vérifier votre adresse e-mail.",
        variant: "destructive",
        duration: 5000,
      });
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
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otpCode,
        type: 'email'
      });

      if (error) {
        if (error.message.includes('expired') || error.message.includes('Token has expired')) {
          setOtpError('⏱️ Le code a expiré (5 min). Demandez-en un nouveau.');
        } else if (error.message.includes('invalid') || error.message.includes('Token is invalid')) {
          setOtpError('❌ Code invalide. Vérifiez et réessayez.');
        } else {
          setOtpError('❌ Erreur lors de la vérification. Réessayez.');
        }
      } else {
        setRegistrationSuccess(true);
        setShowOtpVerification(false);
        toast({
          title: "✅ Compte vérifié !",
          description: "Votre email a été confirmé. Redirection en cours...",
          duration: 3000,
        });

        // Redirection automatique vers la page d'accueil
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpError('❌ Erreur lors de la vérification. Réessayez.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setOtpError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: {
          shouldCreateUser: false
        }
      });

      if (error) {
        setOtpError('❌ Erreur lors du renvoi du code.');
        toast({
          title: "❌ Erreur",
          description: "Impossible de renvoyer le code. Réessayez.",
          variant: "destructive",
          duration: 3000,
        });
      } else {
        setOtpCode('');
        toast({
          title: "📧 Code renvoyé",
          description: "Un nouveau code a été envoyé à votre email.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
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
        if (error.message.includes('Unable to validate email address')) {
          setResetFormError('Aucun compte n\'est associé à cette adresse email.');
        } else {
          setResetFormError('Une erreur est survenue. Veuillez réessayer.');
        }
      } else {
        setResetSuccess(true);
        toast({
          title: "📧 Email envoyé",
          description: "Consultez votre boîte email pour réinitialiser votre mot de passe.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setResetFormError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatePasswordError('');
    
    if (newPassword !== confirmPassword) {
      setUpdatePasswordError('Les mots de passe ne correspondent pas. Veuillez vérifier.');
      return;
    }

    if (newPassword.length < 6) {
      setUpdatePasswordError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        setUpdatePasswordError('Une erreur est survenue. Veuillez réessayer.');
      } else {
        toast({
          title: "✅ Mot de passe mis à jour",
          description: "Votre mot de passe a été mis à jour avec succès !",
          duration: 4000,
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Update password error:', error);
      setUpdatePasswordError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-[95%] md:max-w-md space-y-4">
        {(authMode === 'signup' || resetMode) && (
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
              }
            }}
            className="mb-2 text-sm md:text-base h-10 md:h-11"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        )}
        {authMode === 'signin' && !resetMode && (
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-2 text-sm md:text-base h-10 md:h-11"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        )}

        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
          <CardHeader className="text-center p-4 md:p-6 space-y-2">
            <CardTitle className="text-2xl md:text-3xl font-bold gradient-text-primary">Djassa</CardTitle>
            <CardDescription className="text-sm md:text-base text-muted-foreground">
              {updatePasswordMode 
                ? "Créez un nouveau mot de passe" 
                : resetMode
                ? "Réinitialiser votre mot de passe"
                : authMode === 'signup'
                ? "Créez votre compte"
                : "Connexion à votre compte"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {updatePasswordMode ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {updatePasswordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{updatePasswordError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </Button>
              </form>
            ) : showOtpVerification ? (
              <div className="space-y-6 py-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Vérifiez votre email
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Nous avons envoyé un code à 6 chiffres à<br />
                    <strong className="text-foreground">{otpEmail}</strong>
                  </p>
                </div>

                {otpError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{otpError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Label htmlFor="otp" className="text-sm font-medium">
                      Code de confirmation
                    </Label>
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => {
                        setOtpCode(value);
                        setOtpError('');
                        // Auto-submit quand le code est complet
                        if (value.length === 6) {
                          setTimeout(() => {
                            handleVerifyOtp();
                          }, 300);
                        }
                      }}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <p className="text-xs text-muted-foreground">
                      Le code expire dans 5 minutes
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={verifyingOtp || otpCode.length !== 6}
                  >
                    {verifyingOtp ? "Vérification..." : "Confirmer"}
                  </Button>
                </form>

                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Vous n'avez pas reçu le code ?
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResendOtp}
                    disabled={resendingOtp}
                    className="w-full"
                  >
                    {resendingOtp ? "Envoi en cours..." : "Renvoyer le code"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpVerification(false);
                      setOtpCode('');
                      setOtpError('');
                    }}
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                  >
                    Modifier l'email
                  </button>
                </div>
              </div>
            ) : registrationSuccess ? (
              <div className="text-center space-y-4 py-6">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-foreground">
                  Bienvenue sur Djassa !
                </h3>
                <p className="text-muted-foreground">
                  Votre compte a été activé avec succès. Vous pouvez maintenant commencer à vendre ou acheter.
                </p>
                <Button
                  onClick={() => navigate('/')}
                  className="mt-6"
                >
                  Commencer
                </Button>
              </div>
            ) : resetMode ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetFormError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{resetFormError}</AlertDescription>
                  </Alert>
                )}

                {resetSuccess ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      📧 Un email de réinitialisation a été envoyé à <strong>{resetEmail}</strong>
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setResetMode(false);
                        setResetSuccess(false);
                        setResetEmail('');
                      }}
                      className="w-full"
                    >
                      Retour à la connexion
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail">Email</Label>
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="email@exemple.com"
                        value={resetEmail}
                        onChange={(e) => {
                          setResetEmail(e.target.value);
                          if (resetFormError) setResetFormError('');
                        }}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? "Envoi..." : "Envoyer le lien"}
                    </Button>

                  </>
                )}
              </form>
            ) : authMode === 'signup' ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm md:text-base font-medium">Nom</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Dupont"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    maxLength={50}
                    className="h-12 md:h-12 text-base rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm md:text-base font-medium">Prénom</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    maxLength={50}
                    className="h-12 md:h-12 text-base rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupEmail" className="text-sm md:text-base font-medium">Email</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    placeholder="email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                    className="h-12 md:h-12 text-base rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Pays
                  </Label>
                  <CountrySelect
                    value={country}
                    onValueChange={(value) => {
                      setCountry(value);
                      setCity(''); // Réinitialiser la ville quand le pays change
                      const selectedCountry = getCountryByCode(value);
                      if (selectedCountry) {
                        setDialCode(selectedCountry.dialCode);
                        // Préremplir le champ téléphone avec le code international
                        // Si le champ est vide ou contient seulement un ancien code
                        if (!phone || phone.startsWith('+')) {
                          setPhone(selectedCountry.dialCode + ' ');
                        }
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm md:text-base font-medium">Ville</Label>
                  <CitySelect
                    countryCode={country}
                    value={city}
                    onValueChange={setCity}
                    placeholder="Sélectionnez votre ville"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm md:text-base font-medium">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    type="text"
                    placeholder={`${dialCode} 0707070707`}
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Accepter +, chiffres et espaces
                      if (value === '' || /^[+\d\s]*$/.test(value)) {
                        setPhone(value);
                      }
                    }}
                    required
                    maxLength={20}
                    className="h-12 md:h-12 text-base rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground">Format: {dialCode} 0707070707 ou 0707070707</p>
                </div>

                <div className="space-y-2">
                  <Label>Type de compte</Label>
                  <RadioGroup 
                    value={userRole} 
                    onValueChange={(value) => setUserRole(value as 'buyer' | 'seller')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <RadioGroupItem value="buyer" id="buyer" />
                      <Label htmlFor="buyer" className="cursor-pointer flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Acheteur
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 flex-1">
                      <RadioGroupItem value="seller" id="seller" />
                      <Label htmlFor="seller" className="cursor-pointer flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        Vendeur
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {userRole === 'seller' && (
                  <div className="space-y-2 bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <Label htmlFor="shopName" className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      Nom de votre boutique (optionnel)
                    </Label>
                    <Input
                      id="shopName"
                      type="text"
                      placeholder="Ex: Ma Boutique Mode, Électronique Pro..."
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      Si vide, votre boutique s'appellera "Djassa Boutique" par défaut. Vous pourrez le modifier plus tard.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signupPassword" className="text-sm md:text-base font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="signupPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 md:h-12 text-base rounded-lg pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 caractères
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 md:h-12 text-base font-semibold rounded-lg" 
                  disabled={loading}
                >
                  {loading ? "Inscription..." : "S'inscrire"}
                </Button>

              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-3 md:space-y-4">
                {formError && (
                  <Alert variant="destructive" className="text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="loginIdentifier" className="text-sm md:text-base font-medium">Email ou numéro de téléphone</Label>
                  <Input
                    id="loginIdentifier"
                    type="text"
                    placeholder="email@exemple.com ou +225XXXXXXXX"
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      if (formError) setFormError('');
                    }}
                    required
                    className="h-12 md:h-12 text-base rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm md:text-base font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError('');
                      }}
                      required
                      className="h-12 md:h-12 text-base rounded-lg pr-12"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 md:h-12 text-base font-semibold rounded-lg" 
                  disabled={loading}
                >
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
                
                <div className="flex flex-col gap-3 text-center pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode(true);
                      setFormError('');
                    }}
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors py-1"
                  >
                    Mot de passe oublié ?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setFormError('');
                      setPassword('');
                    }}
                    className="text-sm md:text-base text-primary hover:underline font-medium py-2"
                  >
                    Pas encore de compte ? <span className="font-semibold">Créez un compte</span>
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
