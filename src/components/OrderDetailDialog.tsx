import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, MapPin, Package, DollarSign, Calendar, CheckCircle, CheckCircle2, Loader2, Truck, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeliveryConfirmationDialog } from '@/components/DeliveryConfirmationDialog';
import { Separator } from '@/components/ui/separator';

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
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto p-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 via-primary/5 to-background px-4 md:px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-base font-bold block">Commande</span>
                    <span className="text-xs text-muted-foreground">#{order.id.slice(-8)}</span>
                  </div>
                </div>
                <Badge 
                  variant={getStatusBadgeVariant(order.status)}
                  className="px-3 py-1.5 text-xs rounded-full"
                >
                  {statusLabels[order.status as keyof typeof statusLabels]}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(new Date(order.created_at), 'dd MMMM yyyy · HH:mm', { locale: fr })}
              </span>
            </div>
          </div>

          <div className="px-4 md:px-6 pb-6 space-y-4">
            {/* Product section */}
            <div className="pt-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                📦 Produit
              </h3>
              <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground mb-2">{order.product_title}</p>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        Quantité: <span className="font-semibold text-foreground">{order.quantity}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Prix: <span className="font-semibold text-foreground">{order.product_price.toLocaleString()} FCFA</span>
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-muted-foreground">Total</span>
                      <span className="text-lg font-bold text-primary">
                        {order.total_amount.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer section */}
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                👤 Informations Client
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-0.5">Nom complet</p>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate">
                      {order.customer_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-0.5">Téléphone</p>
                    <p className="text-sm font-bold text-green-900 dark:text-green-100 truncate">
                      {order.customer_phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">Adresse de livraison</p>
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100 whitespace-pre-wrap break-words">
                      {order.delivery_location}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order management */}
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                ⚙️ Gestion de la commande
              </h3>
              
              <div className="space-y-3">
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Statut actuel
                  </label>
                  <Select
                    value={order.status}
                    onValueChange={updateOrderStatus}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="w-full h-11 rounded-lg border-2 font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">⏳ En attente</SelectItem>
                      <SelectItem value="confirmed">✅ Confirmée</SelectItem>
                      <SelectItem value="processing">📦 En préparation</SelectItem>
                      <SelectItem value="shipped">🚚 Expédiée</SelectItem>
                      <SelectItem value="delivered">✅ Livrée</SelectItem>
                      <SelectItem value="cancelled">❌ Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => updateOrderStatus('confirmed')} 
                    disabled={updatingStatus || order.status === 'confirmed'}
                    className="h-12 rounded-xl font-semibold"
                    variant={order.status === 'confirmed' ? 'secondary' : 'default'}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {order.status === 'confirmed' ? 'Confirmée' : 'Confirmer'}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => updateOrderStatus('shipped')} 
                    disabled={updatingStatus || order.status === 'shipped'}
                    className="h-12 rounded-xl font-semibold"
                    variant={order.status === 'shipped' ? 'secondary' : 'outline'}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Truck className="h-4 w-4 mr-2" />
                        {order.status === 'shipped' ? 'Expédiée' : 'Expédier'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Sale confirmation section */}
            {order.status === 'delivered' && !order.is_confirmed_by_seller && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-100 mb-1">
                      Livraison effectuée
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Confirmez la vente pour finaliser la transaction
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleConfirmSale(true)}
                    disabled={confirmingSale}
                    className="w-full h-12 rounded-xl font-bold text-base"
                    size="lg"
                  >
                    {confirmingSale ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Confirmer la vente
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleConfirmSale(false)}
                    disabled={confirmingSale}
                    variant="outline"
                    className="w-full h-11 rounded-xl font-semibold"
                  >
                    Confirmer sans marquer vendu
                  </Button>
                </div>
              </div>
            )}

            {/* Confirmed sale badge */}
            {order.status === 'delivered' && order.is_confirmed_by_seller && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                  ✅ Vente confirmée
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