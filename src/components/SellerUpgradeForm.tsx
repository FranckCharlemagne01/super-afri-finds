import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextInput } from '@/components/ui/validated-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { Store, Sparkles, Phone, User, Gift, Check, X, Loader2 } from 'lucide-react';

interface SellerUpgradeFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const SellerUpgradeForm = ({ onSuccess, onCancel }: SellerUpgradeFormProps) => {
  const { user } = useStableAuth();
  const { role, refreshRole } = useStableRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [sellerDataReady, setSellerDataReady] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const maxRetries = useRef(10);
  const retryCount = useRef(0);

  // ✅ Préparer les données vendeur AVANT la redirection (sans changer la logique métier)
  // Objectif: éviter l'ouverture du dashboard avec des données null/incomplètes.
  const prepareSellerData = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // 1) Exécuter systématiquement l'attribution côté DB (no-op si non éligible)
      await supabase.rpc('ensure_seller_trial_tokens', { _user_id: user.id });

      // 2) Attendre que la ligne seller_tokens soit lisible (et donc affichable dans le dashboard)
      //    On n'impose PAS un solde > 0 ici (la DB décide), on garantit juste la cohérence d'affichage.
      for (let i = 0; i < 10; i++) {
        const { data, error } = await supabase
          .from('seller_tokens')
          .select('token_balance, free_tokens_count, free_tokens_expires_at, paid_tokens_count')
          .eq('seller_id', user.id)
          .maybeSingle();

        if (!error && data) {
          return true;
        }

        // petit délai puis retry
        await new Promise((r) => setTimeout(r, 400));
      }

      // Si on ne voit toujours pas la row, on ne bloque pas indéfiniment la redirection
      return false;
    } catch (err) {
      console.log('[SellerUpgrade] prepareSellerData silent error:', err);
      return false;
    }
  }, [user?.id]);

  // Fonction pour vérifier le rôle avec retry
  const waitForRoleUpdate = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const checkRole = async () => {
        retryCount.current++;
        console.log(`[SellerUpgrade] Checking role update... attempt ${retryCount.current}`);

        await refreshRole();

        // Petit délai pour laisser le state se mettre à jour
        await new Promise(r => setTimeout(r, 300));

        // Vérifier directement en DB si le rôle a été mis à jour
        const { data, error } = await supabase.rpc('get_user_role', {
          _user_id: user?.id
        });

        if (!error && data === 'seller') {
          console.log('[SellerUpgrade] Role confirmed as seller');
          resolve(true);
          return;
        }

        if (retryCount.current < maxRetries.current) {
          console.log(`[SellerUpgrade] Role not yet seller, retrying in 500ms...`);
          setTimeout(checkRole, 500);
        } else {
          console.log('[SellerUpgrade] Max retries reached');
          resolve(false);
        }
      };

      checkRole();
    });
  }, [refreshRole, user?.id]);

  // Surveiller le changement de rôle après l'upgrade
  useEffect(() => {
    if (upgradeSuccess && role === 'seller' && !isRedirecting && sellerDataReady) {
      console.log('[SellerUpgrade] Role updated + data ready, proceeding with redirect');
      setIsRedirecting(true);
      onSuccess();

      // Délai pour s'assurer que tous les states sont synchronisés
      setTimeout(() => {
        navigate('/seller-dashboard', { replace: true });
      }, 300);
    }
  }, [upgradeSuccess, role, navigate, onSuccess, isRedirecting, sellerDataReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    retryCount.current = 0;

    try {
      console.log('[SellerUpgrade] Starting upgrade process...');
      
      const { data, error } = await supabase.rpc('upgrade_to_seller', {
        _first_name: firstName.trim(),
        _last_name: lastName.trim(),
        _phone: phone.trim()
      });

      if (error) {
        console.error('[SellerUpgrade] RPC error:', error);
        toast({
          title: "❌ Erreur",
          description: "Impossible d'activer votre profil vendeur. Veuillez réessayer.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const result = data as { success: boolean; error?: string; message?: string };
      if (!result?.success) {
        console.error('[SellerUpgrade] Function error:', result?.error);
        toast({
          title: "❌ Erreur",
          description: result?.error || "Une erreur s'est produite lors de l'activation.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('[SellerUpgrade] RPC success, waiting for role update...');

      toast({
        title: "✅ Profil vendeur activé !",
        description: "Préparation de votre tableau de bord...",
        duration: 3000,
      });

      // Attendre que le rôle soit mis à jour
      const roleUpdated = await waitForRoleUpdate();

      // ✅ Préparer les données vendeur avant toute redirection
      // (RPC ensure_seller_trial_tokens + lecture seller_tokens)
      const ready = await prepareSellerData();
      setSellerDataReady(true);

      if (roleUpdated) {
        setUpgradeSuccess(true);
      } else {
        // Forcer quand même la redirection après les retries (comportement existant)
        // mais uniquement après la tentative de préparation des données.
        console.log('[SellerUpgrade] Forcing redirect after max retries');
        setUpgradeSuccess(true);

        // Si, pour une raison quelconque, role state ne se met pas à 'seller',
        // on garde le fallback de navigation directe (comme avant).
        if (!ready) {
          console.log('[SellerUpgrade] Data not fully ready, continuing with fallback redirect');
        }
        setIsRedirecting(true);
        onSuccess();
        navigate('/seller-dashboard', { replace: true });
      }
    } catch (error) {
      console.error('[SellerUpgrade] Unexpected error:', error);
      toast({
        title: "❌ Erreur",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Afficher un écran de transition pendant la redirection
  if (isRedirecting) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center p-6">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-xl shadow-primary/30 mb-6">
          <Store className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Préparation de votre boutique</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Veuillez patienter...
        </p>
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header mobile-app style */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/50 px-4 py-3 flex items-center justify-between">
        {onCancel && (
          <button 
            onClick={onCancel}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/50 active:bg-muted transition-colors -ml-2"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
        <div className="flex-1 text-center">
          <h2 className="text-lg font-semibold text-foreground">Devenir vendeur</h2>
        </div>
        {onCancel && <div className="w-10" />}
      </div>

      {/* Content scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-6 space-y-6">
          {/* Hero section */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Store className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">Lancez votre boutique</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Vendez vos produits et touchez des milliers de clients
              </p>
            </div>
          </div>

          {/* Trial badge */}
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full mx-auto w-fit">
            <Gift className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">28 jours d'essai gratuit</span>
            <Sparkles className="w-4 h-4 text-green-600" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Prénom */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Prénom
              </Label>
              <TextInput
                id="firstName"
                placeholder="Votre prénom"
                value={firstName}
                onChange={setFirstName}
                className="w-full h-12 rounded-xl text-base px-4 bg-muted/30 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Nom
              </Label>
              <TextInput
                id="lastName"
                placeholder="Votre nom de famille"
                value={lastName}
                onChange={setLastName}
                className="w-full h-12 rounded-xl text-base px-4 bg-muted/30 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Numéro de téléphone
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="+225 07 07 07 07 07"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^(\+|0{0,2})[0-9\s]*$/.test(value)) {
                    setPhone(value);
                  }
                }}
                className="w-full h-12 rounded-xl text-base px-4 bg-muted/30 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
                maxLength={20}
              />
            </div>

            {/* Nom boutique */}
            <div className="space-y-2">
              <Label htmlFor="shopName" className="text-sm font-medium flex items-center gap-2">
                <Store className="w-4 h-4 text-muted-foreground" />
                Nom de la boutique
                <span className="text-xs text-muted-foreground/70">(optionnel)</span>
              </Label>
              <Input
                id="shopName"
                type="text"
                placeholder="Ma Super Boutique"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full h-12 rounded-xl text-base px-4 bg-muted/30 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Par défaut : "Boutique {firstName || 'Prénom'} {lastName || 'Nom'}"
              </p>
            </div>

            {/* Avantages */}
            <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                Avantages inclus
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'Publication illimitée de produits',
                  'Gestion des commandes',
                  'Messagerie avec les clients',
                  'Tableau de bord vendeur',
                  'Conservez vos droits d\'acheteur'
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer fixe avec bouton */}
      <div className="sticky bottom-0 bg-background border-t border-border/50 px-5 py-4 pb-safe">
        <Button 
          type="submit"
          onClick={handleSubmit}
          className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
          disabled={loading || !firstName || !lastName || !phone}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Activation en cours...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Activer mon profil vendeur
            </span>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3">
          En continuant, vous acceptez nos conditions de vente
        </p>
      </div>
    </div>
  );
};
