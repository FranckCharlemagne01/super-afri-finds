import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Coins, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProductBoostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
  currentTokens: number;
  onBoostComplete: () => void;
}

export const ProductBoostDialog = ({ 
  open, 
  onOpenChange, 
  productId, 
  productTitle,
  currentTokens,
  onBoostComplete 
}: ProductBoostDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(168); // Default 7 days

  const BOOST_COST = 2;

  const durationOptions = [
    { label: '24 heures', hours: 24, description: 'Boost court pour un effet immédiat' },
    { label: '3 jours', hours: 72, description: 'Idéal pour les promotions courtes' },
    { label: '7 jours', hours: 168, description: 'Maximum de visibilité pendant une semaine' },
  ];

  const handleBoost = async () => {
    if (!user) return;

    if (currentTokens < BOOST_COST) {
      toast({
        title: 'Jetons insuffisants',
        description: `Il vous faut ${BOOST_COST} jetons pour booster ce produit. Vous avez ${currentTokens} jeton(s).`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('boost_product', {
        _seller_id: user.id,
        _product_id: productId,
        _duration_hours: selectedDuration,
      });

      if (error) throw error;

      if (data) {
        const durationLabel = durationOptions.find(d => d.hours === selectedDuration)?.label || '7 jours';
        toast({
          title: 'Produit boosté !',
          description: `"${productTitle}" sera mis en avant pendant ${durationLabel} dans les Offres Spéciales.`,
        });
        onBoostComplete();
        onOpenChange(false);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de booster ce produit. Vérifiez votre solde de jetons.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error boosting product:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-primary/10 p-2 rounded-full">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            Booster mon produit
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20">
            <p className="font-bold text-lg mb-2">{productTitle}</p>
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-5 w-5 text-primary" />
              <span className="font-semibold">Coût : {BOOST_COST} jetons</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Choisissez la durée du boost
            </h4>
            <div className="space-y-2">
              {durationOptions.map((option) => (
                <button
                  key={option.hours}
                  onClick={() => setSelectedDuration(option.hours)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedDuration === option.hours
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-accent/30 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{option.label}</span>
                    {selectedDuration === option.hours && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <span className="text-lg">⚡</span>
              Avantages du boost
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-3 rounded-xl bg-accent/50 border border-border">
                <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Meilleur positionnement</p>
                  <p className="text-xs text-muted-foreground">
                    Affiché en priorité dans les "Offres Spéciales"
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-4 rounded-xl border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Votre solde actuel</span>
              <div className="flex items-center gap-2 text-primary">
                <Coins className="h-5 w-5" />
                <span className="font-bold text-lg">{currentTokens} jeton{currentTokens > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleBoost}
            disabled={loading || currentTokens < BOOST_COST}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Activation du boost...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Booster pour {BOOST_COST} jetons
              </>
            )}
          </Button>

          {currentTokens < BOOST_COST && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              <p className="text-xs text-center text-destructive font-medium">
                ⚠️ Vous avez besoin de {BOOST_COST - currentTokens} jeton{(BOOST_COST - currentTokens) > 1 ? 's' : ''} supplémentaire{(BOOST_COST - currentTokens) > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
