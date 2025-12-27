import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/utils/pushNotifications';
import { User, Phone, MapPin, Package, Calendar, CheckCircle, CheckCircle2, Loader2, Truck, Clock, X, ShoppingBag, CreditCard, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeliveryConfirmationDialog } from '@/components/DeliveryConfirmationDialog';
import { motion } from 'framer-motion';
import { getProductImage, handleImageError } from '@/utils/productImageHelper';

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

const statusConfig = {
  pending: { 
    label: "En attente", 
    icon: Clock, 
    bgColor: "bg-amber-500/10", 
    textColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/20",
    step: 1
  },
  confirmed: { 
    label: "Confirmée", 
    icon: CheckCircle, 
    bgColor: "bg-blue-500/10", 
    textColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/20",
    step: 2
  },
  processing: { 
    label: "Préparation", 
    icon: Package, 
    bgColor: "bg-purple-500/10", 
    textColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/20",
    step: 2
  },
  shipped: { 
    label: "En livraison", 
    icon: Truck, 
    bgColor: "bg-indigo-500/10", 
    textColor: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-500/20",
    step: 3
  },
  delivered: { 
    label: "Livrée", 
    icon: CheckCircle2, 
    bgColor: "bg-emerald-500/10", 
    textColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/20",
    step: 4
  },
  cancelled: { 
    label: "Annulée", 
    icon: X, 
    bgColor: "bg-red-500/10", 
    textColor: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-500/20",
    step: 0
  },
};

// Order Timeline Component
const OrderTimeline = ({ status }: { status: string }) => {
  const steps = [
    { key: 'pending', label: 'Reçue', icon: Clock },
    { key: 'confirmed', label: 'Confirmée', icon: CheckCircle },
    { key: 'shipped', label: 'Expédiée', icon: Truck },
    { key: 'delivered', label: 'Livrée', icon: CheckCircle2 },
  ];

  const currentStep = statusConfig[status as keyof typeof statusConfig]?.step || 0;

  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-4 bg-red-500/10 rounded-xl">
        <X className="w-5 h-5 text-red-500" />
        <span className="text-sm font-bold text-red-600 dark:text-red-400">Commande annulée</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 px-2">
      {steps.map((step, index) => {
        const isCompleted = currentStep >= (index + 1);
        const isCurrent = currentStep === (index + 1);
        const StepIcon = step.icon;
        
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isCompleted 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-muted text-muted-foreground'
                } ${isCurrent ? 'ring-2 ring-primary/30' : ''}`}
              >
                <StepIcon className="w-4 h-4" />
              </motion.div>
              <span className={`text-[10px] mt-1.5 font-medium ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-10 mx-1 transition-all ${
                currentStep > (index + 1) ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const OrderDetailDialog = ({ order, open, onOpenChange, onOrderUpdated }: OrderDetailDialogProps) => {
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [productStock, setProductStock] = useState(0);
  const [confirmingSale, setConfirmingSale] = useState(false);
  const [productImage, setProductImage] = useState<string>('/placeholder.svg');

  // Fetch product image when order changes
  useEffect(() => {
    const fetchProductImage = async () => {
      if (!order?.product_id) return;
      
      const { data } = await supabase
        .from('products')
        .select('images')
        .eq('id', order.product_id)
        .single();
      
      if (data?.images) {
        setProductImage(getProductImage(data.images, 0));
      }
    };
    
    if (open && order) {
      fetchProductImage();
    }
  }, [order?.product_id, open]);

  if (!order) return null;

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const updateOrderStatus = async (newStatus: string) => {
    if (!order?.id) {
      toast({
        title: "Erreur",
        description: "Commande invalide",
        variant: "destructive",
      });
      return;
    }

    if (newStatus === 'delivered') {
      setUpdatingStatus(true);
      try {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', order.product_id)
          .single();

        if (productError) throw productError;

        setProductStock(productData?.stock_quantity || 0);
        
        const { error } = await supabase
          .rpc('update_order_status', {
            order_id: order.id,
            new_status: newStatus
          });

        if (error) throw error;

        setShowDeliveryConfirm(true);
        setUpdatingStatus(false);
        onOrderUpdated();
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Impossible de mettre à jour le statut",
          variant: "destructive",
        });
        setUpdatingStatus(false);
      }
      return;
    }

    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .rpc('update_order_status', {
          order_id: order.id,
          new_status: newStatus
        });

      if (error) throw error;

      // 🔔 Push réel côté client (fonctionne même si l'app est fermée)
      const statusLabel = statusConfig[newStatus as keyof typeof statusConfig]?.label || newStatus;
      await sendPushNotification(supabase, {
        user_id: order.customer_id,
        title: `📦 Statut de commande: ${statusLabel}`,
        body: `Votre commande "${order.product_title}" est maintenant: ${statusLabel}`,
        url: '/my-orders',
        tag: 'order_status',
      });

      toast({
        title: "✅ Statut mis à jour",
        description: `Commande marquée comme "${statusLabel}"`,
      });

      onOrderUpdated();
      onOpenChange(false);
    } catch (error: any) {
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
      const { data, error } = await supabase.rpc('confirm_sale_by_seller', {
        _order_id: order.id,
        _mark_product_as_sold: markAsSold
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (result.success) {
        toast({
          title: "✅ Vente confirmée",
          description: markAsSold 
            ? "Le produit est maintenant marqué comme vendu" 
            : "Vente confirmée, le produit reste actif",
        });
        
        onOrderUpdated();
        setTimeout(() => onOpenChange(false), 500);
      } else {
        throw new Error(result.error || 'Erreur lors de la confirmation');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de confirmer la vente",
        variant: "destructive",
      });
    } finally {
      setConfirmingSale(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-t-3xl sm:rounded-3xl">
          {/* Native Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border/40">
            <DialogHeader className="p-4 pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${statusInfo.iconBg}`}>
                    <StatusIcon className={`w-5 h-5 ${statusInfo.textColor}`} />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground">Commande</DialogTitle>
                    <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                  </div>
                </div>
                <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor} border-0 px-3 py-1.5 text-xs font-bold rounded-lg`}>
                  {statusInfo.label}
                </Badge>
              </div>
            </DialogHeader>
            
            {/* Timeline */}
            <div className="px-4 pb-4">
              <OrderTimeline status={order.status} />
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Date */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {format(new Date(order.created_at), 'EEEE dd MMMM yyyy · HH:mm', { locale: fr })}
              </span>
            </div>

            {/* Product Card */}
            <div className="bg-muted/30 rounded-2xl p-4 border border-border/40">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Produit</span>
              </div>
              <div className="flex items-start gap-3">
                {/* Product Image - 120px for detail view */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={productImage}
                    alt={order.product_title}
                    className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-xl object-cover border border-border/30 bg-muted/20"
                    onError={handleImageError}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground leading-snug mb-2">{order.product_title}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                    <span className="text-muted-foreground">Qté: <span className="font-semibold text-foreground">{order.quantity}</span></span>
                    <span className="text-muted-foreground hidden sm:inline">×</span>
                    <span className="font-semibold text-foreground tabular-nums">{order.product_price.toLocaleString()} F</span>
                  </div>
                </div>
              </div>
              
              {/* Total */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Total à payer</span>
                </div>
                <span className="text-xl font-bold text-primary tabular-nums">{order.total_amount.toLocaleString()} F</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Client</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-blue-500 uppercase">Nom</p>
                  <p className="text-sm font-semibold text-foreground">{order.customer_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-500/5 rounded-xl border border-green-500/20">
                <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-green-500 uppercase">Téléphone</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{order.customer_phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-500/5 rounded-xl border border-orange-500/20">
                <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-orange-500 uppercase">Livraison</p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">{order.delivery_location}</p>
                </div>
              </div>
            </div>

            {/* Status Management */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</span>
              </div>
              
              <div className="p-3.5 bg-muted/30 rounded-xl border border-border/40">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Changer le statut
                </label>
                <Select
                  value={order.status}
                  onValueChange={updateOrderStatus}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl border-2 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">⏳ En attente</SelectItem>
                    <SelectItem value="confirmed">✅ Confirmée</SelectItem>
                    <SelectItem value="processing">📦 En préparation</SelectItem>
                    <SelectItem value="shipped">🚚 En livraison</SelectItem>
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
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmer
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
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Expédier
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Sale Confirmation */}
            {order.status === 'delivered' && !order.is_confirmed_by_seller && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-700 dark:text-emerald-300 mb-1">Livraison effectuée</h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
                      Confirmez la vente pour finaliser la transaction
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => handleConfirmSale(true)}
                    disabled={confirmingSale}
                    className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700"
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
                    variant="ghost"
                    className="w-full h-10 rounded-xl font-medium text-emerald-600"
                  >
                    Confirmer sans marquer vendu
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Confirmed Sale Badge */}
            {order.status === 'delivered' && order.is_confirmed_by_seller && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Vente confirmée
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
          setShowDeliveryConfirm(false);
          onOrderUpdated();
          setTimeout(() => onOpenChange(false), 500);
        }}
      />
    </>
  );
};
