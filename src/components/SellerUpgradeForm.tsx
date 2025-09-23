import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextInput, NumericInput } from '@/components/ui/validated-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Store } from 'lucide-react';

interface SellerUpgradeFormProps {
  onSuccess: () => void;
}

export const SellerUpgradeForm = ({ onSuccess }: SellerUpgradeFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Mettre à jour le profil avec les nouvelles informations
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Erreur lors de la mise à jour du profil:', profileError);
        toast({
          title: "❌ Erreur",
          description: "Impossible de mettre à jour votre profil.",
          variant: "destructive",
        });
        return;
      }

      // Ajouter le rôle vendeur
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'seller'
        });

      if (roleError && !roleError.message.includes('duplicate key')) {
        console.error('Erreur lors de l\'ajout du rôle vendeur:', roleError);
        toast({
          title: "❌ Erreur",
          description: "Impossible d'activer votre profil vendeur.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✅ Profil vendeur activé !",
        description: "Vous pouvez maintenant commencer à vendre vos produits. Vous bénéficiez de 28 jours d'essai gratuit.",
        duration: 3000,
      });

      // Redirection automatique vers l'espace vendeur
      setTimeout(() => {
        navigate('/seller-dashboard');
      }, 1500);

      onSuccess();
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
              <NumericInput
                id="phone"
                placeholder="22501234567"
                value={phone}
                onChange={setPhone}
                required
              />
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