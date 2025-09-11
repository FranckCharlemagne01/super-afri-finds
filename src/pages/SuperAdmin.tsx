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
  Settings,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  MoreHorizontal
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { ProfileUpdateForm } from '@/components/ProfileUpdateForm';
import { PasswordUpdateForm } from '@/components/PasswordUpdateForm';
import { ProductEditDialog } from '@/components/ProductEditDialog';
import { UserDetailDialog } from '@/components/UserDetailDialog';

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
  description?: string;
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showProductEdit, setShowProductEdit] = useState(false);

  // Premier useEffect : gérer l'initialisation
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Deuxième useEffect : gérer la vérification du rôle et la redirection
  useEffect(() => {
    if (!initializing && !roleLoading) {
      if (!user) {
        navigate('/', { replace: true });
        return;
      }
      
      if (!isSuperAdmin()) {
        navigate('/', { replace: true });
        return;
      }
      
      // Si on arrive ici, l'utilisateur est bien un superadmin
      if (!dataLoaded) {
        fetchData();
      }
    }
  }, [user, isSuperAdmin, roleLoading, initializing, navigate, dataLoaded]);

  const fetchData = async () => {
    if (!user || !isSuperAdmin()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch statistics using the secure function and other data
      const [
        statisticsResult,
        productsData,
        ordersData
      ] = await Promise.all([
        supabase.rpc('get_admin_statistics'),
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100)
      ]);

      // Handle statistics result
      if (statisticsResult.error) {
        console.error('Error fetching statistics:', statisticsResult.error);
        // Fallback: set default stats if the secure function fails
        setStats({
          total_users: 0,
          total_sellers: 0,
          total_buyers: 0,
          total_active_products: 0,
          total_orders: 0,
          total_revenue: 0,
          orders_today: 0,
          new_users_today: 0
        });
      } else {
        const stats = statisticsResult.data?.[0];
        if (stats) {
          setStats({
            total_users: Number(stats.total_users) || 0,
            total_sellers: Number(stats.total_sellers) || 0,
            total_buyers: Number(stats.total_buyers) || 0,
            total_active_products: Number(stats.total_active_products) || 0,
            total_orders: Number(stats.total_orders) || 0,
            total_revenue: Number(stats.total_revenue) || 0,
            orders_today: Number(stats.orders_today) || 0,
            new_users_today: Number(stats.new_users_today) || 0
          });
        }
      }

      setProducts(productsData.data || []);
      setOrders(ordersData.data || []);
      
      // Get users with roles separately for better control
      const { data: allProfiles } = await supabase.from('profiles').select('*');
      const { data: allUserRoles } = await supabase.from('user_roles').select('user_id, role');
      
      // Transform profiles data to match expected format
      const transformedUsers = allProfiles?.map(profile => {
        const userRole = allUserRoles?.find(ur => ur.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email || '',
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          city: profile.city || '',
          country: profile.country || '',
          created_at: profile.created_at,
          role: userRole?.role || 'buyer'
        };
      }) || [];
      
      setUsers(transformedUsers);
      setDataLoaded(true);

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger certaines données. Accès partiel accordé.",
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

  const handleDeleteUser = async (userId: string) => {
    try {
      // First delete user roles
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Then delete profile
      await supabase.from('profiles').delete().eq('user_id', userId);
      
      // Remove from local state
      setUsers(users.filter(u => u.user_id !== userId));
      
      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur.",
        variant: "destructive",
      });
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      // Delete existing roles for this user
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role: newRole as 'buyer' | 'seller' | 'admin' | 'superadmin'
        });

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: "Succès",
        description: `Rôle mis à jour vers ${newRole}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de changer le rôle.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));

      toast({
        title: "Succès",
        description: "Produit supprimé avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit.",
        variant: "destructive",
      });
    }
  };

  // Afficher le loader pendant l'initialisation, la vérification du rôle, ou si ce n'est pas un superadmin
  if (initializing || roleLoading || !user || (!roleLoading && !isSuperAdmin())) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">
              {initializing ? "Initialisation..." : 
               roleLoading ? "Vérification des permissions..." : 
               !user ? "Authentification requise..." :
               "Accès refusé"}
            </p>
            <p className="text-sm text-muted-foreground">
              {!user ? "Redirection vers la page de connexion..." : "Accès au tableau de bord administrateur"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // À ce stade, on est sûr que l'utilisateur est un superadmin
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={async () => {
                await signOut();
                window.location.href = '/';
              }}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Gestion complète de la plateforme</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                SuperAdmin
              </Badge>
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
              )}
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
              {loading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total_active_products || 0}</div>
              )}
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
              {loading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
              )}
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
              {loading ? (
                <Skeleton className="h-8 w-20 mb-2" />
              ) : (
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('fr-FR').format(stats?.total_revenue || 0)} FCFA
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Commandes terminées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead className="hidden lg:table-cell">Ville</TableHead>
                        <TableHead className="hidden md:table-cell">Date d'inscription</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{user.full_name || 'Non renseigné'}</div>
                                <div className="text-xs text-muted-foreground md:hidden">
                                  {user.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'seller' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">{user.city || 'Non renseignée'}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                   <DropdownMenuItem onClick={() => {
                                     setSelectedUserId(user.user_id);
                                     setShowUserDetail(true);
                                   }}>
                                     <Eye className="w-4 h-4 mr-2" />
                                     Voir profil
                                   </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleChangeUserRole(user.user_id, user.role === 'seller' ? 'buyer' : 'seller')}>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Changer en {user.role === 'seller' ? 'Acheteur' : 'Vendeur'}
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteUser(user.user_id)}>
                                          Supprimer
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead className="hidden md:table-cell">Prix</TableHead>
                        <TableHead className="hidden lg:table-cell">Catégorie</TableHead>
                        <TableHead className="hidden md:table-cell">Stock</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="truncate max-w-[200px]">{product.title}</div>
                                <div className="text-xs text-muted-foreground md:hidden">
                                  {new Intl.NumberFormat('fr-FR').format(product.price)} FCFA
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {new Intl.NumberFormat('fr-FR').format(product.price)} FCFA
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">{product.category}</TableCell>
                            <TableCell className="hidden md:table-cell">{product.stock_quantity}</TableCell>
                            <TableCell>
                              <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                {product.is_active ? 'Actif' : 'Inactif'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                   <DropdownMenuItem onClick={() => navigate(`/product/${product.id}`)}>
                                     <Eye className="w-4 h-4 mr-2" />
                                     Voir détails
                                   </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => {
                                     setEditingProduct(product);
                                     setShowProductEdit(true);
                                   }}>
                                     <Edit className="w-4 h-4 mr-2" />
                                     Modifier
                                   </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleProductStatus(product.id, product.is_active)}>
                                    {product.is_active ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    {product.is_active ? 'Désactiver' : 'Activer'}
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                          Supprimer
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="hidden md:table-cell">Produit</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{order.customer_name}</div>
                                <div className="text-xs text-muted-foreground md:hidden truncate max-w-[150px]">
                                  {order.product_title}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="truncate max-w-[200px]">{order.product_title}</div>
                            </TableCell>
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
                            <TableCell className="hidden lg:table-cell">
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/order/${order.id}`)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                    disabled={order.status === 'completed'}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Marquer terminée
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Annuler
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance de la plateforme</CardTitle>
                  <CardDescription>
                    Métriques clés et tendances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Taux de conversion</span>
                      <span className="font-semibold">3.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Panier moyen</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('fr-FR').format(25000)} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Commissions collectées</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('fr-FR').format((stats?.total_revenue || 0) * 0.05)} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Produits les plus vendus</span>
                      <span className="font-semibold">Électronique</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                  <CardDescription>
                    Événements importants sur la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="text-sm">
                        <div className="font-medium">Nouveau vendeur approuvé</div>
                        <div className="text-muted-foreground">Il y a 2 heures</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                      <div className="text-sm">
                        <div className="font-medium">Pic de commandes détecté</div>
                        <div className="text-muted-foreground">Il y a 4 heures</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                      <Package className="w-4 h-4 text-yellow-600" />
                      <div className="text-sm">
                        <div className="font-medium">Stock faible alerté</div>
                        <div className="text-muted-foreground">Il y a 6 heures</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Rapport financier</CardTitle>
                  <CardDescription>
                    Vue d'ensemble des finances de la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat('fr-FR').format((stats?.total_revenue || 0) * 0.05)} FCFA
                      </div>
                      <div className="text-sm text-muted-foreground">Commissions (5%)</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('fr-FR').format((stats?.total_revenue || 0) * 0.95)} FCFA
                      </div>
                      <div className="text-sm text-muted-foreground">Revenus vendeurs</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats?.total_orders || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Transactions totales</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du profil</CardTitle>
                  <CardDescription>
                    Modifiez vos informations personnelles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProfileUpdateForm />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>
                    Modifiez votre mot de passe pour sécuriser votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordUpdateForm />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ProductEditDialog
        product={editingProduct}
        open={showProductEdit}
        onOpenChange={setShowProductEdit}
        onProductUpdated={(updatedProduct) => {
          setProducts(products.map(p => 
            p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
          ));
        }}
      />

      <UserDetailDialog
        userId={selectedUserId}
        open={showUserDetail}
        onOpenChange={setShowUserDetail}
      />
    </div>
  );
};

export default SuperAdmin;