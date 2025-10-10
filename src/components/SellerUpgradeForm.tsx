import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextInput, NumericInput } from '@/components/ui/validated-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { Store } from 'lucide-react';

interface SellerUpgradeFormProps {
  onSuccess: () => void;
}

export const SellerUpgradeForm = ({ onSuccess }: SellerUpgradeFormProps) => {
  const { user } = useStableAuth();
  const { role, refreshRole } = useStableRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');

  // Surveiller le changement de rôle après l'upgrade
  useEffect(() => {
    if (upgradeSuccess && role === 'seller') {
      // Le rôle a été confirmé comme 'seller', navigation sûre
      onSuccess();
      // Utiliser un petit délai pour garantir la stabilité de la session
      setTimeout(() => {
        navigate('/seller-dashboard', { replace: true });
      }, 100);
    }
  }, [upgradeSuccess, role, navigate, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Utiliser la fonction sécurisée pour l'upgrade vendeur
      const { data, error } = await supabase.rpc('upgrade_to_seller', {
        _first_name: firstName.trim(),
        _last_name: lastName.trim(),
        _phone: phone.trim()
      });

      if (error) {
        console.error('Erreur lors de l\'upgrade vendeur:', error);
        toast({
          title: "❌ Erreur",
          description: "Impossible d'activer votre profil vendeur. Veuillez réessayer.",
          variant: "destructive",
        });
        return;
      }

      // Vérifier le résultat de la fonction
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result?.success) {
        console.error('Erreur retournée par la fonction:', result?.error);
        toast({
          title: "❌ Erreur",
          description: result?.error || "Une erreur s'est produite lors de l'activation.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✅ Profil vendeur activé !",
        description: "Vous pouvez maintenant commencer à vendre vos produits. Vous bénéficiez de 28 jours d'essai gratuit.",
        duration: 3000,
      });

      // Marquer l'upgrade comme réussi et rafraîchir le rôle
      setUpgradeSuccess(true);
      refreshRole();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "❌ Erreur",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl gradient-text-primary">Devenir vendeur</CardTitle>
          <CardDescription>
            Complétez vos informations pour activer votre profil vendeur et profiter de 28 jours d'essai gratuit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <TextInput
                id="firstName"
                placeholder="Votre prénom"
                value={firstName}
                onChange={setFirstName}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <TextInput
                id="lastName"
                placeholder="Votre nom de famille"
                value={lastName}
                onChange={setLastName}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone *</Label>
              <Input
                id="phone"
                type="text"
                placeholder="+225 0707070707"
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
              />
              <p className="text-xs text-muted-foreground">Format: +225 0707070707 ou 0707070707</p>
            </div>

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
                Si vide, votre boutique s'appellera "Boutique {firstName} {lastName}" ou "Djassa Boutique" par défaut.
              </p>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Email :</strong> {user?.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Votre email actuel sera conservé
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                🎁 Avantages inclus :
              </h4>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li>• 28 jours d'essai gratuit</li>
                <li>• Publication illimitée de produits</li>
                <li>• Gestion des commandes</li>
                <li>• Messagerie avec les clients</li>
                <li>• Conservez vos droits d'acheteur</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Activation en cours..." : "Activer mon profil vendeur"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};