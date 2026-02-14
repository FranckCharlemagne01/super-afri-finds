import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableRole } from '@/hooks/useStableRole';
import { useStableAuth } from '@/hooks/useStableAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Package, TrendingUp, Eye, Edit, Trash2, DollarSign, ShoppingBag, 
  UserPlus, Settings, CheckCircle, XCircle, UserCheck, UserX, MoreHorizontal,
  LogOut, Building2, ArrowRightLeft, RefreshCw, Store
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { sendPushNotification } from '@/utils/pushNotifications';
import { ProfileUpdateForm } from '@/components/ProfileUpdateForm';
import { PasswordUpdateForm } from '@/components/PasswordUpdateForm';
import { ProductEditDialog } from '@/components/ProductEditDialog';
import { UserDetailDialog } from '@/components/UserDetailDialog';
import { SuperAdminSettingsDialog } from '@/components/SuperAdminSettingsDialog';
import { AdminTokenManagement } from '@/components/superadmin/AdminTokenManagement';
import { SecurityDashboard } from '@/components/superadmin/SecurityDashboard';
import { SuperAdminSidebar, type AdminSection } from '@/components/superadmin/SuperAdminSidebar';
import { SuperAdminOverview } from '@/components/superadmin/SuperAdminOverview';
import { MarketingDashboard } from '@/components/superadmin/MarketingDashboard';
import { AdminShops } from '@/components/AdminShops';

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
  const { isSuperAdmin, isSuperAdminBusiness, loading: roleLoading } = useStableRole();
  const { user, signOut } = useStableAuth();
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
  const [showSettings, setShowSettings] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setInitializing(false), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!initializing && !roleLoading) {
      if (!user || !isSuperAdmin) {
        navigate('/', { replace: true });
        return;
      }
      if (!dataLoaded) fetchData();
    }
  }, [user, isSuperAdmin, roleLoading, initializing, navigate, dataLoaded]);

  const fetchData = async () => {
    if (!user || !isSuperAdmin) { setLoading(false); return; }
    try {
      setLoading(true);
      const [statisticsResult, productsData, ordersData] = await Promise.all([
        supabase.rpc('get_admin_statistics'),
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.rpc('get_recent_orders_superadmin', { _limit: 100 })
      ]);

      if (statisticsResult.error) {
        setStats({ total_users: 0, total_sellers: 0, total_buyers: 0, total_active_products: 0, total_orders: 0, total_revenue: 0, orders_today: 0, new_users_today: 0 });
      } else {
        const s = statisticsResult.data?.[0];
        if (s) setStats({
          total_users: Number(s.total_users) || 0, total_sellers: Number(s.total_sellers) || 0,
          total_buyers: Number(s.total_buyers) || 0, total_active_products: Number(s.total_active_products) || 0,
          total_orders: Number(s.total_orders) || 0, total_revenue: Number(s.total_revenue) || 0,
          orders_today: Number(s.orders_today) || 0, new_users_today: Number(s.new_users_today) || 0,
        });
      }
      setProducts(productsData.data || []);
      setOrders(ordersData.data || []);

      const { data: transformedUsers, error: usersError } = await supabase.rpc('get_users_with_profiles');
      if (usersError) {
        toast({ title: "Erreur", description: "Impossible de charger les utilisateurs", variant: "destructive" });
        return;
      }
      setUsers(transformedUsers || []);
      setDataLoaded(true);
    } catch (error: any) {
      toast({ title: "Erreur", description: "Impossible de charger certaines données.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: !isActive }).eq('id', productId);
      if (error) throw error;
      setProducts(products.map(p => p.id === productId ? { ...p, is_active: !isActive } : p));
      toast({ title: "Succès", description: `Produit ${!isActive ? 'activé' : 'désactivé'} avec succès.` });
    } catch { toast({ title: "Erreur", description: "Impossible de modifier le statut du produit.", variant: "destructive" }); }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { data: orderData, error: orderFetchError } = await supabase.rpc('get_order_for_superadmin', { _order_id: orderId });
      if (orderFetchError) throw orderFetchError;
      const orderRow = orderData?.[0];
      const { error } = await supabase.rpc('update_order_status', { order_id: orderId, new_status: newStatus });
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      await sendPushNotification(supabase, {
        user_id: orderRow.customer_id, title: `📦 Statut de commande: ${newStatus}`,
        body: `Votre commande "${orderRow.product_title}" a changé de statut: ${newStatus}`,
        url: '/my-orders', tag: 'order_status',
      });
      toast({ title: "Succès", description: "Statut de la commande mis à jour." });
    } catch { toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" }); }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('delete_user_profile_and_roles', { target_user_id: userId });
      if (error) throw error;
      setUsers(users.filter(u => u.user_id !== userId));
      toast({ title: "Succès", description: "Utilisateur supprimé avec succès." });
    } catch { toast({ title: "Erreur", description: "Impossible de supprimer l'utilisateur.", variant: "destructive" }); }
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole as 'buyer' | 'seller' | 'admin' | 'superadmin' });
      if (error) throw error;
      setUsers(users.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
      toast({ title: "Succès", description: `Rôle mis à jour vers ${newRole}.` });
    } catch { toast({ title: "Erreur", description: "Impossible de changer le rôle.", variant: "destructive" }); }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== productId));
      toast({ title: "Succès", description: "Produit supprimé avec succès." });
    } catch { toast({ title: "Erreur", description: "Impossible de supprimer le produit.", variant: "destructive" }); }
  };

  if (initializing || roleLoading || !user || (!roleLoading && !isSuperAdmin)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            {initializing ? "Initialisation..." : roleLoading ? "Vérification des permissions..." : !user ? "Authentification requise..." : "Accès refusé"}
          </p>
        </div>
      </div>
    );
  }

  const sectionTitle: Record<AdminSection, string> = {
    overview: 'Dashboard', shops: 'Boutiques', products: 'Produits', orders: 'Commandes',
    users: 'Utilisateurs', tokens: 'Jetons', analytics: 'Analytics', marketing: 'Marketing & Affiliés',
    security: 'Sécurité', logs: 'Logs & Audit Trail', settings: 'Paramètres', profile: 'Profil SuperAdmin',
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <SuperAdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isDark={isDark}
        onToggleDark={toggleDark}
        onSignOut={async () => { await signOut(); navigate('/'); }}
        isSuperAdminBusiness={isSuperAdminBusiness}
        onNavigateBusiness={() => navigate('/business-dashboard')}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
            {/* Left spacer for mobile hamburger */}
            <div className="w-10 lg:hidden" />
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground">{sectionTitle[activeSection]}</h1>
              <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-semibold">
                SuperAdmin
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={fetchData} className="gap-2 text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Actualiser</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-xs text-muted-foreground hover:text-foreground">
                Retour au site
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Overview */}
          {activeSection === 'overview' && (
            <SuperAdminOverview stats={stats} loading={loading} onNavigate={setActiveSection} />
          )}

          {/* Shops */}
          {activeSection === 'shops' && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Gestion des Boutiques</CardTitle>
                <CardDescription>Liste des boutiques vendeurs</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminShops />
              </CardContent>
            </Card>
          )}

          {/* Products */}
          {activeSection === 'products' && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Gestion des Produits</CardTitle>
                <CardDescription>Liste de tous les produits publiés sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6">
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
                          <TableRow key={product.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              <div>
                                <div className="truncate max-w-[200px]">{product.title}</div>
                                <div className="text-xs text-muted-foreground md:hidden">
                                  {new Intl.NumberFormat('fr-FR').format(product.price)} FCFA
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{new Intl.NumberFormat('fr-FR').format(product.price)} FCFA</TableCell>
                            <TableCell className="hidden lg:table-cell">{product.category}</TableCell>
                            <TableCell className="hidden md:table-cell">{product.stock_quantity}</TableCell>
                            <TableCell>
                              <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                {product.is_active ? 'Actif' : 'Inactif'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/product/${product.id}`)}>
                                    <Eye className="w-4 h-4 mr-2" />Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setEditingProduct(product); setShowProductEdit(true); }}>
                                    <Edit className="w-4 h-4 mr-2" />Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleProductStatus(product.id, product.is_active)}>
                                    {product.is_active ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    {product.is_active ? 'Désactiver' : 'Activer'}
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />Supprimer
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
                                        <AlertDialogDescription>Êtes-vous sûr ? Cette action est irréversible.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Supprimer</AlertDialogAction>
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
          )}

          {/* Orders */}
          {activeSection === 'orders' && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Gestion des Commandes</CardTitle>
                <CardDescription>Suivi de toutes les commandes sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6">
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
                          <TableRow key={order.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              <div>
                                <div>{order.customer_name}</div>
                                <div className="text-xs text-muted-foreground md:hidden truncate max-w-[150px]">{order.product_title}</div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="truncate max-w-[200px]">{order.product_title}</div>
                            </TableCell>
                            <TableCell>{new Intl.NumberFormat('fr-FR').format(Number(order.total_amount))} FCFA</TableCell>
                            <TableCell>
                              <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px]">
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">{new Date(order.created_at).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/order/${order.id}`)}>
                                    <Eye className="w-4 h-4 mr-2" />Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'completed')} disabled={order.status === 'completed'}>
                                    <CheckCircle className="w-4 h-4 mr-2" />Marquer terminée
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}>
                                    <XCircle className="w-4 h-4 mr-2" />Annuler
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
          )}

          {/* Users */}
          {activeSection === 'users' && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Gestion des Utilisateurs</CardTitle>
                <CardDescription>Liste de tous les utilisateurs inscrits sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead className="hidden lg:table-cell">Ville</TableHead>
                        <TableHead className="hidden md:table-cell">Inscription</TableHead>
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
                          <TableRow key={user.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              <div>
                                <div>{user.full_name || 'Non renseigné'}</div>
                                <div className="text-xs text-muted-foreground md:hidden">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'seller' ? 'default' : 'secondary'} className="text-[10px]">{user.role}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">{user.city || 'Non renseignée'}</TableCell>
                            <TableCell className="hidden md:table-cell">{new Date(user.created_at).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedUserId(user.user_id); setShowUserDetail(true); }}>
                                    <Eye className="w-4 h-4 mr-2" />Voir profil
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleChangeUserRole(user.user_id, user.role === 'seller' ? 'buyer' : 'seller')}>
                                    <UserCheck className="w-4 h-4 mr-2" />Changer en {user.role === 'seller' ? 'Acheteur' : 'Vendeur'}
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="w-4 h-4 mr-2" />Supprimer
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                                        <AlertDialogDescription>Êtes-vous sûr ? Cette action est irréversible.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteUser(user.user_id)}>Supprimer</AlertDialogAction>
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
          )}

          {/* Tokens */}
          {activeSection === 'tokens' && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Gestion des Jetons</CardTitle>
                <CardDescription>Ajuster manuellement les jetons des vendeurs</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminTokenManagement />
              </CardContent>
            </Card>
          )}

          {/* Analytics */}
          {activeSection === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Performance</CardTitle>
                  <CardDescription>Métriques clés et tendances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Taux de conversion', value: '3.2%' },
                      { label: 'Panier moyen', value: `${new Intl.NumberFormat('fr-FR').format(25000)} FCFA` },
                      { label: 'Commissions collectées', value: `${new Intl.NumberFormat('fr-FR').format((stats?.total_revenue || 0) * 0.05)} FCFA` },
                      { label: 'Produits les plus vendus', value: 'Électronique' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-semibold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Activité récente</CardTitle>
                  <CardDescription>Événements importants</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { icon: CheckCircle, text: 'Nouveau vendeur approuvé', time: 'Il y a 2 heures', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
                      { icon: ShoppingBag, text: 'Pic de commandes détecté', time: 'Il y a 4 heures', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
                      { icon: Package, text: 'Stock faible alerté', time: 'Il y a 6 heures', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
                    ].map((evt, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                        <div className={`p-2 rounded-lg ${evt.bg}`}>
                          <evt.icon className={`w-4 h-4 ${evt.color}`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{evt.text}</div>
                          <div className="text-xs text-muted-foreground">{evt.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Rapport financier</CardTitle>
                  <CardDescription>Vue d'ensemble des finances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Commissions (5%)', value: `${new Intl.NumberFormat('fr-FR').format((stats?.total_revenue || 0) * 0.05)} FCFA`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: 'Revenus vendeurs', value: `${new Intl.NumberFormat('fr-FR').format((stats?.total_revenue || 0) * 0.95)} FCFA`, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
                      { label: 'Transactions totales', value: `${stats?.total_orders || 0}`, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
                    ].map(item => (
                      <div key={item.label} className={`text-center p-5 rounded-2xl ${item.bg}`}>
                        <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                        <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Marketing */}
          {activeSection === 'marketing' && <MarketingDashboard />}

          {/* Security */}
          {activeSection === 'security' && <SecurityDashboard />}

          {/* Logs - reuses SecurityDashboard's audit trail section */}
          {activeSection === 'logs' && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Logs & Audit Trail</CardTitle>
                <CardDescription>Journal complet des actions critiques sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityDashboard />
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          {activeSection === 'settings' && (
            <div className="grid gap-6">
              <Card className="border-destructive/30 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                    <Trash2 className="w-5 h-5" />RESET IMAGES PRODUITS
                  </CardTitle>
                  <CardDescription>⚠️ Action irréversible : supprime TOUTES les images de TOUS les produits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/10">
                    <p className="text-sm text-foreground mb-2">Cette action va :</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Mettre <code className="bg-muted px-1 rounded">images = []</code> pour tous les produits</li>
                      <li>Les vendeurs devront réuploader leurs images</li>
                    </ul>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />RÉINITIALISER TOUTES LES IMAGES
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">⚠️ CONFIRMATION RESET IMAGES</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>Vous êtes sur le point de supprimer TOUTES les images de TOUS les produits.</p>
                          <p className="font-semibold text-destructive">Cette action est IRRÉVERSIBLE.</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={async () => {
                            try {
                              const { error } = await supabase.from('products').update({ images: [], updated_at: new Date().toISOString() }).neq('id', '00000000-0000-0000-0000-000000000000');
                              if (error) throw error;
                              toast({ title: "✅ RESET TERMINÉ", description: "Toutes les images ont été supprimées." });
                              fetchData();
                            } catch (error: any) {
                              toast({ title: "Erreur", description: error.message || "Impossible de réinitialiser", variant: "destructive" });
                            }
                          }}
                        >OUI, SUPPRIMER</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="grid gap-6 max-w-2xl">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Informations du profil</CardTitle>
                  <CardDescription>Modifiez vos informations personnelles</CardDescription>
                </CardHeader>
                <CardContent><ProfileUpdateForm /></CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Sécurité du compte</CardTitle>
                  <CardDescription>Modifiez votre mot de passe</CardDescription>
                </CardHeader>
                <CardContent><PasswordUpdateForm /></CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Dialogs */}
      <ProductEditDialog
        product={editingProduct}
        open={showProductEdit}
        onOpenChange={setShowProductEdit}
        onProductUpdated={(updatedProduct) => {
          setProducts(products.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p));
        }}
      />
      <UserDetailDialog userId={selectedUserId} open={showUserDetail} onOpenChange={setShowUserDetail} />
      <SuperAdminSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
};

export default SuperAdmin;
