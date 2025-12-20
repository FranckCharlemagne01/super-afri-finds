import { useState, useEffect, useCallback } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Eye, Calendar, User, Phone, MapPin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OrderDetailDialog } from './OrderDetailDialog';
import { SmoothListSkeleton } from '@/components/ui/smooth-skeleton';
import { motion } from 'framer-motion';
import { getProductImage, handleImageError } from '@/utils/productImageHelper';
import { useNavigate } from 'react-router-dom';

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
  seller_id: string;
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
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  // Fetch product images for all orders
  useEffect(() => {
    const fetchProductImages = async () => {
      const productIds = [...new Set(orders.map(o => o.product_id))];
      if (productIds.length === 0) return;

      const { data } = await supabase
        .from('products')
        .select('id, images')
        .in('id', productIds);

      if (data) {
        const imageMap: Record<string, string> = {};
        data.forEach(p => {
          imageMap[p.id] = getProductImage(p.images, 0);
        });
        setProductImages(imageMap);
      }
    };

    fetchProductImages();
  }, [orders]);

  // Fonction pour récupérer les commandes
  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_seller_orders');
      if (error) throw error;
      
      // Filtrer pour ne garder QUE les commandes où l'utilisateur est le vendeur
      const sellerOrders = (data || []).filter((order: Order) => order.seller_id === user.id);
      setOrders(sellerOrders);
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
    <div className="space-y-4 md:space-y-6 pb-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 md:mx-0 md:px-0 md:static"
      >
        <h2 className="text-xl md:text-2xl font-bold text-foreground">📦 Mes Commandes</h2>
        <Badge variant="secondary" className="text-sm md:text-base px-4 py-1.5 rounded-full font-bold tabular-nums shadow-sm">
          {(orders || []).length}
        </Badge>
      </motion.div>

      {!orders || orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <CardContent className="p-8 md:p-16 text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center shadow-inner"
              >
                <Package className="h-12 w-12 md:h-16 md:w-16 text-primary" />
              </motion.div>
              <p className="text-lg md:text-xl font-bold text-foreground mb-3">Aucune commande</p>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                Les commandes apparaîtront ici dès qu'un client passera commande. Vous recevrez une notification en temps réel.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {(orders || []).map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden bg-card/80 backdrop-blur-sm">
                {/* Header with status */}
                <div className="px-5 py-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                      >
                        <Package className="h-5 w-5 text-primary" />
                      </motion.div>
                      <span className="text-sm md:text-base font-bold text-foreground truncate tabular-nums">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <Badge 
                      variant={getStatusBadgeVariant(order.status)} 
                      className="text-xs md:text-sm px-3 py-1.5 rounded-full flex-shrink-0 font-semibold shadow-sm"
                    >
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs md:text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate font-medium">
                      {format(new Date(order.created_at), 'dd MMM yyyy · HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Product with real image */}
                  <div 
                    className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl border border-border/30 shadow-sm cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${order.product_id}`);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Product Image - clickable to view product */}
                      <div className="relative flex-shrink-0">
                        <img 
                          src={productImages[order.product_id] || '/placeholder.svg'}
                          alt={order.product_title}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-border/30 shadow-sm"
                          onError={handleImageError}
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary/90 flex items-center justify-center shadow-md">
                          <span className="text-[10px] font-bold text-primary-foreground">x{order.quantity}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm md:text-base text-foreground line-clamp-2 mb-2 leading-snug">
                          {order.product_title}
                        </p>
                        <div className="flex items-center justify-between gap-3 text-xs md:text-sm">
                          <span className="text-muted-foreground font-medium text-xs">
                            Voir le produit →
                          </span>
                          <span className="font-bold text-base md:text-lg text-primary tabular-nums">
                            {order.total_amount.toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm md:text-base font-bold text-blue-900 dark:text-blue-100 truncate">
                        {order.customer_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
                      <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm md:text-base font-bold text-green-900 dark:text-green-100 truncate tabular-nums">
                        {order.customer_phone}
                      </span>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
                      <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-xs md:text-sm font-semibold text-orange-900 dark:text-orange-100 line-clamp-2 flex-1 leading-relaxed">
                        {order.delivery_location}
                      </p>
                    </div>
                  </div>

                  {/* Status badges */}
                  {(order.status === 'delivered' && !order.is_confirmed_by_seller) && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl shadow-sm"
                    >
                      <p className="text-xs md:text-sm font-bold text-amber-800 dark:text-amber-200 text-center">
                        ⚠️ En attente de confirmation de vente
                      </p>
                    </motion.div>
                  )}

                  {order.is_confirmed_by_seller && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl shadow-sm"
                    >
                      <p className="text-xs md:text-sm font-bold text-emerald-800 dark:text-emerald-200 text-center">
                        ✅ Vente confirmée avec succès
                      </p>
                    </motion.div>
                  )}

                  {/* Action button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={() => handleOrderClick(order)}
                      className="w-full h-14 text-base md:text-lg font-bold rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90"
                      size="lg"
                    >
                      <Eye className="h-5 w-5 mr-2" />
                      Gérer la commande
                      <ChevronRight className="h-5 w-5 ml-auto" />
                    </Button>
                  </motion.div>
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