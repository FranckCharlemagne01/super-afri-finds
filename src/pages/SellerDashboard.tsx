import { useState, useEffect, useCallback } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { useSellerAccess } from '@/hooks/useSellerAccess';
import { useStableData } from '@/hooks/useStableData';
import { useTokens } from '@/hooks/useTokens';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ModernSellerHeader } from '@/components/seller/ModernSellerHeader';
import { ShopOverviewTab } from '@/components/seller/ShopOverviewTab';
import { ProductsTab } from '@/components/seller/ProductsTab';
import { MessagesOrdersTab } from '@/components/seller/MessagesOrdersTab';
import { TokensSubscriptionTab } from '@/components/seller/TokensSubscriptionTab';
import { ShopSettingsTab } from '@/components/seller/ShopSettingsTab';
import { SellerDashboardSkeleton } from '@/components/seller/SellerDashboardSkeleton';
import { RealtimeOrdersNotification } from '@/components/RealtimeOrdersNotification';
import { RealtimeMessagesNotification } from '@/components/RealtimeMessagesNotification';
import { TrialBanner } from '@/components/TrialBanner';
import { SubscriptionExpiredBanner } from '@/components/SubscriptionExpiredBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, Package, MessageSquare, Coins, Settings } from 'lucide-react';

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
  is_boosted?: boolean;
  boosted_until?: string;
  rating?: number;
  reviews_count?: number;
  created_at: string;
}

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  seller_id: string;
  created_at: string;
  subscription_active: boolean;
  is_active: boolean;
}

