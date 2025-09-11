import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, X, Clock, CheckCircle, Truck, AlertCircle } from "lucide-react";
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

const statusConfig = {
  pending: { label: "En attente", icon: Clock, variant: "secondary" as const, color: "text-orange-500" },
  confirmed: { label: "Confirmée", icon: CheckCircle, variant: "default" as const, color: "text-blue-500" },
  shipped: { label: "Expédiée", icon: Truck, variant: "default" as const, color: "text-purple-500" },
  delivered: { label: "Livrée", icon: CheckCircle, variant: "default" as const, color: "text-green-500" },
  cancelled: { label: "Annulée", icon: X, variant: "destructive" as const, color: "text-red-500" },
};

const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
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
      
      // Filter only orders where the current user is the customer
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
      const { error } = await supabase.rpc('update_order_status', {
        order_id: orderId,
        new_status: 'cancelled'
      });

      if (error) throw error;

      toast({
        title: "Commande annulée",
        description: "Votre commande a été annulée avec succès",
      });

      // Refresh orders
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la commande",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const canCancelOrder = (status: string) => {
    return status === 'pending' || status === 'confirmed';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-white shadow-lg border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">Mes Commandes</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Mes Commandes</h1>
            <Badge className="bg-primary text-primary-foreground">
              {orders.length} commande{orders.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Aucune commande</h2>
            <p className="text-muted-foreground mb-6">Vous n'avez pas encore passé de commande</p>
            <Button onClick={() => navigate('/')}>
              Découvrir nos produits
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Commande #{order.id.slice(-8)}</CardTitle>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                        <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium text-foreground">{order.product_title}</h3>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                        <span>Quantité: {order.quantity}</span>
                        <span>Prix unitaire: {order.product_price.toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Nom:</span> {order.customer_name}</p>
                      <p><span className="font-medium">Téléphone:</span> {order.customer_phone}</p>
                      <p><span className="font-medium">Livraison:</span> {order.delivery_location}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <span className="text-lg font-bold text-promo">
                          Total: {order.total_amount.toLocaleString()} FCFA
                        </span>
                      </div>
                      
                      {canCancelOrder(order.status) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={cancellingId === order.id}
                              className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {cancellingId === order.id ? "Annulation..." : "Annuler la commande"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir annuler cette commande ? Cette action ne peut pas être annulée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Non, garder la commande</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => cancelOrder(order.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Oui, annuler la commande
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrders;