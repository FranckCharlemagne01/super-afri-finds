import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextInput, NumericInput } from '@/components/ui/validated-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Globe, Eye, EyeOff, AlertCircle, ShoppingCart, Store } from 'lucide-react';
import { CountrySelect } from '@/components/CountrySelect';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getCountryByCode } from '@/data/countries';

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
  const [dialCode, setDialCode] = useState('+225');
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
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
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const type = searchParams.get('type');
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');
    
    if (type === 'recovery' && access_token && refresh_token) {
      setUpdatePasswordMode(true);
    }
  }, [searchParams]);

  // Rediriger automatiquement les utilisateurs connectés vers leur dashboard
  useEffect(() => {
    if (user && !updatePasswordMode && registrationSuccess) {
      toast({
        title: "✅ Inscription réussie !",
        description: "Bienvenue sur Djassa.",
        duration: 3000,
      });
      
      // Rediriger vers le tableau de bord approprié
      setTimeout(() => {
        navigate('/');
      }, 500);
    }
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
            navigate('/');
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
    setLoading(true);

    try {
      const fullPhoneNumber = `${dialCode}${phone}`;
      const fullName = `${firstName} ${lastName}`.trim();
      const { error } = await signUp(email, password, fullName, fullPhoneNumber, country, userRole);
      
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          toast({
            title: "⚠️ Compte existant",
            description: "Un compte avec cet email existe déjà. Essayez de vous connecter.",
            variant: "destructive",
            duration: 5000,
          });
        } else if (error.message.includes('Password should be at least')) {
          toast({
            title: "⚠️ Mot de passe trop court",
            description: "Le mot de passe doit contenir au moins 6 caractères.",
            variant: "destructive",
            duration: 5000,
          });
        } else if (error.message.includes('Invalid email')) {
          toast({
            title: "⚠️ Email invalide",
            description: "Veuillez saisir une adresse email valide.",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          toast({
            title: "❌ Erreur d'inscription",
            description: "Une erreur est survenue lors de l'inscription. Veuillez réessayer.",
            variant: "destructive",
            duration: 5000,
          });
        }
      } else {
        setRegistrationSuccess(true);
        toast({
          title: "✅ Inscription réussie",
          description: "Consultez votre email pour confirmer votre compte.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "❌ Erreur d'inscription",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl gradient-text-primary">Djassa</CardTitle>
            <CardDescription>
              {updatePasswordMode 
                ? "Créez un nouveau mot de passe" 
                : resetMode
                ? "Réinitialiser votre mot de passe"
                : authMode === 'signup'
                ? "Créer votre compte"
                : "Connectez-vous à votre compte"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
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
            ) : registrationSuccess ? (
              <div className="text-center space-y-4 py-6">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-foreground">
                  Merci pour votre inscription sur Djassa !
                </h3>
                <p className="text-muted-foreground">
                  Pour activer votre compte et commencer à vendre ou acheter, veuillez confirmer votre adresse e-mail.
                </p>
                <Button
                  onClick={() => navigate('/')}
                  className="mt-6"
                >
                  Retour à l'accueil
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

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setResetMode(false);
                          setResetFormError('');
                        }}
                        className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                      >
                        Retour à la connexion
                      </button>
                    </div>
                  </>
                )}
              </form>
            ) : authMode === 'signup' ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Dupont"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupEmail">Email</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    placeholder="email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
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
                      const selectedCountry = getCountryByCode(value);
                      if (selectedCountry) {
                        setDialCode(selectedCountry.dialCode);
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={dialCode}
                      disabled
                      className="w-20"
                    />
                    <NumericInput
                      id="phone"
                      placeholder="0123456789"
                      value={phone}
                      onChange={setPhone}
                      required
                      maxLength={15}
                      className="flex-1"
                    />
                  </div>
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

                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="signupPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 caractères
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Inscription..." : "S'inscrire"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                  >
                    Vous avez déjà un compte ? Se connecter
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="loginIdentifier">Email ou numéro de téléphone</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
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
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
                
                <div className="flex flex-col gap-2 text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setResetMode(true)}
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                  >
                    Pas encore de compte ? S'inscrire
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