const SellerDashboard = () => {
  const { user, signOut, userId } = useStableAuth();
  const { isSeller, isSuperAdmin, loading: roleLoading, refreshRole } = useStableRole();
  const sellerAccess = useSellerAccess();
  const { tokenBalance, freeTokens, paidTokens, freeTokensExpiresAt, refreshBalance } = useTokens();

  // ✅ Enregistrer le callback pour rafraîchir les jetons immédiatement après attribution
  // ET relancer la vérification pour les acheteurs devenus vendeurs
  useEffect(() => {
    if (sellerAccess.registerTokenRefreshCallback) {
      console.log('[SellerDashboard] 📝 Registering token refresh callback');
      sellerAccess.registerTokenRefreshCallback(() => {
        console.log('[SellerDashboard] 🔄 Token refresh callback triggered - refreshing balance...');
        refreshBalance();
      });
      
      // ✅ CRUCIAL: Relancer la vérification des jetons APRÈS l'enregistrement du callback
      // Ceci assure que les acheteurs devenus vendeurs reçoivent leurs jetons
      console.log('[SellerDashboard] 🔁 Re-checking trial tokens after callback registration...');
      sellerAccess.refresh();
    }
  }, [sellerAccess.registerTokenRefreshCallback, sellerAccess.refresh, refreshBalance]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [openProductForm, setOpenProductForm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Fetch seller shop
  const { data: shop, loading: shopLoading, refetch: refetchShop } = useStableData(
    async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('seller_shops')
        .select('*')
        .eq('seller_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    [userId],
    {
      keepPreviousData: true,
      loadingDelay: 200,
    }
  );

  // Fetch seller products
  const { data: products, loading: productsLoading, error, refetch: refetchProducts } = useStableData(
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
    [userId],
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

  // Initialisation et vérification du rôle
  useEffect(() => {
    const initDashboard = async () => {
      console.log('[SellerDashboard] Init - roleLoading:', roleLoading, 'userId:', userId, 'isSeller:', isSeller);
      
      if (roleLoading) {
        return; // Attendre que le rôle soit chargé
      }
      
      if (!userId) {
        console.log('[SellerDashboard] No userId, redirecting to auth');
        navigate('/auth', { replace: true });
        return;
      }
      
      // Superadmin check
      if (isSuperAdmin) {
        console.log('[SellerDashboard] User is superadmin, redirecting');
        navigate('/superadmin', { replace: true });
        return;
      }
      
      // Si pas vendeur, on laisse un peu de temps et on re-check
      if (!isSeller) {
        console.log('[SellerDashboard] Not seller, refreshing role...');
        await refreshRole();
        
        // Re-vérifier après refresh
        const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: userId });
        console.log('[SellerDashboard] Role after refresh:', roleData);
        
        if (roleData !== 'seller' && roleData !== 'admin' && roleData !== 'superadmin') {
          console.log('[SellerDashboard] Confirmed not seller, redirecting to buyer');
          navigate('/buyer-dashboard', { replace: true });
          return;
        }
      }
      
      setIsInitializing(false);
      setInitError(null);
    };
    
    initDashboard();
  }, [userId, isSeller, isSuperAdmin, roleLoading, navigate, refreshRole]);

  // Gestion des paramètres URL pour paiement
  useEffect(() => {
    if (isInitializing || !userId) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');
    
    if (paymentStatus === 'success' && reference) {
      verifyPayment(reference);
      window.history.replaceState({}, document.title, '/seller-dashboard');
    }

    const subscriptionPayment = urlParams.get('subscription_payment');
    const subscriptionRef = urlParams.get('reference');
    
    if (subscriptionPayment === 'verify' && subscriptionRef) {
      verifySubscription(subscriptionRef);
      window.history.replaceState({}, document.title, '/seller-dashboard');
    }
  }, [userId, isInitializing]);

  const verifySubscription = async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-payment', {
        body: {
          action: 'verify',
          user_id: userId,
          reference
        },
      });

      if (error) throw error;

      if (data?.success) {
        if (data.is_test) {
          toast({
            title: "🧪 Mode Test",
            description: data.message || "Paiement simulé - abonnement non activé",
          });
        } else {
          toast({
            title: "🎉 Abonnement activé !",
            description: "Votre abonnement vendeur est maintenant actif",
          });
          sellerAccess.refresh();
        }
      } else {
        toast({
          title: "Erreur",
          description: data?.error || "Paiement non vérifié",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Subscription verification error:', err);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le paiement",
        variant: "destructive",
      });
    }
  };

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

      if (data && !data.success && data.status !== 'success') {
        console.error('Payment verification failed:', data.error);
        toast({
          title: "Erreur de vérification",
          description: data.error || "Le paiement n'a pas pu être vérifié",
          variant: "destructive",
        });
        return;
      }

      if (data?.status === 'success' || data?.success) {
        const isTestMode = data?.test_mode === true;
        
        if (isTestMode) {
          toast({
            title: "🧪 Mode Test - Paiement simulé",
            description: data.message || "Vous êtes en mode test : aucun crédit réel n'a été ajouté.",
            variant: "default",
          });
        } else {
          toast({
            title: "🎉 Paiement réussi !",
            description: data.message || "Vos jetons ont été ajoutés à votre compte !",
          });
          refetchProducts();
          refreshBalance();
        }
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

  const handleRefresh = useCallback(() => {
    refetchProducts();
    refetchShop();
    refreshBalance();
    refreshRole();
    sellerAccess.refresh();
  }, [refetchProducts, refetchShop, refreshBalance, refreshRole, sellerAccess]);

  const handlePublishProduct = useCallback(() => {
    setActiveTab('products');
    setOpenProductForm(true);
  }, []);

  // Show loading state pendant l'initialisation
  if (isInitializing || roleLoading || !userId || shopLoading || sellerAccess.loading) {
    return <SellerDashboardSkeleton />;
  }

  // Afficher erreur si problème d'initialisation
  if (initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 md:p-8 text-center">
            <Store className="h-12 w-12 md:h-16 md:w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-semibold mb-2">Erreur de chargement</h2>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              {initError}
            </p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect superadmin
  if (isSuperAdmin) {
    return null;
  }

  // Non-seller access
  if (!isSeller && !roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 md:p-8 text-center">
            <Store className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-semibold mb-2">Accès vendeur requis</h2>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              Vous devez activer votre profil vendeur pour accéder à cet espace.
            </p>
            <Button onClick={() => navigate('/buyer-dashboard')}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create trial status object for components that need it
  const trialStatus = {
    isInTrial: sellerAccess.isInTrial,
    trialEndDate: sellerAccess.trialEndDate,
    canPublish: sellerAccess.canPublish,
    isPremium: sellerAccess.hasActiveSubscription,
    loading: sellerAccess.loading,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* 🔥 Notifications en temps réel */}
      <RealtimeOrdersNotification />
      <RealtimeMessagesNotification />
      
      <div className="container mx-auto px-2.5 py-3 max-w-md md:max-w-3xl lg:max-w-7xl md:px-4 lg:px-6 md:py-4 lg:py-5">
        {/* ⚠️ Subscription Expired Banner - Show when trial ended and no active subscription */}
        {sellerAccess.subscriptionExpired && !sellerAccess.isInTrial && (
          <SubscriptionExpiredBanner 
            userEmail={user?.email || ''} 
            userId={userId}
            onSubscriptionSuccess={() => sellerAccess.refresh()}
            isInTrial={sellerAccess.isInTrial}
          />
        )}
        
        {/* 🎁 Trial Banner - Only show if in trial */}
        {sellerAccess.isInTrial && (
          <TrialBanner 
            daysLeft={sellerAccess.trialDaysLeft} 
            trialEndDate={sellerAccess.trialEndDate}
          />
        )}

        {/* Modern Header */}
        <ModernSellerHeader
          shop={shop}
          onSignOut={handleSignOut}
          trialStatus={trialStatus}
          tokenBalance={tokenBalance}
          freeTokens={freeTokens}
          freeTokensExpiresAt={freeTokensExpiresAt}
          onPublishProduct={handlePublishProduct}
        />

        {/* Main Dashboard Tabs - Mobile First */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 md:space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-card/50 backdrop-blur-sm border border-border/50 shadow-md rounded-2xl h-auto p-1 md:p-1.5 gap-1 overflow-x-auto">
            <TabsTrigger 
              value="overview" 
              className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md py-2 md:py-2.5 rounded-xl transition-all hover:bg-muted/50 touch-manipulation whitespace-nowrap text-xs md:text-sm"
            >
              <Store className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Ma Boutique</span>
              <span className="sm:hidden truncate">Boutique</span>
            </TabsTrigger>
            <TabsTrigger 
              value="products" 
              className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md py-2 md:py-2.5 rounded-xl transition-all hover:bg-muted/50 touch-manipulation whitespace-nowrap text-xs md:text-sm"
            >
              <Package className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">Produits</span>
            </TabsTrigger>
            <TabsTrigger 
              value="messages-orders" 
              className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md py-2 md:py-2.5 rounded-xl transition-all hover:bg-muted/50 touch-manipulation whitespace-nowrap text-xs md:text-sm"
            >
              <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Messages</span>
              <span className="sm:hidden truncate">Messages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tokens" 
              className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md py-2 md:py-2.5 rounded-xl transition-all hover:bg-muted/50 touch-manipulation whitespace-nowrap text-xs md:text-sm"
            >
              <Coins className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Jetons</span>
              <span className="sm:hidden truncate">Jetons</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md py-2 md:py-2.5 rounded-xl transition-all hover:bg-muted/50 touch-manipulation whitespace-nowrap text-xs md:text-sm"
            >
              <Settings className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">Paramètres</span>
              <span className="sm:hidden truncate">Réglages</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <ShopOverviewTab
              shop={shop}
              products={products || []}
              tokenBalance={tokenBalance}
              trialStatus={trialStatus}
              onRefresh={handleRefresh}
              onPublishProduct={handlePublishProduct}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <ProductsTab
              products={products || []}
              loading={productsLoading}
              shopId={shop?.id}
              onRefresh={handleRefresh}
              openFormTrigger={openProductForm}
              onFormOpenChange={setOpenProductForm}
              canPublish={sellerAccess.canPublish}
              canEdit={sellerAccess.canEdit}
              canBoost={sellerAccess.canBoost}
            />
          </TabsContent>

          <TabsContent value="messages-orders" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <MessagesOrdersTab userId={userId} />
          </TabsContent>

          <TabsContent value="tokens" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <TokensSubscriptionTab
              tokenBalance={tokenBalance}
              freeTokens={freeTokens}
              paidTokens={paidTokens}
              freeTokensExpiresAt={freeTokensExpiresAt}
              trialStatus={trialStatus}
              products={products || []}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <ShopSettingsTab
              shop={shop}
              onRefresh={handleRefresh}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerDashboard;
