import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, MessageSquare, BarChart3, LogOut, Store } from 'lucide-react';
import { ProductForm } from '@/components/ProductForm';
import { SellerProducts } from '@/components/SellerProducts';
import { SellerMessages } from '@/components/SellerMessages';
import { SellerOrders } from '@/components/SellerOrders';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category: string;
  images?: string[];
  badge?: string;
  stock_quantity?: number;
  is_active?: boolean;
  is_flash_sale?: boolean;
  rating?: number;
  reviews_count?: number;
  created_at: string;
}

const SellerDashboard = () => {
  const { user, signOut } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleViewPublicPage = () => {
    navigate('/');
  };

  useEffect(() => {
    // Rediriger les SuperAdmin vers leur dashboard
    if (!roleLoading && isSuperAdmin()) {
      navigate('/superadmin');
      return;
    }
    
    if (user && !roleLoading) {
      fetchSellerProducts();
    }
  }, [user, isSuperAdmin, roleLoading, navigate]);

  const fetchSellerProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos produits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSaved = () => {
    fetchSellerProducts();
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  // Notification components
  const MessageNotificationBadge = () => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
      if (!user) return;

      const fetchUnreadCount = async () => {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('id')
            .eq('recipient_id', user.id)
            .eq('is_read', false);

          if (error) throw error;
          setUnreadCount(data?.length || 0);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };

      fetchUnreadCount();

      // Set up real-time subscription
      const channel = supabase
        .channel('seller-message-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`
          },
          () => {
            fetchUnreadCount();
            toast({
              title: "💬 Nouveau message",
              description: "Vous avez reçu un nouveau message d'un client",
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [user]);

    if (unreadCount === 0) return null;

    return (
      <Badge 
        variant="destructive" 
        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </Badge>
    );
  };

  const OrderNotificationBadge = () => {
    const [newOrdersCount, setNewOrdersCount] = useState(0);

    useEffect(() => {
      if (!user) return;

      const fetchNewOrdersCount = async () => {
        try {
          const { data, error } = await supabase.rpc('get_seller_orders');
          if (error) throw error;
          
          const sellerOrders = data?.filter(order => order.seller_id === user.id) || [];
          const pendingOrders = sellerOrders.filter(order => order.status === 'pending');
          setNewOrdersCount(pendingOrders.length);
        } catch (error) {
          console.error('Error fetching new orders count:', error);
        }
      };

      fetchNewOrdersCount();

      // Set up real-time subscription for new orders
      const channel = supabase
        .channel('seller-order-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${user.id}`
          },
          () => {
            fetchNewOrdersCount();
            toast({
              title: "🛒 Nouvelle commande",
              description: "Vous avez reçu une nouvelle commande !",
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${user.id}`
          },
          () => {
            fetchNewOrdersCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [user]);

    if (newOrdersCount === 0) return null;

    return (
      <Badge 
        variant="destructive" 
        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
      >
        {newOrdersCount > 9 ? '9+' : newOrdersCount}
      </Badge>
    );
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "✅ Produit supprimé",
        description: "Le produit a été supprimé définitivement de la plateforme",
      });
      
      fetchSellerProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive",
      });
    }
  };

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.is_active).length,
    totalViews: products.reduce((sum, p) => sum + (p.reviews_count || 0), 0),
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Vous devez être connecté pour accéder à l'espace vendeur.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Les SuperAdmin sont automatiquement redirigés dans useEffect
  if (isSuperAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header - Mobile optimized */}
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold gradient-text-primary">Espace Vendeur</h1>
            <p className="text-sm lg:text-base text-muted-foreground">Gérez vos produits et commandes</p>
          </div>
          
          {/* Mobile action buttons */}
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleViewPublicPage}
                className="flex-1 lg:flex-none items-center gap-2 text-sm"
                size="sm"
              >
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Voir la page publique</span>
                <span className="sm:hidden">Page publique</span>
              </Button>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="flex-1 lg:flex-none items-center gap-2 text-sm"
                size="sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
                <span className="sm:hidden">Sortir</span>
              </Button>
            </div>
            <Badge variant="secondary" className="px-3 py-1 text-xs lg:px-4 lg:py-2 self-center lg:self-auto">
              Vendeur Certifié
            </Badge>
          </div>
        </div>

        {/* Stats Cards - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits Actifs</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">{stats.activeProducts}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Avis</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">{stats.totalViews}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Mobile optimized */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="products" className="text-sm">Mes Produits</TabsTrigger>
            <TabsTrigger value="orders" className="text-sm relative">
              Commandes
              <OrderNotificationBadge />
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-sm relative">
              Messages
              <MessageNotificationBadge />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
              <h2 className="text-lg lg:text-xl font-semibold">Gestion des Produits</h2>
              <Button 
                onClick={() => setShowProductForm(true)}
                className="flex items-center gap-2 w-full lg:w-auto"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Ajouter un Produit
              </Button>
            </div>

            {showProductForm && (
              <Card className="border-0 shadow-md">
                <CardHeader className="px-4 lg:px-6">
                  <CardTitle className="text-lg lg:text-xl">
                    {editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Remplissez les informations de votre produit
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 lg:px-6">
                  <ProductForm
                    product={editingProduct}
                    onSave={handleProductSaved}
                    onCancel={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            <SellerProducts
              products={products}
              loading={loading}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
            />
          </TabsContent>

          <TabsContent value="orders">
            <SellerOrders />
          </TabsContent>

          <TabsContent value="messages">
            <SellerMessages />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerDashboard;