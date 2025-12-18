import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShoppingBag, Store, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStableRole } from "@/hooks/useStableRole";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
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

const MyOrders = () => {
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('purchases');
  const { user } = useAuth();
  const { isSeller, loading: roleLoading } = useStableRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  // Real-time subscription for orders
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('my-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('🔄 Realtime order change:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_seller_orders');
      
      if (error) throw error;
      
      // Séparer les commandes acheteur et vendeur
      const purchases = data?.filter((order: Order) => order.customer_id === user.id) || [];
      const sales = data?.filter((order: Order) => order.seller_id === user.id) || [];
      
      // Enrichir les achats avec les infos de boutique
      if (purchases.length > 0) {
        const sellerIds = [...new Set(purchases.map((o: Order) => o.seller_id))];
        const { data: shops } = await supabase
          .from('seller_shops')
          .select('seller_id, shop_name, shop_slug')
          .in('seller_id', sellerIds)
          .eq('is_active', true);
        
        const shopMap = new Map(shops?.map(s => [s.seller_id, { shop_name: s.shop_name, shop_slug: s.shop_slug }]) || []);
        
        const enrichedPurchases = purchases.map((order: Order) => ({
          ...order,
          shop_name: shopMap.get(order.seller_id)?.shop_name || 'Boutique',
          shop_slug: shopMap.get(order.seller_id)?.shop_slug || '',
        }));
        
        setBuyerOrders(enrichedPurchases);
      } else {
        setBuyerOrders([]);
      }
      
      setSellerOrders(sales);
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
  }, [user?.id]);

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

  if (loading || roleLoading) {
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

  const totalBuyerOrders = buyerOrders.length;
  const totalSellerOrders = sellerOrders.length;

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
            <p className="text-xs text-muted-foreground">Suivez vos achats et ventes</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-9 px-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary mr-1.5" />
              <span className="text-sm font-bold text-primary tabular-nums">{totalBuyerOrders + totalSellerOrders}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 max-w-lg mx-auto lg:max-w-2xl">
        {/* Tabs for Buyer/Seller */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full mb-4 bg-muted/50 rounded-xl p-1 ${isSeller ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger 
              value="purchases" 
              className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg py-2.5 text-sm font-semibold transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Mes Achats</span>
              {totalBuyerOrders > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-bold">
                  {totalBuyerOrders}
                </Badge>
              )}
            </TabsTrigger>
            
            {isSeller && (
              <TabsTrigger 
                value="sales" 
                className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg py-2.5 text-sm font-semibold transition-all"
              >
                <Store className="h-4 w-4" />
                <span>Mes Ventes</span>
                {totalSellerOrders > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-bold">
                    {totalSellerOrders}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Buyer Orders Tab */}
          <TabsContent value="purchases" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <BuyerOrdersList 
                orders={buyerOrders} 
                onCancelOrder={cancelOrder}
                cancellingId={cancellingId}
              />
            </motion.div>
          </TabsContent>

          {/* Seller Orders Tab */}
          {isSeller && (
            <TabsContent value="sales" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SellerOrdersList 
                  orders={sellerOrders}
                  onOrderUpdated={fetchOrders}
                />
              </motion.div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default MyOrders;
