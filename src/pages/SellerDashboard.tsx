import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense, useRef } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { useSellerAccess } from '@/hooks/useSellerAccess';
import { useTokens } from '@/hooks/useTokens';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { SellerSidebar, type SellerSection } from '@/components/seller/SellerSidebar';
import { SellerDashboardSkeleton } from '@/components/seller/SellerDashboardSkeleton';
import { RealtimeOrdersNotification } from '@/components/RealtimeOrdersNotification';
import { RealtimeMessagesNotification } from '@/components/RealtimeMessagesNotification';
import { TrialBanner } from '@/components/TrialBanner';
import { SubscriptionExpiredBanner } from '@/components/SubscriptionExpiredBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, RefreshCw } from 'lucide-react';
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

// ✅ Lightweight skeleton for section content
const SectionSkeleton = memo(() => (
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

const sectionTitles: Record<SellerSection, string> = {
  overview: 'Ma Boutique',
  products: 'Produits',
  'messages-orders': 'Commandes & Messages',
  tokens: 'Jetons & Abonnement',
  settings: 'Paramètres',
};

const SellerDashboard = memo(() => {
  const { user, signOut, userId, loading: authLoading } = useStableAuth();
  const { isSeller, isSuperAdmin, loading: roleLoading, refreshRole } = useStableRole();
  const sellerAccess = useSellerAccess();
  const { tokenBalance, freeTokens, paidTokens, freeTokensExpiresAt, refreshBalance } = useTokens();

  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SellerSection>('overview');
  const [openProductForm, setOpenProductForm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const initStartTime = useRef(Date.now());
  
  // ✅ Check if data was prefetched (instant display)
  const hasPrefetchedData = useMemo(() => {
    return userId ? isDashboardCached(userId, true) : false;
  }, [userId]);
  
  const mountedTabs = useRef<Set<string>>(new Set(['overview']));

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  // ✅ Fast timeout - reduced to 3 seconds for snappier experience
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing) {
        const elapsed = Date.now() - initStartTime.current;
        console.log(`[SellerDashboard] ⚠️ Init timeout reached after ${elapsed}ms, forcing completion`);
        setIsInitializing(false);
      }
    }, 3000);

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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 2 * 60 * 1000,
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

  // ✅ Fast initialization - prioritize cached data and quick role checks
  useEffect(() => {
    const initDashboard = async () => {
      if (hasPrefetchedData && isSeller) {
        console.log('[SellerDashboard] ✅ Instant display from cache');
        setIsInitializing(false);
        return;
      }
      
      if (authLoading) return;
      
      if (!userId) {
        navigate('/auth', { replace: true });
        return;
      }
      
      if (isSuperAdmin) {
        navigate('/superadmin', { replace: true });
        return;
      }
      
      if (roleLoading) return;
      
      if (isSeller) {
        console.log('[SellerDashboard] ✅ Seller confirmed');
        setIsInitializing(false);
        return;
      }
      
      try {
        const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: userId });
        
        if (roleData === 'seller' || roleData === 'admin' || roleData === 'superadmin') {
          console.log('[SellerDashboard] ✅ Seller confirmed from DB');
          refreshRole();
          setIsInitializing(false);
          return;
        }
        
        navigate('/buyer-dashboard', { replace: true });
      } catch (err) {
        console.error('[SellerDashboard] Role check error:', err);
        setIsInitializing(false);
      }
    };
    
    initDashboard();
  }, [userId, authLoading, isSeller, isSuperAdmin, roleLoading, hasPrefetchedData, navigate, refreshRole]);

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
    setActiveSection('products');
    setOpenProductForm(true);
  }, []);

  // ✅ Fast skeleton decision
  const shouldShowSkeleton = !hasPrefetchedData && (
    isInitializing || 
    authLoading || 
    (roleLoading && !isSeller) || 
    !userId
  );

  if (shouldShowSkeleton) {
    return <SellerDashboardSkeleton />;
  }

  if (!userId) {
    return null;
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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

  if (isSuperAdmin) {
    return null;
  }

  if (!isSeller && !roleLoading && !isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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

  const trialStatus = {
    isInTrial: sellerAccess.isInTrial,
    trialEndDate: sellerAccess.trialEndDate,
    canPublish: sellerAccess.canPublish,
    isPremium: sellerAccess.hasActiveSubscription,
    loading: sellerAccess.loading,
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* 🔥 Notifications en temps réel */}
      <RealtimeOrdersNotification />
      <RealtimeMessagesNotification />

      {/* Sidebar */}
      <SellerSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isDark={isDark}
        onToggleDark={toggleDark}
        onSignOut={handleSignOut}
        shopName={shop?.shop_name}
        shopSlug={shop?.shop_slug}
        shopLogoUrl={shop?.logo_url}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden pb-20 lg:pb-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
            {/* Left spacer for mobile hamburger */}
            <div className="w-10 lg:hidden" />
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground">{sectionTitles[activeSection]}</h1>
              <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-semibold">
                Vendeur
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-2 text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Actualiser</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Banners */}
        <div className="px-4 sm:px-6 lg:px-8">
          {sellerAccess.subscriptionExpired && !sellerAccess.isInTrial && (
            <div className="pt-4">
              <SubscriptionExpiredBanner 
                userEmail={user?.email || ''} 
                userId={userId}
                onSubscriptionSuccess={() => sellerAccess.refresh()}
                isInTrial={sellerAccess.isInTrial}
              />
            </div>
          )}
          
          {sellerAccess.isInTrial && (
            <div className="pt-4">
              <TrialBanner 
                daysLeft={sellerAccess.trialDaysLeft} 
                trialEndDate={sellerAccess.trialEndDate}
              />
            </div>
          )}
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'overview' && (
            <Suspense fallback={<SectionSkeleton />}>
              <ShopOverviewTab
                shop={shop}
                products={products || []}
                tokenBalance={tokenBalance}
                trialStatus={trialStatus}
                onRefresh={handleRefresh}
                onPublishProduct={handlePublishProduct}
              />
            </Suspense>
          )}

          {activeSection === 'products' && (
            <Suspense fallback={<SectionSkeleton />}>
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
          )}

          {activeSection === 'messages-orders' && (
            <Suspense fallback={<SectionSkeleton />}>
              <MessagesOrdersTab userId={userId} />
            </Suspense>
          )}

          {activeSection === 'tokens' && (
            <Suspense fallback={<SectionSkeleton />}>
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
          )}

          {activeSection === 'settings' && (
            <Suspense fallback={<SectionSkeleton />}>
              <ShopSettingsTab
                shop={shop}
                onRefresh={handleRefresh}
              />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
});

SellerDashboard.displayName = 'SellerDashboard';

export default SellerDashboard;
