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
  { tokens: 20, price: 3500, label: '20 Jetons' },
  { tokens: 50, price: 8000, label: '50 Jetons' },
];

type PaymentMethod = 'orange_money' | 'mtn_money' | 'moov_money' | 'wave_money' | 'card';

interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  icon: string;
  description: string;
}

const paymentMethods: PaymentMethodOption[] = [
  { id: 'orange_money', label: 'Orange Money CI', icon: '🟠', description: 'Paiement via Orange Money' },
  { id: 'mtn_money', label: 'MTN MoMo CI', icon: '🟡', description: 'Paiement via MTN Mobile Money' },
  { id: 'moov_money', label: 'Moov Money CI', icon: '🔵', description: 'Paiement via Moov Money' },
  { id: 'wave_money', label: 'Wave CI', icon: '💙', description: 'Paiement via Wave' },
  { id: 'card', label: 'Carte Bancaire', icon: '💳', description: 'Visa, Mastercard' },
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
          <div className="space-y-6 mt-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Choisissez votre pack de jetons</h3>
              <p className="text-sm text-muted-foreground">
                Publiez vos produits et boostez leur visibilité
              </p>
            </div>

            {/* Packs scrollables horizontalement sur mobile, grille sur desktop */}
            <div className="overflow-x-auto pb-4 -mx-2 px-2">
              <div className="flex gap-4 min-w-max md:grid md:grid-cols-2 lg:grid-cols-4 md:min-w-0">
                {tokenPackages.map((pkg) => (
                  <div
                    key={pkg.tokens}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`
                      relative cursor-pointer border-2 rounded-2xl p-5 transition-all
                      hover:border-primary hover:shadow-xl hover:scale-105 min-w-[170px] md:min-w-0
                      ${pkg.popular 
                        ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md' 
                        : 'border-border bg-card hover:bg-accent/50'
                      }
                    `}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                        ⭐ Populaire
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Coins className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-3xl text-primary">{pkg.tokens}</p>
                        <p className="text-xs text-muted-foreground font-medium">Jetons</p>
                      </div>
                      <div className="pt-3 border-t-2 w-full border-dashed border-border">
                        <p className="text-xl font-bold">
                          {pkg.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground font-semibold">FCFA</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-4 rounded-xl border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">À savoir :</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 1 jeton = 1 publication de produit</li>
                    <li>• 2 jetons = 1 boost de 7 jours</li>
                    <li>• Vos jetons n'expirent jamais</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Coins className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{selectedPackage?.label}</p>
                    <p className="text-xs text-muted-foreground">Pack de jetons</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {selectedPackage?.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-semibold">FCFA</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <span className="text-lg">💳</span>
                Choisissez votre mode de paiement
              </h4>
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`
                      cursor-pointer border-2 rounded-xl p-4 transition-all
                      hover:border-primary hover:shadow-md
                      ${selectedPayment === method.id 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border bg-card'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 text-3xl">{method.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-base">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                      {selectedPayment === method.id && (
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <div className="h-3 w-3 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                🔒 Paiement 100% sécurisé • Vos jetons seront ajoutés immédiatement après validation
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
                disabled={loading}
                size="lg"
              >
                Retour
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={loading}
                className="flex-1"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Redirection...
                  </>
                ) : (
                  <>
                    Payer {selectedPackage?.price.toLocaleString()} FCFA
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
