import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, MapPin, Package, DollarSign, Calendar, CheckCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeliveryConfirmationDialog } from '@/components/DeliveryConfirmationDialog';

interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_location: string;
  product_id: string;
  product_title: string;
  product_price: number;
  quantity: number;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  is_confirmed_by_seller?: boolean;
}

interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: () => void;
}

const statusColors = {
  pending: 'destructive',
  confirmed: 'default',
  processing: 'secondary',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
} as const;

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const OrderDetailDialog = ({ order, open, onOpenChange, onOrderUpdated }: OrderDetailDialogProps) => {
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [productStock, setProductStock] = useState(0);
  const [confirmingSale, setConfirmingSale] = useState(false);

  if (!order) return null;

  const updateOrderStatus = async (newStatus: string) => {
    // Si le statut passe à "delivered", afficher la modale de confirmation
    if (newStatus === 'delivered') {
      setUpdatingStatus(true);
      try {
        // Récupérer le stock du produit
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', order.product_id)
          .single();

        if (productError) throw productError;

        setProductStock(productData?.stock_quantity || 0);
        
        // D'abord mettre à jour le statut de la commande
        const { error } = await supabase
          .rpc('update_order_status', {
            order_id: order.id,
            new_status: newStatus
          });

        if (error) throw error;

        // Puis afficher la modale de confirmation
        setShowDeliveryConfirm(true);
        setUpdatingStatus(false);
      } catch (error) {
        console.error('Error updating order status:', error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut",
          variant: "destructive",
        });
        setUpdatingStatus(false);
      }
      return;
    }

    // Pour les autres statuts, mise à jour normale
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .rpc('update_order_status', {
          order_id: order.id,
          new_status: newStatus
        });

      if (error) throw error;

      toast({
        title: "✅ Statut mis à jour",
        description: `La commande a été marquée comme "${statusLabels[newStatus as keyof typeof statusLabels]}"`,
      });

      onOrderUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmSale = async (markAsSold: boolean = true) => {
    setConfirmingSale(true);
    
    try {
      const { data, error } = await supabase.rpc('confirm_sale_by_seller', {
        _order_id: order.id,
        _mark_product_as_sold: markAsSold
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (result.success) {
        toast({
          title: "Vente confirmée",
          description: markAsSold 
            ? "Le produit est maintenant marqué comme vendu" 
            : "Vente confirmée, le produit reste actif",
        });
        onOrderUpdated();
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Erreur lors de la confirmation');
      }
    } catch (error: any) {
      console.error('Error confirming sale:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de confirmer la vente",
        variant: "destructive",
      });
    } finally {
      setConfirmingSale(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-sm sm:text-base">Commande #{order.id.slice(-8)}</span>
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {statusLabels[order.status as keyof typeof statusLabels]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Date de commande */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>
              Commande passée le {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </span>
          </div>

          {/* Informations produit */}
          <div className="p-3 sm:p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="font-semibold text-sm sm:text-lg">Produit Commandé</h3>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm sm:text-base">{order.product_title}</p>
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>Quantité: {order.quantity}</span>
                <span>Prix unitaire: {order.product_price.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Informations client */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h3 className="text-sm sm:text-lg font-semibold">Informations Client</h3>
            </div>

            {/* Nom et prénom */}
            <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-primary rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    Nom et Prénom du Client
                  </label>
                  <p className="text-xl font-bold text-foreground">
                    {order.customer_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Téléphone et Total */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Numéro de téléphone */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-200 rounded-lg">
                    <Phone className="h-5 w-5 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-green-700 uppercase tracking-wider mb-1">
                      Téléphone
                    </label>
                    <p className="text-lg font-bold text-green-900 break-all">
                      {order.customer_phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-200 rounded-lg">
                    <DollarSign className="h-5 w-5 text-orange-700" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">
                      Total
                    </label>
                    <div className="space-y-1">
                      <p className="text-xs text-orange-600">
                        {order.quantity} × {order.product_price.toLocaleString()} FCFA
                      </p>
                      <p className="text-xl font-bold text-orange-900">
                        {order.total_amount.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Adresse de livraison */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                    Adresse de Livraison Complète
                  </label>
                  <div className="bg-white/60 p-3 rounded border border-blue-300/30">
                    <p className="text-base font-medium text-blue-900 whitespace-pre-wrap break-words">
                      {order.delivery_location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Changement de statut */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Gestion de la Commande</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Mettre à jour le statut:</label>
              <Select
                value={order.status}
                onValueChange={updateOrderStatus}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmée</SelectItem>
                  <SelectItem value="processing">En préparation</SelectItem>
                  <SelectItem value="shipped">Expédiée</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => updateOrderStatus('confirmed')} 
                disabled={updatingStatus || order.status === 'confirmed'}
                className="flex-1"
                variant={order.status === 'confirmed' ? 'secondary' : 'default'}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {order.status === 'confirmed' ? 'Confirmée' : 'Confirmer'}
              </Button>
              <Button 
                onClick={() => updateOrderStatus('shipped')} 
                disabled={updatingStatus || order.status === 'shipped'}
                className="flex-1"
                variant={order.status === 'shipped' ? 'secondary' : 'outline'}
              >
                <Package className="h-4 w-4 mr-2" />
                {order.status === 'shipped' ? 'Expédiée' : 'Expédier'}
              </Button>
            </div>
          </div>

          {/* Bouton de confirmation de vente après livraison */}
          {order.status === 'delivered' && !order.is_confirmed_by_seller && (
            <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-success mb-1">
                    Commande livrée - Confirmation requise
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Le produit a été livré au client. Veuillez confirmer la vente pour marquer le produit comme vendu.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => handleConfirmSale(true)}
                  disabled={confirmingSale}
                  className="flex-1"
                  variant="default"
                >
                  {confirmingSale ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Confirmer la vente
                </Button>
                <Button
                  onClick={() => handleConfirmSale(false)}
                  disabled={confirmingSale}
                  variant="outline"
                  className="flex-1"
                >
                  Confirmer sans marquer vendu
                </Button>
              </div>
            </div>
          )}

          {/* Badge de vente confirmée */}
          {order.status === 'delivered' && order.is_confirmed_by_seller && (
            <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">
                Vente confirmée par le vendeur
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

      <DeliveryConfirmationDialog
        open={showDeliveryConfirm}
        onOpenChange={setShowDeliveryConfirm}
        productId={order.product_id}
        productTitle={order.product_title}
        currentStock={productStock}
        onConfirm={() => {
          onOrderUpdated();
          onOpenChange(false);
        }}
      />
    </>
  );
};