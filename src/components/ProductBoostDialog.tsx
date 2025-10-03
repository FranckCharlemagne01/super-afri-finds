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

  const BOOST_COST = 2;

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
      });

      if (error) throw error;

      if (data) {
        toast({
          title: 'Produit boosté !',
          description: `"${productTitle}" sera mis en avant pendant 7 jours dans les Meilleurs choix.`,
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
            <Zap className="h-6 w-6 text-primary" />
            Booster ce produit
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-semibold mb-2">{productTitle}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="h-4 w-4" />
              <span>Coût : {BOOST_COST} jetons</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Avantages du boost :</p>
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-sm">
                <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Meilleur positionnement</p>
                  <p className="text-muted-foreground">Affiché en priorité dans les Meilleurs choix</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Durée de 7 jours</p>
                  <p className="text-muted-foreground">Visibilité garantie pendant une semaine</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Votre solde actuel :</span>
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <Coins className="h-4 w-4" />
                <span>{currentTokens} jeton(s)</span>
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
                Boost en cours...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Booster pour {BOOST_COST} jetons
              </>
            )}
          </Button>

          {currentTokens < BOOST_COST && (
            <p className="text-xs text-center text-muted-foreground">
              Vous avez besoin de {BOOST_COST - currentTokens} jeton(s) supplémentaire(s)
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
