import { useState, useEffect, useCallback } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
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
  const { user } = useOptimizedAuth();
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
            <Card key={order.id} className="border-0 shadow-md hover:shadow-lg card-hover cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Commande #{order.id.slice(-8)}
                  </CardTitle>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
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

                {/* Client preview */}
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="font-medium">Client: {order.customer_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    Livraison: {order.delivery_location.substring(0, 50)}...
                  </p>
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