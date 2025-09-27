import { useState, useEffect, useCallback } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useStableData } from '@/hooks/useStableData';
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
import { TrialCountdown } from '@/components/TrialCountdown';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { RealtimeNotificationBadge } from '@/components/RealtimeNotificationBadge';
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
  seller_id: string;
  created_at: string;
  updated_at: string;
}

const SellerDashboard = () => {
  const { user, signOut, userId } = useStableAuth();
  const { isSuperAdmin, loading: roleLoading, refreshRole } = useStableRole();
  const trialStatus = useTrialStatus();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Utiliser useStableData pour éviter les clignotements
  const { data: products, loading, error, refetch } = useStableData(
    async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    [userId], // Utiliser userId stable du hook useStableAuth
    {
      keepPreviousData: true,
      loadingDelay: 200,
      debounceMs: 150
    }
  );
  

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleViewPublicPage = () => {
    navigate('/');
  };

  useEffect(() => {
    // Ne traiter que si nous avons terminé de charger le rôle et l'utilisateur
    if (roleLoading || !userId) return;
    
    // Éviter les redirections multiples - vérifier la route actuelle
    const currentPath = window.location.pathname;
    
    // Rediriger les SuperAdmin vers leur dashboard SEULEMENT s'ils ne sont pas déjà dessus
    if (isSuperAdmin && currentPath !== '/superadmin') {
      navigate('/superadmin', { replace: true });
      return;
    }
    
    // Check for payment success in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');
    
    if (paymentStatus === 'success' && reference) {
      verifyPayment(reference);
      // Clean URL sans redirection
      window.history.replaceState({}, document.title, '/seller-dashboard');
    }
  }, [userId, isSuperAdmin, roleLoading, navigate]); // Dépendances stables

  const verifyPayment = async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'verify_payment',
          reference
        },
      });

      if (error) {
        console.error('Payment verification error:', error);
        toast({
          title: "Erreur de vérification",
          description: "Impossible de vérifier le paiement",
          variant: "destructive",
        });
        return;
      }

      if (data?.status === 'success') {
        toast({
          title: "🎉 Paiement réussi !",
          description: data.message || "Votre article a été publié avec succès !",
        });
        refetch(); // Refresh products list to show new article
      } else {
        toast({
          title: "Échec du paiement",
          description: "Le paiement n'a pas pu être traité",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification du paiement",
        variant: "destructive",
      });
    }
  };

  // Afficher les erreurs de manière discrète, sans clignotements
  useEffect(() => {
    if (error && !loading) {
      console.error('Error loading products:', error);
      // Toast discret seulement si c'est une vraie erreur (pas de données en cache)
      if (!products || products.length === 0) {
        toast({
          title: "Connexion instable",
          description: "Tentative de rechargement en cours...",
          variant: "default",
        });
      }
    }
  }, [error, loading, products, toast]);

  const handleProductSaved = useCallback(() => {
    refetch();
    setShowProductForm(false);
    setEditingProduct(null);
    // Rafraîchir le rôle pour s'assurer qu'il est à jour après publication
    refreshRole();
  }, [refetch, refreshRole]);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  // Notification components
  const MessageNotificationBadge = () => {
    const { unreadMessages } = useRealtimeNotifications();
    return <RealtimeNotificationBadge count={unreadMessages} className="bg-blue-500 text-white border-2 border-white shadow-lg z-10" />;
  };

  const OrderNotificationBadge = () => {
    const { userId: currentUserId } = useStableAuth();
    const { newOrders } = useRealtimeNotifications();
    const [lastOrderCount, setLastOrderCount] = useState(0);

    useEffect(() => {
      // Jouer un son quand une nouvelle commande arrive
      if (newOrders > lastOrderCount && lastOrderCount > 0) {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Could not play sound:', e));
        
        toast({
          title: "🚨 Nouvelle commande !",
          description: "Vous avez reçu une nouvelle commande",
        });
      }
      setLastOrderCount(newOrders);
    }, [newOrders, lastOrderCount]);

    return <RealtimeNotificationBadge count={newOrders} className="bg-red-500 text-white border-2 border-white shadow-lg z-10" />;
  };

  // Composant pour alerter des nouvelles commandes
  const NewOrdersAlert = () => {
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);

    const fetchPendingOrders = useCallback(async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase.rpc('get_seller_orders');
        if (error) throw error;
        
        const pending = data?.filter(order => 
          order.seller_id === userId && order.status === 'pending'
        ) || [];
        setPendingOrders(pending);
      } catch (error) {
        console.error('Error fetching pending orders:', error);
        // Silently fail - ne pas spammer l'utilisateur avec des erreurs
      }
    }, [userId]);

    useEffect(() => {
      if (!userId) return;

      fetchPendingOrders();

      // Écouter les changements en temps réel avec cleanup approprié
      const channel = supabase
        .channel(`pending-orders-alert-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${userId}`
          },
          fetchPendingOrders
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [userId, fetchPendingOrders]);

    if (pendingOrders.length === 0) return null;

    return (
      <div className="mb-6">
        <Card className="border-orange-200 bg-orange-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-orange-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 mb-1">
                  🚨 {pendingOrders.length} nouvelle{pendingOrders.length > 1 ? 's' : ''} commande{pendingOrders.length > 1 ? 's' : ''} en attente !
                </h3>
                <p className="text-sm text-orange-700">
                  {pendingOrders.length === 1 
                    ? `Commande #${pendingOrders[0].id.slice(-8)} - ${pendingOrders[0].product_title}`
                    : `Plusieurs commandes nécessitent votre attention.`
                  } Cliquez sur l'onglet "Commandes" pour les traiter.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Simuler un clic sur l'onglet commandes
                  const ordersTab = document.querySelector('[value="orders"]') as HTMLElement;
                  if (ordersTab) ordersTab.click();
                }}
                className="bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
              >
                Voir les commandes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
      
      refetch();
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
    totalProducts: products?.length || 0,
    activeProducts: products?.filter(p => p.is_active).length || 0,
    totalViews: products?.reduce((sum, p) => sum + (p.reviews_count || 0), 0) || 0,
  };

  if (roleLoading || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-center">Vérification de vos autorisations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Les SuperAdmin sont automatiquement redirigés dans useEffect
  if (isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header - Mobile optimized */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 lg:p-6 mb-6 border border-primary/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-foreground">Espace Vendeur</h1>
                  <p className="text-sm text-muted-foreground">Gérez facilement vos ventes</p>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit bg-primary/10 text-primary border-primary/30">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Vendeur Actif
              </Badge>
            </div>
            
            {/* Actions compactes pour mobile */}
            <div className="flex flex-col gap-2 lg:flex-row lg:gap-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleViewPublicPage}
                  className="flex-1 lg:flex-none bg-white/50 hover:bg-white/80 border-primary/30"
                  size="sm"
                >
                  <Store className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Voir la boutique</span>
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  className="flex-1 lg:flex-none"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Quitter</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Status Component */}
        {!trialStatus.loading && trialStatus.trialEndDate && (
          <div className="mb-6">
            <TrialCountdown 
              trialEndDate={trialStatus.trialEndDate}
              onExpire={() => window.location.reload()}
            />
          </div>
        )}

        {/* Nouvelles commandes en attente - Notification persistante */}
        <NewOrdersAlert />

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

        {/* Navigation principale - Mobile First */}
        <Tabs defaultValue="products" className="space-y-6" onValueChange={(value) => {
          // Demander permission pour les notifications si pas encore accordée
          if (value === 'orders' && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
        }}>
          {/* Navigation simplifiée avec indicateurs visuels */}
          <div className="bg-white rounded-xl border border-border/50 shadow-sm p-2">
            <TabsList className="grid w-full grid-cols-3 bg-muted/30 rounded-lg h-12">
              <TabsTrigger 
                value="products" 
                className="relative text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Package className="h-4 w-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">Mes</span> Produits
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="relative text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4 mr-1 lg:mr-2" />
                Commandes
                <OrderNotificationBadge />
              </TabsTrigger>
              <TabsTrigger 
                value="messages" 
                className="relative text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4 mr-1 lg:mr-2" />
                Messages
                <MessageNotificationBadge />
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
              <h2 className="text-lg lg:text-xl font-semibold">Gestion des Produits</h2>
              <Button 
                onClick={() => setShowProductForm(true)}
                disabled={!trialStatus.canPublish}
                className={`flex items-center gap-2 w-full lg:w-auto ${!trialStatus.canPublish ? "opacity-50 cursor-not-allowed" : ""}`}
                size="sm"
              >
                <Plus className="h-4 w-4" />
                {trialStatus.isInTrial 
                  ? "Publier un Article (Gratuit - Essai)" 
                  : trialStatus.canPublish 
                    ? "Publier un Article (1000 FCFA)" 
                    : "Période d'essai expirée"}
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