import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Check, CreditCard, Loader2 } from 'lucide-react';

interface PremiumUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumUpgradeDialog({ open, onOpenChange }: PremiumUpgradeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const features = [
    'Publier un nombre illimité de produits',
    'Accès aux outils de promotion avancés',
    'Support prioritaire',
    'Statistiques détaillées de vente',
    'Badge vendeur Premium visible'
  ];

  const handleUpgrade = async () => {
    if (!user?.email) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'initialize_payment',
          user_id: user.id,
          email: user.email,
          amount: 50000 // 500 NGN
        },
      });

      if (error) {
        console.error('Payment initialization error:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'initialiser le paiement",
          variant: "destructive",
        });
        return;
      }

      if (data?.data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        toast({
          title: "Erreur",
          description: "URL de paiement non reçue",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'initialisation du paiement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Passer en Premium
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-gray-900">500 NGN</span>
                  <span className="text-lg text-gray-600">/an</span>
                </div>
              </div>
              
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Accès Premium valable 1 an à partir de la date d'achat
            </p>
            <p className="text-xs text-muted-foreground">
              Paiement sécurisé via Paystack
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Plus tard
          </Button>
          <Button 
            onClick={handleUpgrade} 
            disabled={isLoading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirection...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Payer maintenant
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}