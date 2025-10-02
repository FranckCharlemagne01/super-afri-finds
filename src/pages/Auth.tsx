import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextInput, NumericInput } from '@/components/ui/validated-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Globe, Eye, EyeOff, AlertCircle, ShoppingCart, Store } from 'lucide-react';
import { CountrySelect } from '@/components/CountrySelect';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SellerUpgradeForm } from '@/components/SellerUpgradeForm';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('CI'); // Default to Côte d'Ivoire
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer'); // Default to buyer
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email ou téléphone pour la connexion
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

  // Check URL params for recovery mode
  useEffect(() => {
    const type = searchParams.get('type');
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');
    
    if (type === 'recovery' && access_token && refresh_token) {
      setUpdatePasswordMode(true);
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(''); // Clear any previous errors

    try {
      const { error } = await signIn(loginIdentifier, password);
      
      if (error) {
        // Handle different types of authentication errors
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
        
        // Check if there's a redirect URL stored after login
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectUrl);
        } else {
          // Attendre un moment pour que le rôle se charge, puis rediriger intelligemment
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
      const { error } = await signUp(email, password, fullName, phone, country, userRole);
      
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
            description: error.message,
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
    setResetFormError(''); // Clear any previous errors

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
    setUpdatePasswordError(''); // Clear any previous errors
    
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
                : "Connectez-vous ou créez votre compte"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {updatePasswordMode ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nouveau mot de passe
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choisissez un mot de passe sécurisé d'au moins 6 caractères
                  </p>
                </div>
                
                {/* Error Alert for Update Password */}
                {updatePasswordError && (
                  <Alert variant="destructive" className="mb-4">
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
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Vous recevrez un email avec un lien sécurisé pour réinitialiser votre mot de passe.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setResetMode(false)}
                >
                  Retour à la connexion
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Connexion</TabsTrigger>
                  <TabsTrigger value="signup">Inscription</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    {/* Error Alert */}
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
                          if (formError) setFormError(''); // Clear error when user types
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
                            if (formError) setFormError(''); // Clear error when user types
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
                    
                    {/* Forgot Password Link */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setResetMode(true)}
                        className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nom complet</Label>
                      <TextInput
                        id="fullName"
                        placeholder="Votre nom complet"
                        value={fullName}
                        onChange={setFullName}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre.email@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Numéro de téléphone</Label>
                      <NumericInput
                        id="phone"
                        placeholder="22501234567"
                        value={phone}
                        onChange={setPhone}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Pays
                      </Label>
                      <CountrySelect
                        value={country}
                        onValueChange={setCountry}
                        placeholder="Sélectionnez votre pays"
                      />
                      <p className="text-xs text-muted-foreground">
                       Ceci nous aide à personnaliser votre expérience et à vous proposer des produits adaptés à votre région.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Je souhaite</Label>
                      <RadioGroup
                        value={userRole}
                        onValueChange={(value: 'buyer' | 'seller') => setUserRole(value)}
                        className="grid grid-cols-1 gap-4"
                      >
                        <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="buyer" id="buyer" />
                          <Label htmlFor="buyer" className="flex items-center gap-3 cursor-pointer flex-1">
                            <ShoppingCart className="w-5 h-5 text-primary" />
                            <div>
                              <div className="font-medium">Acheter des produits</div>
                              <div className="text-sm text-muted-foreground">Accès au panier, commandes et favoris</div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="seller" id="seller" />
                          <Label htmlFor="seller" className="flex items-center gap-3 cursor-pointer flex-1">
                            <Store className="w-5 h-5 text-primary" />
                            <div>
                              <div className="font-medium">Vendre mes produits</div>
                              <div className="text-sm text-muted-foreground">Gérer mes produits et recevoir des commandes</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? "Création..." : "Créer un compte"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Reset Password Modal */}
        {resetMode && (
          <Card className="mt-4">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Réinitialiser le mot de passe</CardTitle>
              <CardDescription>
                Entrez votre adresse email pour recevoir un lien de réinitialisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetSuccess ? (
                <div className="text-center space-y-4 py-6">
                  <div className="text-6xl mb-4">📧</div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Email de réinitialisation envoyé !
                  </h3>
                  <p className="text-muted-foreground">
                    Consultez votre boîte email et cliquez sur le lien pour créer un nouveau mot de passe.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setResetMode(false);
                        setResetSuccess(false);
                        setResetEmail('');
                      }}
                      className="flex-1"
                    >
                      Retour à la connexion
                    </Button>
                    <Button
                      onClick={() => navigate('/')}
                      className="flex-1"
                    >
                      Retour à l'accueil
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* Error Alert for Reset Password */}
                  {resetFormError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{resetFormError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Adresse email</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="votre.email@exemple.com"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        if (resetFormError) setResetFormError(''); // Clear error when user types
                      }}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setResetMode(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={loading}
                    >
                      {loading ? "Envoi..." : "Envoyer le lien"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;