import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, X, Clock, CheckCircle, Truck, AlertCircle, ChevronRight, MapPin, Phone, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
  pending: { label: "En attente", icon: Clock, bgColor: "bg-orange-100", textColor: "text-orange-700", borderColor: "border-orange-200" },
  confirmed: { label: "Confirmée", icon: CheckCircle, bgColor: "bg-blue-100", textColor: "text-blue-700", borderColor: "border-blue-200" },
  shipped: { label: "Expédiée", icon: Truck, bgColor: "bg-purple-100", textColor: "text-purple-700", borderColor: "border-purple-200" },
  delivered: { label: "Livrée", icon: CheckCircle, bgColor: "bg-green-100", textColor: "text-green-700", borderColor: "border-green-200" },
  cancelled: { label: "Annulée", icon: X, bgColor: "bg-red-100", textColor: "text-red-700", borderColor: "border-red-200" },
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-50 bg-card border-b border-border/50 safe-area-inset-top">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded-xl animate-pulse" />
            <div className="h-6 w-32 bg-muted rounded-lg animate-pulse" />
          </div>
        </header>
        <div className="px-4 py-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      {/* Header - Native Style */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 safe-area-inset-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground">Mes Commandes</h1>
          </div>
          <Badge className="bg-primary/10 text-primary border-0 px-2.5 py-1 text-xs font-semibold shrink-0">
            {orders.length}
          </Badge>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 max-w-lg mx-auto lg:max-w-3xl">
        {orders.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-8 text-center mt-4">
            <div className="w-20 h-20 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Aucune commande</h2>
            <p className="text-sm text-muted-foreground mb-6">Vous n'avez pas encore passé de commande</p>
            <Button 
              onClick={() => navigate('/marketplace')}
              className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90"
            >
              Découvrir nos produits
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedOrderId === order.id;

              return (
                <div 
                  key={order.id} 
                  className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm"
                >
                  {/* Order Header - Always Visible */}
                  <button
                    onClick={() => toggleOrderExpand(order.id)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 active:bg-muted/50 transition-colors text-left"
                  >
                    {/* Status Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${statusInfo.bgColor}`}>
                      <StatusIcon className={`w-6 h-6 ${statusInfo.textColor}`} />
                    </div>
                    
                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-foreground">#{order.id.slice(-8)}</span>
                        <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor} border-0 text-[10px] px-2 py-0.5 font-semibold`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground font-medium truncate">{order.product_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {/* Price & Chevron */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary text-sm">{order.total_amount.toLocaleString()} F</p>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground ml-auto mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-border/50 bg-muted/20">
                      <div className="pt-4 space-y-3">
                        {/* Product Details */}
                        <div className="bg-card rounded-xl p-3 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Détails produit</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Quantité</span>
                            <span className="font-semibold text-foreground">{order.quantity}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-muted-foreground">Prix unitaire</span>
                            <span className="font-semibold text-foreground">{order.product_price.toLocaleString()} FCFA</span>
                          </div>
                        </div>
                        
                        {/* Delivery Info */}
                        <div className="bg-card rounded-xl p-3 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Livraison</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-foreground">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-foreground">{order.customer_phone}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-foreground">{order.delivery_location}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Total */}
                        <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-foreground">Total à payer</span>
                            <span className="text-lg font-bold text-primary">{order.total_amount.toLocaleString()} FCFA</span>
                          </div>
                        </div>
                        
                        {/* Cancel Button */}
                        {canCancelOrder(order.status) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                disabled={cancellingId === order.id}
                                className="w-full h-12 rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
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
                            <AlertDialogContent className="max-w-sm mx-4 rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-lg">Confirmer l'annulation</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-muted-foreground">
                                  Êtes-vous sûr de vouloir annuler cette commande ? Le vendeur sera notifié.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2 flex-col">
                                <AlertDialogAction 
                                  onClick={() => cancelOrder(order.id)}
                                  className="w-full h-12 rounded-xl bg-red-600 text-white hover:bg-red-700"
                                >
                                  Oui, annuler
                                </AlertDialogAction>
                                <AlertDialogCancel className="w-full h-12 rounded-xl border-border/50">
                                  Non, garder
                                </AlertDialogCancel>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrders;