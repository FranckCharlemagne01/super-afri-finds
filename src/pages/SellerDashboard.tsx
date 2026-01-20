import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense, useRef } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { useSellerAccess } from '@/hooks/useSellerAccess';
import { useTokens } from '@/hooks/useTokens';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ModernSellerHeader } from '@/components/seller/ModernSellerHeader';
import { SellerDashboardSkeleton } from '@/components/seller/SellerDashboardSkeleton';
import { RealtimeOrdersNotification } from '@/components/RealtimeOrdersNotification';
import { RealtimeMessagesNotification } from '@/components/RealtimeMessagesNotification';
import { TrialBanner } from '@/components/TrialBanner';
import { SubscriptionExpiredBanner } from '@/components/SubscriptionExpiredBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, Package, MessageSquare, Coins, Settings } from 'lucide-react';
import { getCached, setCache, isStale, CACHE_KEYS } from '@/utils/dataCache';
import { useOptimizedShopQuery, useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { isDashboardCached } from '@/hooks/useDashboardPrefetch';
import { Skeleton } from '@/components/ui/skeleton';

// ✅ Lazy load heavy tab components for faster initial render
const ShopOverviewTab = lazy(() => import('@/components/seller/ShopOverviewTab').then(m => ({ default: m.ShopOverviewTab })));
const ProductsTab = lazy(() => import('@/components/seller/ProductsTab').then(m => ({ default: m.ProductsTab })));
const MessagesOrdersTab = lazy(() => import('@/components/seller/MessagesOrdersTab').then(m => ({ default: m.MessagesOrdersTab })));
const TokensSubscriptionTab = lazy(() => import('@/components/seller/TokensSubscriptionTab').then(m => ({ default: m.TokensSubscriptionTab })));
const ShopSettingsTab = lazy(() => import('@/components/seller/ShopSettingsTab').then(m => ({ default: m.ShopSettingsTab })));

// ✅ Lightweight skeleton for tab content
const TabSkeleton = memo(() => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-32 w-full rounded-xl" />
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
));

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

const SellerDashboard = memo(() => {
  const { user, signOut, userId, loading: authLoading } = useStableAuth();
  const { isSeller, isSuperAdmin, loading: roleLoading, refreshRole } = useStableRole();
  const sellerAccess = useSellerAccess();
  const { tokenBalance, freeTokens, paidTokens, freeTokensExpiresAt, refreshBalance } = useTokens();

  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [openProductForm, setOpenProductForm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initTimeout, setInitTimeout] = useState(false);
  
  // ✅ Check if data was prefetched (instant display)
  const hasPrefetchedData = useMemo(() => {
    return userId ? isDashboardCached(userId, true) : false;
  }, [userId]);
  
  // ✅ Track mounted tabs to avoid re-fetching on tab switch
  const mountedTabs = useRef<Set<string>>(new Set(['overview']));

  // ✅ Timeout de sécurité pour éviter les écrans de chargement infinis
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing) {
        console.log('[SellerDashboard] ⚠️ Init timeout reached, forcing completion');
        setInitTimeout(true);
        setIsInitializing(false);
      }
    }, 8000); // 8 secondes max

    return () => clearTimeout(timeout);
  }, [isInitializing]);

  // ✅ Enregistrer le callback pour rafraîchir les jetons immédiatement après attribution
  useEffect(() => {
    if (sellerAccess.registerTokenRefreshCallback && userId) {
      console.log('[SellerDashboard] 📝 Registering token refresh callback');
      sellerAccess.registerTokenRefreshCallback(() => {
        console.log('[SellerDashboard] 🔄 Token refresh callback triggered - refreshing balance...');
        refreshBalance();
      });
      
      // ✅ Relancer la vérification des jetons APRÈS l'enregistrement du callback
      console.log('[SellerDashboard] 🔁 Re-checking trial tokens after callback registration...');
      sellerAccess.refresh();
    }
  }, [sellerAccess.registerTokenRefreshCallback, userId]);

  // Fetch seller shop - using optimized query with caching
  const { 
    data: shop, 
    loading: shopLoading, 
    refetch: refetchShop 
  } = useOptimizedQuery({
    key: userId ? CACHE_KEYS.SHOP_BY_SELLER(userId) : 'shop:none',
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    fetcher: async () => {
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
  });

  // Fetch seller products - using optimized query with caching
  const { 
    data: products, 
    loading: productsLoading, 
    error, 
    refetch: refetchProducts 
  } = useOptimizedQuery({
    key: userId ? CACHE_KEYS.PRODUCTS_BY_SELLER(userId) : 'products:none',
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    fetcher: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Initialisation et vérification du rôle
  useEffect(() => {
    const initDashboard = async () => {
      console.log('[SellerDashboard] Init - authLoading:', authLoading, 'roleLoading:', roleLoading, 'userId:', userId, 'isSeller:', isSeller);
      
      // Attendre que l'authentification soit chargée
      if (authLoading) {
        console.log('[SellerDashboard] Waiting for auth...');
        return;
      }
      
      // Si pas d'utilisateur après chargement auth, rediriger
      if (!authLoading && !userId) {
        console.log('[SellerDashboard] No userId after auth loaded, redirecting to auth');
        navigate('/auth', { replace: true });
        return;
      }
      
      // Attendre que le rôle soit chargé (avec timeout de sécurité)
      if (roleLoading) {
        console.log('[SellerDashboard] Waiting for role...');
        return;
      }
      
      // Superadmin check
      if (isSuperAdmin) {
        console.log('[SellerDashboard] User is superadmin, redirecting');
        navigate('/superadmin', { replace: true });
        return;
      }
      
      // Si pas vendeur, on re-vérifie directement en base
      if (!isSeller) {
        console.log('[SellerDashboard] Not seller according to hook, checking database...');
        
        try {
          const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', { _user_id: userId });
          console.log('[SellerDashboard] Role from database:', roleData, 'error:', roleError);
          
          if (roleError) {
            console.error('[SellerDashboard] Role check error:', roleError);
            // Continuer quand même, le hook peut avoir la bonne valeur
          }
          
          if (roleData === 'seller' || roleData === 'admin' || roleData === 'superadmin') {
            console.log('[SellerDashboard] User is seller in database, refreshing role...');
            refreshRole();
            setIsInitializing(false);
            setInitError(null);
            return;
          }
          
          // Vraiment pas vendeur, rediriger
          console.log('[SellerDashboard] Confirmed not seller, redirecting to buyer');
          navigate('/buyer-dashboard', { replace: true });
          return;
        } catch (err) {
          console.error('[SellerDashboard] Error checking role:', err);
          // En cas d'erreur, laisser l'utilisateur voir le dashboard si possible
        }
      }
      
      // Tout est OK, terminer l'initialisation
      console.log('[SellerDashboard] ✅ Initialization complete');
      setIsInitializing(false);
      setInitError(null);
    };
    
    initDashboard();
  }, [userId, authLoading, isSeller, isSuperAdmin, roleLoading, navigate, refreshRole]);

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

  // Calculer si on doit afficher le skeleton
  // ✅ Skip skeleton if data was prefetched (instant display)
  // Le timeout de sécurité permet de forcer l'affichage après 8s
  const shouldShowSkeleton = !initTimeout && !hasPrefetchedData && (
    isInitializing || 
    authLoading || 
    roleLoading || 
    !userId
  );

  // Show loading state pendant l'initialisation (avec timeout de sécurité)
  // Skip if prefetched data is available
  if (shouldShowSkeleton) {
    return <SellerDashboardSkeleton />;
  }

  // Afficher erreur si timeout atteint sans utilisateur
  if (initTimeout && !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 md:p-8 text-center">
            <Store className="h-12 w-12 md:h-16 md:w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-semibold mb-2">Session expirée</h2>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              Votre session a expiré. Veuillez vous reconnecter.
            </p>
            <Button onClick={() => navigate('/auth', { replace: true })}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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

  // Non-seller access - afficher un message clair
  if (!isSeller && !roleLoading && !initTimeout) {
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

          <TabsContent value="overview" className="space-y-3 md:space-y-4 mt-3 md:mt-4" forceMount={activeTab === 'overview' || mountedTabs.current.has('overview') ? undefined : undefined}>
            <Suspense fallback={<TabSkeleton />}>
              <ShopOverviewTab
                shop={shop}
                products={products || []}
                tokenBalance={tokenBalance}
                trialStatus={trialStatus}
                onRefresh={handleRefresh}
                onPublishProduct={handlePublishProduct}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="products" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <Suspense fallback={<TabSkeleton />}>
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
            </Suspense>
          </TabsContent>

          <TabsContent value="messages-orders" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <Suspense fallback={<TabSkeleton />}>
              <MessagesOrdersTab userId={userId} />
            </Suspense>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <Suspense fallback={<TabSkeleton />}>
              <TokensSubscriptionTab
                tokenBalance={tokenBalance}
                freeTokens={freeTokens}
                paidTokens={paidTokens}
                freeTokensExpiresAt={freeTokensExpiresAt}
                trialStatus={trialStatus}
                products={products || []}
                onRefresh={handleRefresh}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
            <Suspense fallback={<TabSkeleton />}>
              <ShopSettingsTab
                shop={shop}
                onRefresh={handleRefresh}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});

SellerDashboard.displayName = 'SellerDashboard';

export default SellerDashboard;
