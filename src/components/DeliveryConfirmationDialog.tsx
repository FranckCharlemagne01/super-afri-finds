import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeliveryConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
  currentStock: number;
  onConfirm: () => void;
}

export const DeliveryConfirmationDialog = ({
  open,
  onOpenChange,
  productId,
  productTitle,
  currentStock,
  onConfirm,
}: DeliveryConfirmationDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirmDelivery = async () => {
    setLoading(true);
    try {
      console.log('✅ Confirmation de livraison pour produit:', productId);
      
      toast({
        title: "✅ Livraison confirmée",
        description: "Vous pourrez confirmer la vente depuis la commande",
      });

      onConfirm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("❌ Erreur lors de la confirmation:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de confirmer la livraison",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeepActive = async () => {
    if (!productId) {
      toast({
        title: "Erreur",
        description: "Produit invalide",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('📦 Réduction du stock pour produit:', productId, 'Stock actuel:', currentStock);
      
      const newStock = Math.max(0, currentStock - 1);
      
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", productId);

      if (error) {
        console.error('❌ Erreur mise à jour stock:', error);
        throw error;
      }

      console.log('✅ Stock mis à jour:', newStock);

      if (newStock === 0) {
        toast({
          title: "✅ Stock épuisé",
          description: `"${productTitle}" a été marqué comme vendu (stock à 0).`,
        });
      } else {
        toast({
          title: "✅ Stock mis à jour",
          description: `Stock restant : ${newStock}`,
        });
      }

      onConfirm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour du stock:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le stock",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-3xl border-2">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 text-green-600 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900 flex items-center justify-center shadow-sm">
              <CheckCircle className="h-7 w-7" />
            </div>
            <AlertDialogTitle className="text-xl md:text-2xl font-bold">
              🎉 Livraison confirmée !
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-4">
            <p className="text-sm md:text-base text-muted-foreground font-semibold bg-muted/50 p-3 rounded-xl">
              "{productTitle}"
            </p>
            <div className="p-4 bg-primary/10 border-2 border-primary/20 rounded-2xl shadow-sm">
              <p className="text-sm md:text-base font-bold text-foreground mb-2">
                ℹ️ Prochaine étape : Confirmation de vente
              </p>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Vous pourrez maintenant choisir de marquer le produit comme vendu ou de le garder actif depuis la page de la commande
              </p>
            </div>
            {currentStock > 1 && (
              <p className="text-sm md:text-base text-muted-foreground font-semibold">
                📦 Stock actuel : <span className="text-foreground">{currentStock} unités</span>
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleConfirmDelivery}
            disabled={loading}
            variant="default"
            className="w-full h-12 md:h-14 rounded-2xl font-bold text-sm md:text-base shadow-md hover:shadow-lg transition-all"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Confirmer la livraison
          </Button>
          
          {currentStock > 1 && (
            <Button
              onClick={handleKeepActive}
              disabled={loading}
              variant="outline"
              className="w-full h-12 md:h-14 rounded-2xl font-bold text-sm md:text-base shadow-md hover:shadow-lg transition-all"
            >
              <Package className="mr-2 h-5 w-5" />
              Réduire le stock (-1)
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
