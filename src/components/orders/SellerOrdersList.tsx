import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Eye, Calendar, User, Phone, MapPin, ChevronRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OrderDetailDialog } from '@/components/OrderDetailDialog';

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

interface SellerOrdersListProps {
  orders: Order[];
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

export const SellerOrdersList = ({ orders, onOrderUpdated }: SellerOrdersListProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-card rounded-3xl border border-border/50 p-8 text-center mt-4"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto bg-muted/50 rounded-3xl flex items-center justify-center mb-5"
        >
          <Package className="w-10 h-10 text-muted-foreground" />
        </motion.div>
        <h2 className="text-xl font-bold text-foreground mb-2">Aucune vente</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Les commandes de vos clients apparaîtront ici dès qu'ils passeront commande.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              {/* Header with status */}
              <div className="px-4 py-3 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-foreground truncate tabular-nums">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <Badge 
                    variant={getStatusBadgeVariant(order.status)} 
                    className="text-xs px-3 py-1 rounded-full flex-shrink-0 font-semibold"
                  >
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate font-medium">
                    {format(new Date(order.created_at), 'dd MMM yyyy · HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Product */}
                <div className="p-3 bg-muted/30 rounded-xl border border-border/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground line-clamp-2 mb-1">
                        {order.product_title}
                      </p>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground font-medium">
                          Qté: <span className="font-bold text-foreground">{order.quantity}</span>
                        </span>
                        <span className="font-bold text-base text-primary tabular-nums">
                          {order.total_amount.toLocaleString()} F
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate">
                      {order.customer_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-bold text-green-900 dark:text-green-100 truncate tabular-nums">
                      {order.customer_phone}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-xs font-semibold text-orange-900 dark:text-orange-100 line-clamp-2 flex-1 leading-relaxed">
                      {order.delivery_location}
                    </p>
                  </div>
                </div>

                {/* Status badges */}
                {(order.status === 'delivered' && !order.is_confirmed_by_seller) && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-200 text-center">
                      ⚠️ En attente de confirmation de vente
                    </p>
                  </div>
                )}

                {order.is_confirmed_by_seller && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      Vente confirmée
                    </p>
                  </div>
                )}

                {/* Action button */}
                <Button 
                  onClick={() => handleOrderClick(order)}
                  className="w-full h-12 text-sm font-bold rounded-xl shadow-sm"
                  size="lg"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Gérer la commande
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <OrderDetailDialog
        order={selectedOrder}
        open={orderDetailOpen}
        onOpenChange={setOrderDetailOpen}
        onOrderUpdated={onOrderUpdated}
      />
    </>
  );
};
