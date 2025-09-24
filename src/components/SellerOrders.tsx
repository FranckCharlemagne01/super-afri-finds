import { useState, useEffect, useCallback } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableData } from '@/hooks/useStableData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Package, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OrderDetailDialog } from './OrderDetailDialog';
import { SmoothListSkeleton } from '@/components/ui/smooth-skeleton';

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

  // Utiliser useStableData pour les commandes avec gestion d'erreurs silencieuses
  const { data: orders, loading, error, refetch } = useStableData(
    async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase.rpc('get_seller_orders');
      if (error) throw error;
      return data || [];
    },
    [user?.id],
    {
      keepPreviousData: true,
      loadingDelay: 250,
      debounceMs: 200
    }
  );

  // Gestion discrète des erreurs
  useEffect(() => {
    if (error && !loading) {
      console.error('Error loading orders:', error);
      // Ne pas afficher de toast sauf si vraiment nécessaire
      if (!orders || orders.length === 0) {
        toast({
          title: "Chargement...",
          description: "Connexion en cours, veuillez patienter",
          variant: "default",
        });
      }
    }
  }, [error, loading, orders, toast]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
  };

  const handleOrderUpdated = () => {
    refetch();
  };

  const getStatusBadgeVariant = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  if (loading) {
    return <SmoothListSkeleton items={3} variant="list" className="prevent-flash" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Commandes Clients</h2>
        <Badge variant="secondary">
          {(orders || []).length} commande{(orders || []).length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune commande reçue.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Les commandes apparaîtront ici une fois que les clients auront passé des commandes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 prevent-flash">
          {(orders || []).map((order) => (
            <Card key={order.id} className="border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-muted/30 to-muted/10">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Commande #{order.id.slice(-8)}
                  </CardTitle>
                  <Badge variant={getStatusBadgeVariant(order.status)} className="w-fit">
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(order.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Product Info */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">{order.product_title}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Quantité: {order.quantity}</span>
                    <span>Total: {order.total_amount.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Informations client - conserve la couleur demandée */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <p className="font-semibold text-orange-900">Client: {order.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-medium text-orange-800">📞 {order.customer_phone}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">
                          📍 Adresse de livraison
                        </p>
                        <p className="text-sm font-medium text-orange-900 whitespace-pre-wrap break-words bg-white/70 p-3 rounded border border-orange-200">
                          {order.delivery_location}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <Button 
                  onClick={() => handleOrderClick(order)}
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir les détails et gérer
                </Button>
              </CardContent>
            </Card>
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