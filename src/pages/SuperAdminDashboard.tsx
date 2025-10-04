import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, ShoppingBag, TrendingUp, DollarSign, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TokenTransactionsSuperAdmin } from '@/components/TokenTransactionsSuperAdmin';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  country: string;
  role: string;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  seller_id: string;
  is_active: boolean;
  created_at: string;
  stock_quantity: number;
}

interface Order {
  id: string;
  customer_name: string;
  product_title: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  total_sellers: number;
  total_buyers: number;
  total_active_products: number;
  total_orders: number;
  total_revenue: number;
  orders_today: number;
  new_users_today: number;
  total_tokens_revenue: number;
  total_tokens_distributed: number;
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions pour accéder à cette page.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin, roleLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users with roles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          full_name,
          phone,
          country,
          created_at,
          user_roles(role)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Transform the data to flatten the role
      const transformedUsers = usersData?.map(user => ({
        ...user,
        role: (user as any).user_roles?.[0]?.role || 'buyer'
      })) || [];

      setUsers(transformedUsers);

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
        .limit(50);

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch token transactions for stats
      const { data: tokenTransactions, error: tokenError } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('transaction_type', 'purchase')
        .eq('status', 'completed');

      if (tokenError) throw tokenError;

      // Calculate stats manually since we can't use the view with RLS issues
      const statsData: AdminStats = {
        total_users: transformedUsers.length,
        total_sellers: transformedUsers.filter(u => u.role === 'seller').length,
        total_buyers: transformedUsers.filter(u => u.role === 'buyer').length,
        total_active_products: (productsData || []).filter(p => p.is_active).length,
        total_orders: (ordersData || []).length,
        total_revenue: (ordersData || [])
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + parseFloat(String(o.total_amount || '0')), 0),
        orders_today: (ordersData || []).filter(o => 
          new Date(o.created_at).toDateString() === new Date().toDateString()
        ).length,
        new_users_today: transformedUsers.filter(u => 
          new Date(u.created_at).toDateString() === new Date().toDateString()
        ).length,
        total_tokens_revenue: (tokenTransactions || [])
          .reduce((sum, t) => sum + parseFloat(String(t.price_paid || '0')), 0),
        total_tokens_distributed: (tokenTransactions || [])
          .reduce((sum, t) => sum + parseInt(String(t.tokens_amount || '0')), 0),
      };

      setStats(statsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'administration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(p => 
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ));

      toast({
        title: "Produit mis à jour",
        description: `Le produit a été ${!currentStatus ? 'activé' : 'désactivé'}.`,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit.",
        variant: "destructive",
      });
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">SuperAdmin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Gestion complète de la plateforme Djassa</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_users}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.new_users_today} aujourd'hui
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produits Actifs</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_active_products}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total_sellers} vendeurs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_orders}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.orders_today} aujourd'hui
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus Produits</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_revenue.toLocaleString()} FCFA</div>
                  <p className="text-xs text-muted-foreground">
                    Commandes complétées
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Token Stats - Nouvelle section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus Jetons</CardTitle>
                  <DollarSign className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">
                    {stats.total_tokens_revenue.toLocaleString()} FCFA
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ventes de jetons (Test & Live)
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jetons Distribués</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.total_tokens_distributed.toLocaleString()} Jetons
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total des achats vendeurs
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Tabs Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="tokens">Jetons</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Utilisateurs</CardTitle>
                <CardDescription>
                  Liste complète des utilisateurs inscrits sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Pays</TableHead>
                      <TableHead>Inscription</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'superadmin' ? 'destructive' :
                            user.role === 'admin' ? 'default' :
                            user.role === 'seller' ? 'secondary' : 'outline'
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.country}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
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

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Produits</CardTitle>
                <CardDescription>
                  Supervision de tous les produits publiés sur la plateforme
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
                        <TableCell className="font-medium">{product.title}</TableCell>
                        <TableCell>{product.price.toLocaleString()} FCFA</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? 'default' : 'secondary'}>
                            {product.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleProductStatus(product.id, product.is_active)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4" />
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

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Suivi des Commandes</CardTitle>
                <CardDescription>
                  Aperçu des ventes et commandes sur la plateforme
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{order.product_title}</TableCell>
                        <TableCell>{parseFloat(String(order.total_amount)).toLocaleString()} FCFA</TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'pending' ? 'secondary' : 'outline'
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens">
            <Card>
              <CardHeader>
                <CardTitle>Transactions de Jetons</CardTitle>
                <CardDescription>
                  Historique complet des achats de jetons par les vendeurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TokenTransactionsSuperAdmin />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;