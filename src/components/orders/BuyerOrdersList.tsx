import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle, Truck, ChevronDown, MapPin, Phone, User, Calendar, Eye, MessageSquare, X, Store, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { getProductImage, handleImageError } from '@/utils/productImageHelper';

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
  seller_id: string;
  created_at: string;
  updated_at: string;
  shop_name?: string;
  shop_slug?: string;
}

interface BuyerOrdersListProps {
  orders: Order[];
  onCancelOrder: (orderId: string) => Promise<void>;
  cancellingId: string | null;
}

const statusConfig = {
  pending: { 
    label: "En attente", 
    icon: Clock, 
    bgColor: "bg-amber-500/15", 
    textColor: "text-amber-600 dark:text-amber-400", 
    iconBg: "bg-amber-500/20",
    progressColor: "bg-amber-500",
    step: 1
  },
  confirmed: { 
    label: "Confirmée", 
    icon: CheckCircle, 
    bgColor: "bg-blue-500/15", 
    textColor: "text-blue-600 dark:text-blue-400", 
    iconBg: "bg-blue-500/20",
    progressColor: "bg-blue-500",
    step: 2
  },
  shipped: { 
    label: "En livraison", 
    icon: Truck, 
    bgColor: "bg-indigo-500/15", 
    textColor: "text-indigo-600 dark:text-indigo-400", 
    iconBg: "bg-indigo-500/20",
    progressColor: "bg-indigo-500",
    step: 3
  },
  delivered: { 
    label: "Livrée", 
    icon: CheckCircle, 
    bgColor: "bg-emerald-500/15", 
    textColor: "text-emerald-600 dark:text-emerald-400", 
    iconBg: "bg-emerald-500/20",
    progressColor: "bg-emerald-500",
    step: 4
  },
  cancelled: { 
    label: "Annulée", 
    icon: X, 
    bgColor: "bg-red-500/15", 
    textColor: "text-red-600 dark:text-red-400", 
    iconBg: "bg-red-500/20",
    progressColor: "bg-red-500",
    step: 0
  },
};

export const BuyerOrdersList = ({ orders, onCancelOrder, cancellingId }: BuyerOrdersListProps) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const navigate = useNavigate();

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
          imageMap[p.id] = getProductImage(p.images, 0);
        });
        setProductImages(imageMap);
      }
    };

    fetchProductImages();
  }, [orders]);

  const canCancelOrder = (status: string) => status === 'pending' || status === 'confirmed';

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const OrderProgress = ({ status }: { status: string }) => {
    const currentStep = statusConfig[status as keyof typeof statusConfig]?.step || 0;
    const progressColor = statusConfig[status as keyof typeof statusConfig]?.progressColor || 'bg-primary';

    if (status === 'cancelled') {
      return (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 bg-red-500/30 rounded-full overflow-hidden">
            <div className="h-full w-full bg-red-500 rounded-full" />
          </div>
          <span className="text-[10px] font-bold text-red-500">Annulée</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / 4) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full ${progressColor} rounded-full`}
          />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{currentStep}/4</span>
      </div>
    );
  };

  if (orders.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl border border-border/50 p-8 text-center"
      >
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl flex items-center justify-center mb-5">
          <Package className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Aucun achat</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          Vous n'avez pas encore passé de commande. Découvrez nos produits !
        </p>
        <Button 
          onClick={() => navigate('/marketplace')}
          className="h-12 px-8 rounded-2xl font-bold shadow-lg"
        >
          Découvrir les produits
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {orders.map((order, index) => {
          const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
          const StatusIcon = statusInfo.icon;
          const isExpanded = expandedOrderId === order.id;
          const productImage = productImages[order.product_id] || '/placeholder.svg';

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
              {/* Order Card Header */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleOrderExpand(order.id)}
                className="w-full p-3.5 flex gap-3.5 hover:bg-muted/20 active:bg-muted/40 transition-colors text-left"
              >
                {/* Product Image */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={productImage}
                    alt={order.product_title}
                    className="w-[72px] h-[72px] rounded-xl object-cover border border-border/30"
                    onError={(e) => handleImageError(e)}
                  />
                  <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center ${statusInfo.iconBg}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.textColor}`} />
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground line-clamp-2 leading-tight mb-1">{order.product_title}</p>
                      {order.shop_name && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); order.shop_slug && navigate(`/boutique/${order.shop_slug}`); }}
                          className="flex items-center gap-1.5 text-[11px] text-primary font-semibold hover:underline"
                        >
                          <Store className="w-3 h-3" />
                          {order.shop_name}
                        </button>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-primary text-base tabular-nums">{order.total_amount.toLocaleString()} F</p>
                      <span className="text-[10px] text-muted-foreground">×{order.quantity}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor} border-0 text-[10px] px-2 py-0.5 font-bold rounded-lg`}>
                      {statusInfo.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium">{formatDate(order.created_at)}</span>
                  </div>
                  
                  <OrderProgress status={order.status} />
                </div>
                
                {/* Expand Arrow */}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="self-center flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
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
                    <div className="px-3.5 pb-3.5 border-t border-border/40 bg-muted/10">
                      <div className="pt-3.5 space-y-3">
                        {/* Order ID & Date */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(order.created_at)} · {formatTime(order.created_at)}</span>
                          </div>
                        </div>

                        {/* Shop Card */}
                        {order.shop_name && (
                          <button 
                            onClick={() => order.shop_slug && navigate(`/boutique/${order.shop_slug}`)}
                            className="w-full bg-primary/5 hover:bg-primary/10 rounded-xl p-3 border border-primary/20 flex items-center gap-3 transition-colors active:scale-[0.98]"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                              <Store className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vendeur</p>
                              <p className="text-sm font-bold text-primary truncate">{order.shop_name}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-primary" />
                          </button>
                        )}

                        {/* Delivery Info Card */}
                        <div className="bg-card rounded-xl p-3 border border-border/40 space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Livraison</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-500" />
                              </div>
                              <span className="text-sm text-foreground font-medium truncate">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <Phone className="w-4 h-4 text-green-500" />
                              </div>
                              <span className="text-sm text-foreground font-medium tabular-nums">{order.customer_phone}</span>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-orange-500" />
                              </div>
                              <span className="text-sm text-foreground leading-relaxed">{order.delivery_location}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Total Card */}
                        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-3.5 border border-primary/20">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-foreground">Total payé</span>
                            <span className="text-xl font-bold text-primary tabular-nums">{order.total_amount.toLocaleString()} F</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/product/${order.product_id}`)}
                            className="flex-1 h-12 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir produit
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/messages`)}
                            className="flex-1 h-12 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
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
                                variant="destructive"
                                className="w-full h-12 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform"
                                disabled={cancellingId === order.id}
                              >
                                {cancellingId === order.id ? (
                                  <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Annulation...
                                  </span>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 mr-2" />
                                    Annuler la commande
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl mx-4">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Annuler cette commande ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. La commande sera définitivement annulée.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="rounded-xl h-11">Non, garder</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => onCancelOrder(order.id)}
                                  className="bg-destructive text-destructive-foreground rounded-xl h-11"
                                >
                                  Oui, annuler
                                </AlertDialogAction>
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
  );
};