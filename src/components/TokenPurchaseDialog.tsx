import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePaystackPublicKey } from '@/hooks/usePaystackPublicKey';
import { formatFCFA } from '@/utils/commissionCalculator';

interface TokenPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseComplete: () => void;
}

interface RechargeOption {
  amount: number;
  label: string;
  popular?: boolean;
}

const rechargeOptions: RechargeOption[] = [
  { amount: 5000, label: '5 000 FCFA' },
  { amount: 10000, label: '10 000 FCFA', popular: true },
  { amount: 20000, label: '20 000 FCFA' },
  { amount: 50000, label: '50 000 FCFA' },
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
  const { publicKey: paystackPublicKey, loading: keyLoading, error: keyError } = usePaystackPublicKey();
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<RechargeOption | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('orange_money');
  const [step, setStep] = useState<'select_amount' | 'select_payment'>('select_amount');

  const handleSelectAmount = (opt: RechargeOption) => {
    setSelectedOption(opt);
    setStep('select_payment');
  };

  const handlePurchase = async () => {
    if (!user || !selectedOption) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'initialize_payment',
          user_id: user.id,
          email: user.email,
          amount: selectedOption.amount,
          payment_type: 'wallet_recharge',
          tokens_amount: 0,
          payment_method: selectedPayment,
        },
      });

      if (error) throw error;
      if (data && !data.success && data.status !== 'success') {
        throw new Error(data.error || 'Impossible d\'initialiser le paiement');
      }

      const serverReference = data.data?.reference;
      const authorizationUrl = data.data?.authorization_url;
      
      if (!serverReference || !authorizationUrl) {
        throw new Error('Données de paiement manquantes');
      }

      toast({
        title: 'Redirection vers Paystack...',
        description: 'Vous allez être redirigé vers la page de paiement sécurisée',
      });

      setTimeout(() => {
        window.location.href = authorizationUrl;
      }, 1000);

    } catch (error: any) {
      console.error('Error recharging wallet:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'initier le paiement',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('select_amount');
    setSelectedOption(null);
  };

  const hasKeyError = keyError || (!keyLoading && !paystackPublicKey);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setStep('select_amount');
        setSelectedOption(null);
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-6 w-6 text-primary" />
            {hasKeyError ? 'Configuration requise' : (step === 'select_amount' ? 'Recharger mon Compte Djassa' : 'Choisir le mode de paiement')}
          </DialogTitle>
        </DialogHeader>
        
        {hasKeyError ? (
          <div className="py-8 text-center space-y-4">
            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              <p className="text-destructive font-medium">
                {keyError || 'Veuillez configurer vos clés Paystack dans le super admin'}
              </p>
            </div>
          </div>
        ) : step === 'select_amount' ? (
          <div className="space-y-6 mt-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Choisissez le montant de recharge</h3>
              <p className="text-sm text-muted-foreground">
                Le solde sera ajouté à votre Compte Djassa
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {rechargeOptions.map((opt) => (
                <div
                  key={opt.amount}
                  onClick={() => handleSelectAmount(opt)}
                  className={`relative cursor-pointer border-2 rounded-2xl p-5 transition-all hover:border-primary hover:shadow-xl hover:scale-105
                    ${opt.popular ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md' : 'border-border bg-card hover:bg-accent/50'}`}
                >
                  {opt.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                      ⭐ Populaire
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Wallet className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{formatFCFA(opt.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-4 rounded-xl border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">À savoir :</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Votre solde couvre les commissions sur vos ventes</li>
                    <li>• La commission est prélevée après confirmation de commande</li>
                    <li>• En cas d'annulation, la commission est remboursée</li>
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
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Recharge Compte Djassa</p>
                    <p className="text-xs text-muted-foreground">Ajout au solde</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatFCFA(selectedOption?.amount || 0)}
                  </p>
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
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all hover:border-primary hover:shadow-lg hover:scale-[1.02]
                      ${selectedPayment === method.id ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-card'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 text-3xl">{method.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-base">{method.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                      </div>
                      {selectedPayment === method.id && (
                        <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <p className="text-xs text-center text-muted-foreground font-medium">
                🔒 Paiement 100% sécurisé • Solde crédité immédiatement après validation
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1" disabled={loading} size="lg">
                Retour
              </Button>
              <Button onClick={handlePurchase} disabled={loading || keyLoading} className="flex-1 bg-primary hover:bg-primary/90" size="lg">
                {loading || keyLoading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Traitement...</>
                ) : (
                  <>Payer {formatFCFA(selectedOption?.amount || 0)}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
