import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Eye, Calendar, User, Phone, MapPin, ChevronRight, CheckCircle, Clock, Truck, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OrderDetailDialog } from '@/components/OrderDetailDialog';
import { supabase } from "@/integrations/supabase/client";

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

const statusConfig = {
  pending: { 
    label: 'En attente', 
    icon: Clock,
    bgColor: 'bg-amber-500/15',
    textColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/20'
  },
  confirmed: { 
    label: 'Confirmée', 
    icon: CheckCircle,
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/20'
  },
  processing: { 
    label: 'En préparation', 
    icon: Package,
    bgColor: 'bg-purple-500/15',
    textColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-500/20'
  },
  shipped: { 
    label: 'Expédiée', 
    icon: Truck,
    bgColor: 'bg-indigo-500/15',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-500/20'
  },
  delivered: { 
    label: 'Livrée', 
    icon: CheckCircle,
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/20'
  },
  cancelled: { 
    label: 'Annulée', 
    icon: X,
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-500/20'
  },
};

export const SellerOrdersList = ({ orders, onOrderUpdated }: SellerOrdersListProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  // Fetch product images
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
          imageMap[p.id] = p.images?.[0] || '/placeholder.svg';
        });
        setProductImages(imageMap);
      }
    };

    fetchProductImages();
  }, [orders]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
  };

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-card rounded-3xl border border-border/50 p-8 text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl flex items-center justify-center mb-5"
        >
          <Package className="w-10 h-10 text-primary" />
        </motion.div>
        <h2 className="text-xl font-bold text-foreground mb-2">Aucune vente</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Les commandes de vos clients apparaîtront ici dès qu'ils passeront commande.
        </p>
      </motion.div>
    );
  }

  // Count pending orders
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <>
      {/* Alert for pending orders */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
              {pendingCount} commande{pendingCount > 1 ? 's' : ''} en attente
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Répondez rapidement pour satisfaire vos clients
            </p>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {orders.map((order, index) => {
          const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
          const StatusIcon = statusInfo.icon;
          const productImage = productImages[order.product_id] || '/placeholder.svg';
          const isPending = order.status === 'pending';
          const needsConfirmation = order.status === 'delivered' && !order.is_confirmed_by_seller;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              onClick={() => handleOrderClick(order)}
              className={`bg-card rounded-2xl border overflow-hidden shadow-sm cursor-pointer active:bg-muted/20 transition-colors ${
                isPending ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-border/50'
              }`}
            >
              <div className="p-3.5 flex gap-3.5">
                {/* Product Image */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={productImage}
                    alt={order.product_title}
                    className="w-[72px] h-[72px] rounded-xl object-cover border border-border/30"
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                  />
                  <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center ${statusInfo.iconBg}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.textColor}`} />
                  </div>
                  {isPending && (
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{order.product_title}</p>
                    <p className="text-base font-bold text-primary tabular-nums flex-shrink-0">{order.total_amount.toLocaleString()} F</p>
                  </div>

                  {/* Customer info row */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-blue-500" />
                      </div>
                      <span className="text-xs font-semibold text-foreground truncate">{order.customer_name}</span>
                    </div>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">
                      {format(new Date(order.created_at), 'dd MMM · HH:mm', { locale: fr })}
                    </span>
                  </div>

                  {/* Status & Action row */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor} border-0 text-[10px] px-2 py-0.5 font-bold rounded-lg`}>
                      {statusInfo.label}
                    </Badge>
                    
                    {needsConfirmation && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        ⚠️ À confirmer
                      </span>
                    )}
                    
                    {order.is_confirmed_by_seller && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Confirmée
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="self-center flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              {/* Quick info footer */}
              <div className="px-3.5 pb-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3" />
                  <span className="tabular-nums">{order.customer_phone}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{order.delivery_location}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
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
