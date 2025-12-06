import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Search, Filter, Package, Truck, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  product_title: string;
  total_amount: number;
  status: string;
  created_at: string;
  seller_id: string;
  delivery_location: string;
  quantity: number;
}

interface OrdersManagementProps {
  orders: Order[];
  onRefresh: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
  shipped: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800 border-green-300', icon: Package },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
  completed: { label: 'Complétée', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
};

export const OrdersManagement = ({ orders, onRefresh }: OrdersManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.rpc('update_order_status', {
        order_id: orderId,
        new_status: newStatus
      });

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `La commande a été marquée comme "${statusConfig[newStatus]?.label}"`,
      });

      onRefresh();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} border flex items-center gap-1.5 font-medium`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <>
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Gestion des Commandes</CardTitle>
              <CardDescription>
                Suivi complet du cycle de vie des commandes
              </CardDescription>
            </div>
            <Button onClick={onRefresh} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par client, produit ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous ({orderCounts.all})</SelectItem>
                <SelectItem value="pending">En attente ({orderCounts.pending})</SelectItem>
                <SelectItem value="confirmed">Confirmées ({orderCounts.confirmed})</SelectItem>
                <SelectItem value="shipped">Expédiées ({orderCounts.shipped})</SelectItem>
                <SelectItem value="delivered">Livrées ({orderCounts.delivered})</SelectItem>
                <SelectItem value="cancelled">Annulées ({orderCounts.cancelled})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Client</TableHead>
                  <TableHead className="font-semibold">Produit</TableHead>
                  <TableHead className="font-semibold text-right">Montant</TableHead>
                  <TableHead className="font-semibold">Statut</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Aucune commande trouvée</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {order.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium truncate max-w-[200px]">{order.product_title}</p>
                          <p className="text-xs text-muted-foreground">Qté: {order.quantity}</p>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {parseFloat(String(order.total_amount)).toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), 'HH:mm', { locale: fr })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la Commande</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">ID Commande</p>
                  <p className="font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Statut</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-sm">Informations Client</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nom</p>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedOrder.customer_phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Adresse de livraison</p>
                    <p className="font-medium">{selectedOrder.delivery_location}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-sm">Produit</h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="font-medium">{selectedOrder.product_title}</p>
                  <div className="flex justify-between mt-2 text-sm">
                    <span>Quantité: {selectedOrder.quantity}</span>
                    <span className="font-semibold">
                      {parseFloat(String(selectedOrder.total_amount)).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-sm">Actions Admin</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedOrder.status === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(selectedOrder.id, status)}
                      disabled={selectedOrder.status === status}
                      className="text-xs"
                    >
                      {statusConfig[status]?.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
