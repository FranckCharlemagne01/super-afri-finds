import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, AlertCircle, ChevronDown, MapPin, Phone, User, ShoppingBag, Calendar, Eye, MessageSquare, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Order {
  id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  quantity: number;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  delivery_location: string;
  created_at: string;
  updated_at: string;
}

interface CancelOrderResponse {
  success: boolean;
  error?: string;
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
    icon: CheckCircle, 
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

const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_seller_orders');
      
      if (error) throw error;
      
      const customerOrders = data?.filter(order => order.customer_id === user?.id) || [];
      setOrders(customerOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos commandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      setCancellingId(orderId);
      const { data, error } = await supabase.rpc('cancel_order_by_customer', {
        order_id: orderId
      });

      if (error) throw error;

      const result = data as unknown as CancelOrderResponse;

      if (result?.success) {
        toast({
          title: "✅ Commande annulée",
          description: "Votre commande a été annulée avec succès",
        });
        fetchOrders();
      } else {
        throw new Error(result?.error || "Impossible d'annuler la commande");
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'annuler la commande",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const canCancelOrder = (status: string) => {
    return status === 'pending' || status === 'confirmed';
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Progress bar component for order status
  const OrderProgress = ({ status }: { status: string }) => {
    const currentStep = statusConfig[status as keyof typeof statusConfig]?.step || 0;
    const steps = [
      { label: "Reçue", step: 1 },
      { label: "Confirmée", step: 2 },
      { label: "Expédiée", step: 3 },
      { label: "Livrée", step: 4 },
    ];

    if (status === 'cancelled') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-xl">
          <X className="w-4 h-4 text-red-500" />
          <span className="text-xs font-semibold text-red-600 dark:text-red-400">Commande annulée</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {steps.map((s, index) => (
          <div key={s.step} className="flex items-center">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${
              s.step <= currentStep 
                ? 'bg-primary w-8' 
                : 'bg-muted w-8'
            }`} />
            {index < steps.length - 1 && <div className="w-0.5" />}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b border-border/50 safe-area-inset-top">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded-xl animate-pulse" />
            <div className="h-6 w-32 bg-muted rounded-lg animate-pulse" />
          </div>
        </header>
        <div className="px-4 py-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Native Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/40 safe-area-inset-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground tracking-tight">Mes Commandes</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-9 px-3 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary mr-1.5" />
              <span className="text-sm font-bold text-primary tabular-nums">{orders.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 max-w-lg mx-auto lg:max-w-2xl">
        {orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl border border-border/50 p-8 text-center mt-8"
          >
            <div className="w-20 h-20 mx-auto bg-muted/50 rounded-3xl flex items-center justify-center mb-5">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Aucune commande</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Vous n'avez pas encore passé de commande. Découvrez nos produits !
            </p>
            <Button 
              onClick={() => navigate('/marketplace')}
              className="h-12 px-8 rounded-xl font-semibold"
            >
              Découvrir les produits
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {orders.map((order, index) => {
                const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = statusInfo.icon;
                const isExpanded = expandedOrderId === order.id;

                return (
                  <motion.div 
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm"
                  >
                    {/* Order Card Header - Always Visible */}
                    <motion.button
                      whileTap={{ scale: 0.995 }}
                      onClick={() => toggleOrderExpand(order.id)}
                      className="w-full p-4 flex items-start gap-3.5 hover:bg-muted/20 active:bg-muted/40 transition-colors text-left"
                    >
                      {/* Status Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${statusInfo.iconBg}`}>
                        <StatusIcon className={`w-5 h-5 ${statusInfo.textColor}`} />
                      </div>
                      
                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor} border-0 text-[10px] px-2 py-0.5 font-bold rounded-md`}>
                            {statusInfo.label}
                          </Badge>
                          <span className="text-[10px] font-medium text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate mb-1.5">{order.product_title}</p>
                        <OrderProgress status={order.status} />
                      </div>
                      
                      {/* Price & Chevron */}
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <p className="font-bold text-primary text-base tabular-nums">{order.total_amount.toLocaleString()} F</p>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-1"
                        >
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </motion.button>
                    
                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 border-t border-border/40 bg-muted/10">
                            <div className="pt-4 space-y-3">
                              {/* Date Info */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Commandé le {formatDate(order.created_at)} à {formatTime(order.created_at)}</span>
                              </div>

                              {/* Product Card */}
                              <div className="bg-card rounded-xl p-3.5 border border-border/40">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Package className="w-6 h-6 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{order.product_title}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-xs text-muted-foreground">Qté: <span className="font-semibold text-foreground">{order.quantity}</span></span>
                                      <span className="text-xs text-muted-foreground">×</span>
                                      <span className="text-xs text-muted-foreground">{order.product_price.toLocaleString()} F</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Delivery Info */}
                              <div className="bg-card rounded-xl p-3.5 border border-border/40 space-y-2.5">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Livraison</p>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                      <User className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <span className="text-sm text-foreground font-medium">{order.customer_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                      <Phone className="w-4 h-4 text-green-500" />
                                    </div>
                                    <span className="text-sm text-foreground font-medium tabular-nums">{order.customer_phone}</span>
                                  </div>
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                                      <MapPin className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <span className="text-sm text-foreground leading-relaxed">{order.delivery_location}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Total */}
                              <div className="bg-primary/5 rounded-xl p-3.5 border border-primary/20">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-semibold text-foreground">Total</span>
                                  <span className="text-xl font-bold text-primary tabular-nums">{order.total_amount.toLocaleString()} FCFA</span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-1">
                                <Button 
                                  variant="outline"
                                  onClick={() => navigate(`/product/${order.product_id}`)}
                                  className="flex-1 h-11 rounded-xl text-sm font-medium"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir produit
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => navigate(`/messages`)}
                                  className="flex-1 h-11 rounded-xl text-sm font-medium"
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Contacter
                                </Button>
                              </div>
                              
                              {/* Cancel Button */}
                              {canCancelOrder(order.status) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      disabled={cancellingId === order.id}
                                      className="w-full h-11 rounded-xl text-red-600 hover:bg-red-500/10 hover:text-red-600 font-medium"
                                    >
                                      {cancellingId === order.id ? (
                                        <div className="flex items-center gap-2">
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                                          <span>Annulation...</span>
                                        </div>
                                      ) : (
                                        <>
                                          <AlertCircle className="w-4 h-4 mr-2" />
                                          Annuler cette commande
                                        </>
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="max-w-[90vw] sm:max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
                                    <div className="p-6">
                                      <AlertDialogHeader>
                                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                                          <AlertCircle className="w-7 h-7 text-red-500" />
                                        </div>
                                        <AlertDialogTitle className="text-center text-lg font-bold">Annuler la commande ?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2">
                                          Cette action est irréversible. Le vendeur sera notifié de l'annulation.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                    </div>
                                    <AlertDialogFooter className="flex flex-col gap-2 p-4 pt-0">
                                      <AlertDialogAction 
                                        onClick={() => cancelOrder(order.id)}
                                        className="w-full h-12 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold"
                                      >
                                        Oui, annuler
                                      </AlertDialogAction>
                                      <AlertDialogCancel className="w-full h-12 rounded-xl border-border/50 font-medium mt-0">
                                        Non, conserver
                                      </AlertDialogCancel>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrders;
