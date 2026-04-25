import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Store, Filter, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStableRole } from "@/hooks/useStableRole";
import { BuyerOrdersList } from "@/components/orders/BuyerOrdersList";
import { SellerOrdersList } from "@/components/orders/SellerOrdersList";
import { Button } from "@/components/ui/button";

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
  customer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  is_confirmed_by_seller?: boolean;
  shop_name?: string;
  shop_slug?: string;
}

interface CancelOrderResponse {
  success: boolean;
  error?: string;
}

type OrdersTabsInitialTab = 'purchases' | 'sales';
type StatusFilter = 'all' | 'pending' | 'paid' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payées' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'shipped', label: 'En livraison' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
];

export const MyOrdersTabs = ({ initialTab }: { initialTab?: OrdersTabsInitialTab }) => {
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrdersTabsInitialTab>(initialTab ?? 'purchases');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { user } = useAuth();
  const { isSeller, loading: roleLoading } = useStableRole();
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_seller_orders');
      if (error) throw error;

      const purchases = (data || []).filter((order: Order) => order.customer_id === user.id);
      const sales = (data || []).filter((order: Order) => order.seller_id === user.id);

      if (purchases.length > 0) {
        const sellerIds = [...new Set(purchases.map((o: Order) => o.seller_id))];
        const { data: shops, error: shopsError } = await supabase
          .from('seller_shops')
          .select('seller_id, shop_name, shop_slug')
          .in('seller_id', sellerIds)
          .eq('is_active', true);
        if (shopsError) throw shopsError;

        const shopMap = new Map(
          (shops || []).map((s) => [
            s.seller_id,
            { shop_name: s.shop_name as string, shop_slug: s.shop_slug as string },
          ])
        );

        setBuyerOrders(
          purchases.map((order: Order) => ({
            ...order,
            shop_name: shopMap.get(order.seller_id)?.shop_name || 'Boutique',
            shop_slug: shopMap.get(order.seller_id)?.shop_slug || '',
          }))
        );
      } else {
        setBuyerOrders([]);
      }
      setSellerOrders(sales);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger vos commandes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchOrders();
  }, [user?.id, fetchOrders]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('my-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchOrders]);

  const cancelOrder = async (orderId: string) => {
    try {
      setCancellingId(orderId);
      const { data, error } = await supabase.rpc('cancel_order_by_customer', { order_id: orderId });
      if (error) throw error;
      const result = data as unknown as CancelOrderResponse;
      if (result?.success) {
        toast({ title: '✅ Commande annulée', description: 'Votre commande a été annulée avec succès' });
        fetchOrders();
      } else {
        throw new Error(result?.error || "Impossible d'annuler la commande");
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast({ title: 'Erreur', description: error?.message || "Impossible d'annuler la commande", variant: 'destructive' });
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) return null;

  if (loading || roleLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    );
  }

  const filterOrders = (orders: Order[]) => {
    if (statusFilter === 'all') return orders;
    return orders.filter(o => o.status === statusFilter);
  };

  const filteredBuyerOrders = filterOrders(buyerOrders);
  const filteredSellerOrders = filterOrders(sellerOrders);

  const totalBuyerOrders = buyerOrders.length;
  const totalSellerOrders = sellerOrders.length;
  const pendingBuyerOrders = buyerOrders.filter(o => o.status === 'pending').length;
  const pendingSellerOrders = sellerOrders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as OrdersTabsInitialTab); setStatusFilter('all'); }} className="w-full">
        <TabsList
          className={`grid w-full mb-3 bg-muted/40 rounded-2xl p-1.5 h-auto ${isSeller ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          <TabsTrigger
            value="purchases"
            className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md rounded-xl py-3 text-sm font-bold transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Mes commandes</span>
            {pendingBuyerOrders > 0 && (
              <Badge className="ml-1 h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border-0">
                {pendingBuyerOrders}
              </Badge>
            )}
          </TabsTrigger>

          {isSeller && (
            <TabsTrigger
              value="sales"
              className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md rounded-xl py-3 text-sm font-bold transition-all"
            >
              <Store className="h-4 w-4" />
              <span>Commandes reçues</span>
              {pendingSellerOrders > 0 && (
                <Badge className="ml-1 h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border-0 animate-pulse">
                  {pendingSellerOrders}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Status filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
              className={`flex-shrink-0 rounded-full text-xs h-8 px-3 font-semibold transition-all ${
                statusFilter === filter.value
                  ? 'shadow-sm'
                  : 'bg-card hover:bg-muted/80 border-border/50'
              }`}
            >
              {filter.value === 'pending' && <Clock className="w-3 h-3 mr-1" />}
              {filter.label}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <TabsContent value="purchases" className="mt-0">
            <motion.div
              key={`purchases-${statusFilter}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <BuyerOrdersList orders={filteredBuyerOrders} onCancelOrder={cancelOrder} cancellingId={cancellingId} />
            </motion.div>
          </TabsContent>

          {isSeller && (
            <TabsContent value="sales" className="mt-0">
              <motion.div
                key={`sales-${statusFilter}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <SellerOrdersList orders={filteredSellerOrders} onOrderUpdated={fetchOrders} />
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
};
