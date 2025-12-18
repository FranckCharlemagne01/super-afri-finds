import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStableRole } from "@/hooks/useStableRole";
import { BuyerOrdersList } from "@/components/orders/BuyerOrdersList";
import { SellerOrdersList } from "@/components/orders/SellerOrdersList";

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

export const MyOrdersTabs = ({ initialTab }: { initialTab?: OrdersTabsInitialTab }) => {
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrdersTabsInitialTab>(initialTab ?? 'purchases');

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
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos commandes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchOrders();
  }, [user?.id, fetchOrders]);

  // Real-time subscription for orders
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('my-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchOrders]);

  const cancelOrder = async (orderId: string) => {
    try {
      setCancellingId(orderId);
      const { data, error } = await supabase.rpc('cancel_order_by_customer', { order_id: orderId });
      if (error) throw error;

      const result = data as unknown as CancelOrderResponse;

      if (result?.success) {
        toast({
          title: '✅ Commande annulée',
          description: 'Votre commande a été annulée avec succès',
        });
        fetchOrders();
      } else {
        throw new Error(result?.error || "Impossible d'annuler la commande");
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Erreur',
        description: error?.message || "Impossible d'annuler la commande",
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  // If embedded somewhere without a logged-in user, keep it silent (avoid redirect loops)
  if (!user) return null;

  if (loading || roleLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-muted rounded-2xl animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  const totalBuyerOrders = buyerOrders.length;
  const totalSellerOrders = sellerOrders.length;

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrdersTabsInitialTab)} className="w-full">
      <TabsList
        className={`grid w-full mb-4 bg-muted/40 rounded-2xl p-1.5 h-auto ${
          isSeller ? 'grid-cols-2' : 'grid-cols-1'
        }`}
      >
        <TabsTrigger
          value="purchases"
          className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md rounded-xl py-3 text-sm font-bold transition-all"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Mes Achats</span>
          {totalBuyerOrders > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-primary/15 text-primary"
            >
              {totalBuyerOrders}
            </Badge>
          )}
        </TabsTrigger>

        {isSeller && (
          <TabsTrigger
            value="sales"
            className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md rounded-xl py-3 text-sm font-bold transition-all"
          >
            <Store className="h-4 w-4" />
            <span>Mes Ventes</span>
            {totalSellerOrders > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-primary/15 text-primary"
              >
                {totalSellerOrders}
              </Badge>
            )}
          </TabsTrigger>
        )}
      </TabsList>

      <AnimatePresence mode="wait">
        <TabsContent value="purchases" className="mt-0">
          <motion.div 
            key="purchases"
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <BuyerOrdersList orders={buyerOrders} onCancelOrder={cancelOrder} cancellingId={cancellingId} />
          </motion.div>
        </TabsContent>

        {isSeller && (
          <TabsContent value="sales" className="mt-0">
            <motion.div 
              key="sales"
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SellerOrdersList orders={sellerOrders} onOrderUpdated={fetchOrders} />
            </motion.div>
          </TabsContent>
        )}
      </AnimatePresence>
    </Tabs>
  );
};
