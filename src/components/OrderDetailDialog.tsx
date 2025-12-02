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
    if (!order?.id) {
      toast({
        title: "Erreur",
        description: "Commande invalide",
        variant: "destructive",
      });
      return;
    }

    // Si le statut passe à "delivered", afficher la modale de confirmation
    if (newStatus === 'delivered') {
      setUpdatingStatus(true);
      try {
        console.log('📦 Mise à jour statut vers delivered pour commande:', order.id);
        
        // Récupérer le stock du produit
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', order.product_id)
          .single();

        if (productError) {
          console.error('❌ Erreur récupération stock:', productError);
          throw productError;
        }

        setProductStock(productData?.stock_quantity || 0);
        console.log('✅ Stock récupéré:', productData?.stock_quantity);
        
        // Mettre à jour le statut de la commande
        const { error } = await supabase
          .rpc('update_order_status', {
            order_id: order.id,
            new_status: newStatus
          });

        if (error) {
          console.error('❌ Erreur RPC update_order_status:', error);
          throw error;
        }

        console.log('✅ Statut mis à jour vers delivered');

        // Afficher la modale de confirmation (ne pas fermer OrderDetailDialog)
        setShowDeliveryConfirm(true);
        setUpdatingStatus(false);
        
        // Rafraîchir les données
        onOrderUpdated();
      } catch (error: any) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        toast({
          title: "Erreur",
          description: error.message || "Impossible de mettre à jour le statut",
          variant: "destructive",
        });
        setUpdatingStatus(false);
      }
      return;
    }

    // Pour les autres statuts, mise à jour normale
    setUpdatingStatus(true);
    try {
      console.log('📦 Mise à jour statut vers', newStatus, 'pour commande:', order.id);
      
      const { error } = await supabase
        .rpc('update_order_status', {
          order_id: order.id,
          new_status: newStatus
        });

      if (error) {
        console.error('❌ Erreur RPC update_order_status:', error);
        throw error;
      }

      console.log('✅ Statut mis à jour avec succès');

      toast({
        title: "✅ Statut mis à jour",
        description: `La commande a été marquée comme "${statusLabels[newStatus as keyof typeof statusLabels]}"`,
      });

      onOrderUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmSale = async (markAsSold: boolean = true) => {
    if (!order?.id) {
      toast({
        title: "Erreur",
        description: "Commande invalide",
        variant: "destructive",
      });
      return;
    }

    setConfirmingSale(true);
    
    try {
      console.log('💰 Confirmation de vente pour commande:', order.id, 'marquer comme vendu:', markAsSold);
      
      const { data, error } = await supabase.rpc('confirm_sale_by_seller', {
        _order_id: order.id,
        _mark_product_as_sold: markAsSold
      });

      if (error) {
        console.error('❌ Erreur RPC confirm_sale_by_seller:', error);
        throw error;
      }

      console.log('✅ Réponse RPC:', data);

      const result = data as { success: boolean; error?: string; message?: string };

      if (result.success) {
        console.log('✅ Vente confirmée avec succès');
        toast({
          title: "✅ Vente confirmée",
          description: markAsSold 
            ? "Le produit est maintenant marqué comme vendu" 
            : "Vente confirmée, le produit reste actif",
        });
        
        // Rafraîchir les données
        onOrderUpdated();
        
        // Fermer la dialog après un court délai
        setTimeout(() => {
          onOpenChange(false);
        }, 500);
      } else {
        console.error('❌ Échec confirmation:', result.error);
        throw new Error(result.error || 'Erreur lors de la confirmation');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la confirmation de vente:', error);
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
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto p-0 gap-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 via-primary/5 to-background px-5 md:px-6 pt-6 pb-5 border-b shadow-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-sm">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-base md:text-lg font-bold block text-foreground">Détails Commande</span>
                    <span className="text-xs md:text-sm text-muted-foreground font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                  </div>
                </div>
                <Badge 
                  variant={getStatusBadgeVariant(order.status)}
                  className="px-4 py-2 text-xs md:text-sm rounded-full font-bold shadow-sm"
                >
                  {statusLabels[order.status as keyof typeof statusLabels]}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 mt-4 text-xs md:text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {format(new Date(order.created_at), 'dd MMMM yyyy · HH:mm', { locale: fr })}
              </span>
            </div>
          </div>

          <div className="px-5 md:px-6 pb-6 space-y-5">
            {/* Product section */}
            <div className="pt-3">
              <h3 className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produit Commandé
              </h3>
              <div className="p-5 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl border border-border/50 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Package className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base md:text-lg text-foreground mb-3 leading-snug">{order.product_title}</p>
                    <div className="flex items-center justify-between gap-3 text-sm md:text-base mb-3">
                      <span className="text-muted-foreground font-medium">
                        Quantité: <span className="font-bold text-foreground">{order.quantity}</span>
                      </span>
                      <span className="text-muted-foreground font-medium">
                        Prix: <span className="font-bold text-foreground tabular-nums">{order.product_price.toLocaleString()} FCFA</span>
                      </span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm md:text-base font-bold text-muted-foreground">Montant Total</span>
                      <span className="text-xl md:text-2xl font-bold text-primary tabular-nums">
                        {order.total_amount.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer section */}
            <div>
              <h3 className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Informations Client
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Nom complet</p>
                    <p className="text-sm md:text-base font-bold text-blue-900 dark:text-blue-100 truncate">
                      {order.customer_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-800 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-green-600 dark:text-green-400 mb-1">Téléphone</p>
                    <p className="text-sm md:text-base font-bold text-green-900 dark:text-green-100 truncate tabular-nums">
                      {order.customer_phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-200 dark:border-orange-800 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <MapPin className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1.5">Adresse de livraison</p>
                    <p className="text-sm md:text-base font-semibold text-orange-900 dark:text-orange-100 whitespace-pre-wrap break-words leading-relaxed">
                      {order.delivery_location}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order management */}
            <div>
              <h3 className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                ⚙️ Actions Disponibles
              </h3>
              
              <div className="space-y-4">
                <div className="p-5 bg-muted/30 rounded-2xl border border-border/50 shadow-sm">
                  <label className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                    Modifier le statut
                  </label>
                  <Select
                    value={order.status}
                    onValueChange={updateOrderStatus}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="w-full h-12 md:h-14 rounded-xl border-2 font-bold text-sm md:text-base shadow-sm">
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

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => updateOrderStatus('confirmed')} 
                    disabled={updatingStatus || order.status === 'confirmed'}
                    className="h-14 rounded-2xl font-bold text-sm md:text-base shadow-md hover:shadow-lg transition-all"
                    variant={order.status === 'confirmed' ? 'secondary' : 'default'}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {order.status === 'confirmed' ? 'Confirmée' : 'Confirmer'}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => updateOrderStatus('shipped')} 
                    disabled={updatingStatus || order.status === 'shipped'}
                    className="h-14 rounded-2xl font-bold text-sm md:text-base shadow-md hover:shadow-lg transition-all"
                    variant={order.status === 'shipped' ? 'secondary' : 'outline'}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Truck className="h-5 w-5 mr-2" />
                        {order.status === 'shipped' ? 'Expédiée' : 'Expédier'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Sale confirmation section */}
            {order.status === 'delivered' && !order.is_confirmed_by_seller && (
              <div className="p-5 md:p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base md:text-lg text-emerald-900 dark:text-emerald-100 mb-2">
                      🎉 Livraison effectuée
                    </h4>
                    <p className="text-xs md:text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      Confirmez la vente pour finaliser la transaction et marquer le produit comme vendu
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleConfirmSale(true)}
                    disabled={confirmingSale}
                    className="w-full h-14 md:h-16 rounded-2xl font-bold text-base md:text-lg shadow-md hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    {confirmingSale ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-6 w-6 mr-2" />
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
          console.log('✅ Livraison confirmée depuis DeliveryConfirmationDialog');
          setShowDeliveryConfirm(false);
          onOrderUpdated();
          
          // Fermer OrderDetailDialog après un court délai
          setTimeout(() => {
            onOpenChange(false);
          }, 500);
        }}
      />
    </>
  );
};