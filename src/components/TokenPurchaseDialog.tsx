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
  popular?: boolean;
}

const tokenPackages: TokenPackage[] = [
  { tokens: 5, price: 1000, label: '5 Jetons' },
  { tokens: 12, price: 2000, label: '12 Jetons', popular: true },
  { tokens: 25, price: 3500, label: '25 Jetons' },
  { tokens: 60, price: 7000, label: '60 Jetons' },
];

type PaymentMethod = 'orange_money' | 'mtn_money' | 'moov_money' | 'card';

interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  icon: string;
}

const paymentMethods: PaymentMethodOption[] = [
  { id: 'orange_money', label: 'Orange Money', icon: '🟠' },
  { id: 'mtn_money', label: 'MTN Money', icon: '🟡' },
  { id: 'moov_money', label: 'Moov Money', icon: '🔵' },
  { id: 'card', label: 'Carte Bancaire', icon: '💳' },
];

export const TokenPurchaseDialog = ({ open, onOpenChange, onPurchaseComplete }: TokenPurchaseDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('orange_money');
  const [step, setStep] = useState<'select_package' | 'select_payment'>('select_package');

  const handleSelectPackage = (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setStep('select_payment');
  };

  const handlePurchase = async () => {
    if (!user || !selectedPackage) return;

    setLoading(true);

    try {
      // Créer une transaction en attente
      const { data: transactionData, error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          seller_id: user.id,
          transaction_type: 'purchase',
          tokens_amount: selectedPackage.tokens,
          price_paid: selectedPackage.price,
          payment_method: selectedPayment,
          status: 'pending',
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Appeler Paystack pour initialiser le paiement
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'initialize_payment',
          amount: selectedPackage.price,
          email: user.email,
          payment_type: 'tokens',
          tokens_amount: selectedPackage.tokens,
          payment_method: selectedPayment,
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
    }
  };

  const handleBack = () => {
    setStep('select_package');
    setSelectedPackage(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setStep('select_package');
        setSelectedPackage(null);
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coins className="h-6 w-6 text-primary" />
            {step === 'select_package' ? 'Acheter des Jetons' : 'Choisir le mode de paiement'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'select_package' ? (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Chaque jeton vous permet de publier un produit. 2 jetons = 1 boost (7 jours).
            </p>

            {/* Packs scrollables horizontalement sur mobile */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max md:grid md:grid-cols-2 lg:grid-cols-4">
                {tokenPackages.map((pkg) => (
                  <div
                    key={pkg.tokens}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`
                      relative cursor-pointer border-2 rounded-xl p-4 transition-all
                      hover:border-primary hover:shadow-lg min-w-[160px] md:min-w-0
                      ${pkg.popular ? 'border-primary bg-primary/5' : 'border-border'}
                    `}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-semibold">
                        Populaire
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Coins className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-bold text-2xl">{pkg.tokens}</p>
                        <p className="text-xs text-muted-foreground">Jetons</p>
                      </div>
                      <div className="pt-2 border-t w-full">
                        <p className="text-lg font-bold text-primary">
                          {pkg.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">FCFA</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 Les jetons n'expirent jamais et peuvent être utilisés pour publier vos produits ou les booster.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{selectedPackage?.label}</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {selectedPackage?.price.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-3">Choisissez votre mode de paiement :</p>
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`
                      cursor-pointer border-2 rounded-lg p-4 transition-all
                      hover:border-primary
                      ${selectedPayment === method.id ? 'border-primary bg-primary/5' : 'border-border'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-medium">{method.label}</span>
                      {selectedPayment === method.id && (
                        <div className="ml-auto h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Retour
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  'Confirmer le paiement'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
