import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TokenPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseComplete: () => void;
}

interface TokenPackage {
  tokens: number;
  price: number;
  label: string;
}

const tokenPackages: TokenPackage[] = [
  { tokens: 5, price: 1000, label: '5 Jetons' },
  { tokens: 10, price: 2000, label: '10 Jetons' },
  { tokens: 20, price: 3500, label: '20 Jetons' },
  { tokens: 50, price: 8000, label: '50 Jetons' },
];

export const TokenPurchaseDialog = ({ open, onOpenChange, onPurchaseComplete }: TokenPurchaseDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);

  const handlePurchase = async (pkg: TokenPackage) => {
    if (!user) return;

    setLoading(true);
    setSelectedPackage(pkg);

    try {
      // Créer une transaction en attente
      const { data: transactionData, error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          seller_id: user.id,
          transaction_type: 'purchase',
          tokens_amount: pkg.tokens,
          price_paid: pkg.price,
          status: 'pending',
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Appeler Paystack pour initialiser le paiement
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'initialize_payment',
          amount: pkg.price,
          email: user.email,
          payment_type: 'tokens',
          tokens_amount: pkg.tokens,
        },
      });

      if (error) throw error;

      if (data?.authorization_url) {
        // Mettre à jour la transaction avec la référence Paystack
        await supabase
          .from('token_transactions')
          .update({ paystack_reference: data.reference })
          .eq('id', transactionData.id);

        // Rediriger vers Paystack
        window.location.href = data.authorization_url;
      }
    } catch (error: any) {
      console.error('Error purchasing tokens:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'initier le paiement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coins className="h-6 w-6 text-primary" />
            Acheter des Jetons
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground">
            Chaque jeton vous permet de publier un produit sur Djassa.
          </p>

          <div className="grid gap-3">
            {tokenPackages.map((pkg) => (
              <div
                key={pkg.tokens}
                className="border rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-lg">{pkg.label}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">
                    {pkg.price.toLocaleString()} FCFA
                  </span>
                </div>
                
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading}
                  className="w-full"
                  size="sm"
                >
                  {loading && selectedPackage?.tokens === pkg.tokens ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    'Acheter maintenant'
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg mt-4">
            <p className="text-xs text-muted-foreground">
              💡 Les jetons n'expirent jamais et peuvent être utilisés à tout moment pour publier vos produits.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
