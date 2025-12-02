import { useState, useEffect, useCallback } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Package, Eye, Calendar, User, Phone, MapPin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OrderDetailDialog } from './OrderDetailDialog';
import { SmoothListSkeleton } from '@/components/ui/smooth-skeleton';
import { motion } from 'framer-motion';

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

export const SellerOrders = () => {
  const { user } = useStableAuth();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer les commandes
  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_seller_orders');
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Chargement initial
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 🔥 Temps réel: Écouter les nouvelles commandes et mises à jour
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('seller-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Realtime order change:', payload);
          // Rafraîchir la liste des commandes
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchOrders]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
  };

  const handleOrderUpdated = () => {
    fetchOrders();
  };

  const getStatusBadgeVariant = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  if (loading) {
    return <SmoothListSkeleton items={3} variant="list" className="prevent-flash" />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <h2 className="text-lg md:text-xl font-bold">📦 Mes Commandes</h2>
        <Badge variant="secondary" className="text-sm md:text-base px-3 py-1.5 rounded-full">
          {(orders || []).length}
        </Badge>
      </motion.div>

      {!orders || orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-muted rounded-full flex items-center justify-center">
                <Package className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
              </div>
              <p className="text-base md:text-lg font-semibold text-foreground mb-2">Aucune commande</p>
              <p className="text-sm text-muted-foreground">
                Les commandes apparaîtront ici dès qu'un client passera commande
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {(orders || []).map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden bg-card">
                {/* Header with status */}
                <div className="px-4 py-3 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-foreground truncate">
                        #{order.id.slice(-8)}
                      </span>
                    </div>
                    <Badge 
                      variant={getStatusBadgeVariant(order.status)} 
                      className="text-xs px-2.5 py-1 rounded-full flex-shrink-0"
                    >
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {format(new Date(order.created_at), 'dd MMM yyyy · HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Product */}
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground line-clamp-2 mb-1">
                          {order.product_title}
                        </p>
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>Qté: {order.quantity}</span>
                          <span className="font-bold text-primary">
                            {order.total_amount.toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">
                        {order.customer_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                        {order.customer_phone}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-xs font-medium text-orange-900 dark:text-orange-100 line-clamp-2 flex-1">
                        {order.delivery_location}
                      </p>
                    </div>
                  </div>

                  {/* Status badges */}
                  {(order.status === 'delivered' && !order.is_confirmed_by_seller) && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 text-center">
                        ⚠️ En attente de confirmation
                      </p>
                    </div>
                  )}

                  {order.is_confirmed_by_seller && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 text-center">
                        ✅ Vente confirmée
                      </p>
                    </div>
                  )}

                  {/* Action button */}
                  <Button 
                    onClick={() => handleOrderClick(order)}
                    className="w-full h-12 text-base font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
                    size="lg"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Gérer la commande
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      <OrderDetailDialog
        order={selectedOrder}
        open={orderDetailOpen}
        onOpenChange={setOrderDetailOpen}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
};