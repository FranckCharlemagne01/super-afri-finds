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
      // Ne plus marquer automatiquement comme vendu
      // Le vendeur doit confirmer manuellement via la commande
      toast({
        title: "Livraison confirmée",
        description: "Vous pourrez confirmer la vente depuis la commande",
      });

      onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de confirmer la livraison",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeepActive = async () => {
    setLoading(true);
    try {
      const newStock = Math.max(0, currentStock - 1);
      
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", productId);

      if (error) throw error;

      if (newStock === 0) {
        toast({
          title: "Stock épuisé",
          description: `"${productTitle}" a été marqué comme vendu (stock à 0).`,
        });
      } else {
        toast({
          title: "Stock mis à jour",
          description: `Stock restant : ${newStock}`,
        });
      }

      onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du stock:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le stock",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle className="h-6 w-6" />
            <AlertDialogTitle className="text-xl">
              🎉 Livraison confirmée !
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3">
            <p className="text-sm text-muted-foreground">
              "{productTitle}"
            </p>
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-foreground">
                ℹ️ La confirmation de vente se fait maintenant depuis la commande
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Vous pourrez choisir de marquer le produit comme vendu ou de le garder actif
              </p>
            </div>
            {currentStock > 1 && (
              <p className="text-sm text-muted-foreground">
                Stock actuel : {currentStock} unités
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={handleConfirmDelivery}
            disabled={loading}
            variant="default"
            className="w-full"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirmer la livraison
          </Button>
          
          {currentStock > 1 && (
            <Button
              onClick={handleKeepActive}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <Package className="mr-2 h-4 w-4" />
              Réduire le stock (-1)
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
