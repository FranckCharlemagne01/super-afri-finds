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

                {/* Informations client - présentation professionnelle et claire */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-xl font-bold text-foreground">Informations de Contact Client</h4>
                  </div>
                  
                  {/* Grille d'informations organisée */}
                  <div className="space-y-4">
                    {/* Nom complet */}
                    <div className="p-5 bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-primary rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/15 rounded-lg">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-sm font-bold text-primary uppercase tracking-wide mb-1">
                            Nom et Prénom Complet
                          </label>
                          <p className="text-xl font-bold text-foreground break-words">{order.customer_name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Téléphone et Total */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="p-5 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-green-200 rounded-lg">
                            <Phone className="h-5 w-5 text-green-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="block text-sm font-bold text-green-700 uppercase tracking-wide mb-1">
                              Numéro de Téléphone
                            </label>
                            <p className="text-lg font-bold text-green-900 break-all">{order.customer_phone}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-5 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-orange-200 rounded-lg">
                            <DollarSign className="h-5 w-5 text-orange-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="block text-sm font-bold text-orange-700 uppercase tracking-wide mb-1">
                              Total de la Commande
                            </label>
                            <div className="space-y-1">
                              <p className="text-sm text-orange-600">
                                {order.quantity} × {order.product_price.toLocaleString()} FCFA
                              </p>
                              <p className="text-2xl font-bold text-orange-900">
                                {order.total_amount.toLocaleString()} FCFA
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Adresse de livraison complète */}
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-200 rounded-lg">
                          <MapPin className="h-5 w-5 text-blue-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
                            Adresse de Livraison Complète
                          </label>
                          <p className="text-lg font-semibold text-blue-900 leading-relaxed whitespace-pre-wrap break-words">
                            {order.delivery_location}
                          </p>
                        </div>
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