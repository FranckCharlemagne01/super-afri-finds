import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePaystackPublicKey } from '@/hooks/usePaystackPublicKey';

interface TokenPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseComplete: () => void;
}

const quickAmounts = [1000, 2000, 5000, 10000];

const formatFCFA = (amount: number) =>
  new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

export const TokenPurchaseDialog = ({ open, onOpenChange, onPurchaseComplete }: TokenPurchaseDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { loading: keyLoading, error: keyError, publicKey } = usePaystackPublicKey();
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const amount = parseInt(customAmount, 10) || 0;
  const isValid = amount >= 500;
  const hasKeyError = keyError || (!keyLoading && !publicKey);

  const handlePay = async () => {
    if (!user || !isValid) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'initialize_payment',
          user_id: user.id,
          email: user.email,
          amount,
          payment_type: 'wallet_recharge',
          tokens_amount: 0,
        },
      });

      if (error) {
        console.error('Edge function invoke error:', error);
        throw new Error("Impossible de contacter le service de paiement");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Impossible d'initialiser le paiement");
      }

      const authorizationUrl = data?.data?.authorization_url;
      if (!authorizationUrl) throw new Error('URL de paiement manquante');

      toast({
        title: 'Redirection vers Paystack...',
        description: 'Choisissez votre moyen de paiement sur la page sécurisée',
      });

      setTimeout(() => {
        window.location.href = authorizationUrl;
      }, 800);
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({
        title: 'Erreur',
        description: err.message || "Impossible d'initier le paiement",
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const selectQuickAmount = (val: number) => {
    setCustomAmount(String(val));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setCustomAmount('');
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            Recharger mon Compte Djassa
          </DialogTitle>
        </DialogHeader>

        {hasKeyError ? (
          <div className="py-8 text-center space-y-3">
            <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20">
              <p className="text-destructive text-sm font-medium">
                {keyError || 'Configuration Paystack requise. Contactez l\'administrateur.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            {/* Quick amounts */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Montant rapide</p>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => selectQuickAmount(val)}
                    className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border-2 active:scale-95
                      ${amount === val
                        ? 'border-primary bg-primary/10 text-primary shadow-md'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                      }`}
                  >
                    {new Intl.NumberFormat('fr-FR').format(val)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount input */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Ou saisissez un montant</p>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Ex : 3000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min={500}
                  className="text-lg font-semibold pr-16 rounded-xl"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  FCFA
                </span>
              </div>
              {customAmount && !isValid && (
                <p className="text-xs text-destructive">Montant minimum : 500 FCFA</p>
              )}
            </div>

            {/* Summary */}
            {isValid && (
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Montant à payer</span>
                  <span className="text-xl font-bold text-primary">{formatFCFA(amount)}</span>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="flex items-start gap-2.5 p-3 bg-muted/50 rounded-xl">
              <span className="text-lg">💡</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paystack vous proposera les options de paiement disponibles (Orange Money, MTN, Wave, carte bancaire). Choisissez et confirmez directement.
              </p>
            </div>

            {/* Pay button */}
            <Button
              onClick={handlePay}
              disabled={!isValid || loading || keyLoading}
              className="w-full h-13 text-base font-semibold rounded-xl shadow-lg"
              size="lg"
            >
              {loading || keyLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>Payer {isValid ? formatFCFA(amount) : ''}</>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              🔒 Paiement sécurisé via Paystack
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
