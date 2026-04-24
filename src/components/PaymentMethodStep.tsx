import { Button } from '@/components/ui/button';
import { Shield, Banknote, ArrowLeft, Lock, Zap, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import type { PaymentMethod } from '@/hooks/useOrders';

interface PaymentMethodStepProps {
  totalAmount: number;
  onBack: () => void;
  onSelect: (method: PaymentMethod) => void;
  isProcessing?: boolean;
}

/**
 * Étape de sélection du mode de paiement.
 * Affichée juste avant la validation finale de la commande.
 */
export const PaymentMethodStep = ({
  totalAmount,
  onBack,
  onSelect,
  isProcessing = false,
}: PaymentMethodStepProps) => {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 bg-primary px-4 py-3 flex items-center gap-3 safe-area-inset-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={isProcessing}
          className="h-10 w-10 rounded-full hover:bg-white/20 text-primary-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-base font-bold text-primary-foreground">Mode de paiement</h2>
          <p className="text-xs text-primary-foreground/70">Choisissez comment payer</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">
        {/* Récap montant */}
        <div className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl border border-border/50">
          <span className="text-sm font-medium text-muted-foreground">Total à payer</span>
          <span className="text-xl font-bold text-primary tabular-nums">
            {totalAmount.toLocaleString('fr-FR')} FCFA
          </span>
        </div>

        {/* Option 1 — Paiement en ligne (recommandé) */}
        <button
          type="button"
          onClick={() => onSelect('ONLINE')}
          disabled={isProcessing}
          className="w-full text-left rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 p-4 active:scale-[0.98] transition-transform disabled:opacity-60 relative overflow-hidden"
        >
          <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Recommandé
          </span>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-lg">
              <Lock className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0 pr-16">
              <h3 className="text-base font-bold text-foreground mb-1">
                🔒 Paiement en ligne
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Mobile Money, Carte bancaire (via Paystack)
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-foreground/80">
                  <ShieldCheck className="h-3.5 w-3.5 text-success flex-shrink-0" />
                  <span>Paiement 100% sécurisé</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/80">
                  <Zap className="h-3.5 w-3.5 text-success flex-shrink-0" />
                  <span>Traitement instantané</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/80">
                  <Shield className="h-3.5 w-3.5 text-success flex-shrink-0" />
                  <span>Protection acheteur Djassa</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-primary/20 flex items-center justify-center gap-2 text-sm font-bold text-primary">
            Payer maintenant
            <Lock className="h-4 w-4" />
          </div>
        </button>

        {/* Option 2 — Paiement à la livraison */}
        <button
          type="button"
          onClick={() => onSelect('COD')}
          disabled={isProcessing}
          className="w-full text-left rounded-2xl border-2 border-border bg-card p-4 active:scale-[0.98] transition-transform hover:border-foreground/20 disabled:opacity-60"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted text-foreground flex items-center justify-center flex-shrink-0">
              <Banknote className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground mb-1">
                💵 Paiement à la livraison
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Réglez en espèces lors de la réception
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-foreground/80">
                  <Banknote className="h-3.5 w-3.5 text-foreground/60 flex-shrink-0" />
                  <span>Paiement à réception du colis</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/80">
                  <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <span>Peut entraîner des délais</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/80">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <span>Confirmation par le vendeur requise</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-center gap-2 text-sm font-bold text-foreground">
            Payer à la livraison
            <Banknote className="h-4 w-4" />
          </div>
        </button>

        <p className="text-[11px] text-center text-muted-foreground px-4 leading-relaxed">
          En validant, vous acceptez les conditions de Djassa.
          Vos paiements en ligne sont sécurisés par Paystack.
        </p>
      </div>
    </div>
  );
};
