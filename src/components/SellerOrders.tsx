import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Package, User, MapPin, Phone, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      // Utiliser la nouvelle fonction sécurisée qui masque les données sensibles
      const { data, error } = await supabase
        .rpc('get_seller_orders');

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      // Utiliser la fonction sécurisée pour mettre à jour le statut
      const { data, error } = await supabase
        .rpc('update_order_status', {
          order_id: orderId,
          new_status: newStatus
        });

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `La commande a été marquée comme "${statusLabels[newStatus as keyof typeof statusLabels]}"`,
      });

      // Rafraîchir les données depuis le serveur pour obtenir les données masquées
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Commandes Clients</h2>
        <Badge variant="secondary">
          {orders.length} commande{orders.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {orders.length === 0 ? (
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
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="border-0 shadow-md">
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
                    <span>Prix unitaire: {order.product_price.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Informations client - présentation professionnelle */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-lg text-foreground">Informations Client</h4>
                  </div>
                  
                  {/* Nom complet */}
                  <div className="mb-4 p-4 bg-card border-l-4 border-primary rounded-lg shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Nom et Prénom
                        </label>
                        <p className="text-lg font-bold text-foreground mt-1">{order.customer_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-card border border-border rounded-lg shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-secondary/10 rounded-md">
                          <Phone className="h-4 w-4 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Téléphone
                          </label>
                          <p className="text-base font-semibold text-foreground mt-1 break-all">{order.customer_phone}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-card border border-border rounded-lg shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-accent/10 rounded-md">
                          <DollarSign className="h-4 w-4 text-accent" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Total Commande
                          </label>
                          <p className="text-lg font-bold text-primary mt-1">
                            {order.total_amount.toLocaleString()} FCFA
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adresse de livraison */}
                  <div className="p-4 bg-card border border-border rounded-lg shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-destructive/10 rounded-md">
                        <MapPin className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Adresse de Livraison
                        </label>
                        <p className="text-base font-semibold text-foreground mt-1 leading-relaxed">{order.delivery_location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                     
                 {/* Status Update */}
                 <div className="border-t pt-4 space-y-2">
                   <label className="text-sm font-medium">Statut:</label>
                   <Select
                     value={order.status}
                     onValueChange={(value) => updateOrderStatus(order.id, value)}
                     disabled={updatingStatus === order.id}
                   >
                     <SelectTrigger className="w-full">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="pending">En attente</SelectItem>
                       <SelectItem value="confirmed">Confirmée</SelectItem>
                       <SelectItem value="processing">En préparation</SelectItem>
                       <SelectItem value="shipped">Expédiée</SelectItem>
                       <SelectItem value="delivered">Livrée</SelectItem>
                       <SelectItem value="cancelled">Annulée</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};