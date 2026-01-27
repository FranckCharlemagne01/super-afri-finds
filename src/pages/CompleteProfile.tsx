import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MapPin, ShoppingBag, Store, Sparkles, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CountrySelect } from '@/components/CountrySelect';
import { CitySelect } from '@/components/CitySelect';
import { toast } from '@/hooks/use-toast';
import { completeGoogleUserProfile } from '@/hooks/useProfileCompletion';

type Step = 'location' | 'objective';
type Objective = 'buyer' | 'seller';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('location');
  
  // Form data
  const [country, setCountry] = useState('CI');
  const [city, setCity] = useState('');
  const [objective, setObjective] = useState<Objective | null>(null);
  const [shopName, setShopName] = useState('');

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('[CompleteProfile] No session, redirecting to auth');
        navigate('/auth', { replace: true });
        return;
      }

      setUserId(session.user.id);
      setCheckingAuth(false);

      // Pré-remplir le nom de la boutique avec le nom de l'utilisateur
      const fullName = session.user.user_metadata?.full_name || 
                       session.user.user_metadata?.name || '';
      if (fullName) {
        setShopName(`Boutique ${fullName.split(' ')[0]}`);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLocationNext = useCallback(() => {
    if (!city.trim()) {
      toast({
        title: "Ville requise",
        description: "Veuillez sélectionner votre ville",
        variant: "destructive",
      });
      return;
    }
    setStep('objective');
  }, [city]);

  const handleSubmit = useCallback(async () => {
    if (!userId || !objective) return;

    if (objective === 'seller' && !shopName.trim()) {
      toast({
        title: "Nom de boutique requis",
        description: "Veuillez entrer le nom de votre boutique",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await completeGoogleUserProfile(userId, {
        country,
        city,
        objective,
        shopName: objective === 'seller' ? shopName : undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "🎉 Profil complété !",
        description: objective === 'seller' 
          ? "Bienvenue vendeur ! Vous avez 50 jetons gratuits pour démarrer."
          : "Bienvenue sur Djassa ! Découvrez nos produits.",
      });

      // Rediriger vers la bonne page
      const redirectPath = objective === 'seller' ? '/seller-dashboard' : '/';
      navigate(redirectPath, { replace: true });

    } catch (error) {
      console.error('[CompleteProfile] Submit error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, country, city, objective, shopName, navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/f5b1043e-2d80-47f4-bc73-a58dfe091db1.png" 
              alt="Djassa Logo" 
              className="h-14 w-auto"
            />
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-4">
            <div className={`h-2 w-16 rounded-full transition-colors ${step === 'location' ? 'bg-primary' : 'bg-primary'}`} />
            <div className={`h-2 w-16 rounded-full transition-colors ${step === 'objective' ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          <CardTitle className="text-xl md:text-2xl font-bold">
            {step === 'location' ? (
              <span className="gradient-text-primary">📍 Où êtes-vous ?</span>
            ) : (
              <span className="gradient-text-primary">🎯 Votre objectif</span>
            )}
          </CardTitle>
          <CardDescription className="mt-2">
            {step === 'location' 
              ? "Aidez-nous à personnaliser votre expérience"
              : "Comment souhaitez-vous utiliser Djassa ?"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <AnimatePresence mode="wait">
            {step === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Country select */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Pays
                  </Label>
                  <CountrySelect value={country} onValueChange={setCountry} />
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
                    onValueChange={setCity}
                    placeholder="Sélectionnez votre ville"
                  />
                </div>

                <Button
                  onClick={handleLocationNext}
                  className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                  disabled={!city}
                >
                  Continuer
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {step === 'objective' && (
              <motion.div
                key="objective"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Objective cards */}
                <div className="grid gap-3">
                  {/* Buyer card */}
                  <motion.button
                    type="button"
                    onClick={() => setObjective('buyer')}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      objective === 'buyer'
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg ${objective === 'buyer' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Je veux acheter</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Découvrir et acheter des produits locaux
                        </p>
                      </div>
                      {objective === 'buyer' && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </motion.button>

                  {/* Seller card */}
                  <motion.button
                    type="button"
                    onClick={() => setObjective('seller')}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      objective === 'seller'
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Popular badge */}
                    <div className="absolute -top-2 right-3">
                      <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-primary to-primary/70 text-primary-foreground rounded-full shadow-sm">
                        Populaire
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg ${objective === 'seller' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Je veux vendre</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Créer ma boutique et vendre mes produits
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">50 jetons offerts</span>
                        </div>
                      </div>
                      {objective === 'seller' && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </motion.button>
                </div>

                {/* Shop name input (only for sellers) */}
                <AnimatePresence>
                  {objective === 'seller' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Store className="w-4 h-4 text-muted-foreground" />
                        Nom de votre boutique
                      </Label>
                      <Input
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="Ex: Boutique Aminata"
                        className="h-12"
                        maxLength={50}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('location')}
                    className="flex-1 h-12 rounded-xl"
                    disabled={loading}
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-[2] h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                    disabled={!objective || loading || (objective === 'seller' && !shopName.trim())}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        Commencer
                        <Sparkles className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Trust badge */}
                <p className="text-xs text-center text-muted-foreground mt-4">
                  🔒 Vos données restent confidentielles
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
