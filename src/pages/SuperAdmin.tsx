import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Package, 
  TrendingUp, 
  ArrowLeft, 
  Eye,
  Edit,
  Trash2,
  DollarSign,
  ShoppingBag,
  UserPlus,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

interface AdminStats {
  total_users: number;
  total_sellers: number;
  total_buyers: number;
  total_active_products: number;
  total_orders: number;
  total_revenue: number;
  orders_today: number;
  new_users_today: number;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  city: string;
  country: string;
  created_at: string;
  role: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  seller_id: string;
}

interface Order {
  id: string;
  customer_name: string;
  product_title: string;
  total_amount: number;
  status: string;
  created_at: string;
  seller_id: string;
}

const SuperAdmin = () => {
  const { isSuperAdmin, loading: roleLoading } = useRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin()) {
      navigate('/');
      return;
    }

    if (isSuperAdmin()) {
      fetchData();
    }
  }, [isSuperAdmin, roleLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics
      const { data: statsData, error: statsError } = await supabase
        .from('admin_statistics')
        .select('*')
        .single();
      
      if (statsError) throw statsError;
      setStats(statsData);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users_with_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données administrateur.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(p => 
        p.id === productId ? { ...p, is_active: !isActive } : p
      ));

      toast({
        title: "Succès",
        description: `Produit ${!isActive ? 'activé' : 'désactivé'} avec succès.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut du produit.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));

      toast({
        title: "Succès",
        description: "Statut de la commande mis à jour.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">SuperAdmin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Gestion complète de la plateforme</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                SUPER ADMIN
              </Badge>
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.new_users_today || 0} aujourd'hui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits Actifs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_active_products || 0}</div>
              <p className="text-xs text-muted-foreground">
                Vendeurs: {stats?.total_sellers || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes Total</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.orders_today || 0} aujourd'hui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR').format(stats?.total_revenue || 0)} FCFA
              </div>
              <p className="text-xs text-muted-foreground">
                Commandes terminées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Utilisateurs</CardTitle>
                <CardDescription>
                  Liste de tous les utilisateurs inscrits sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Date d'inscription</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || 'Non renseigné'}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'seller' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.city || 'Non renseignée'}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Produits</CardTitle>
                <CardDescription>
                  Liste de tous les produits publiés sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.title}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('fr-FR').format(product.price)} FCFA
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? 'default' : 'secondary'}>
                            {product.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleToggleProductStatus(product.id, product.is_active)}
                            >
                              {product.is_active ? 'Désactiver' : 'Activer'}
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Commandes</CardTitle>
                <CardDescription>
                  Suivi de toutes les commandes sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.customer_name}
                        </TableCell>
                        <TableCell>{order.product_title}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('fr-FR').format(Number(order.total_amount))} FCFA
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              order.status === 'completed' ? 'default' : 
                              order.status === 'pending' ? 'secondary' : 'destructive'
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                              disabled={order.status === 'completed'}
                            >
                              Valider
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdmin;