import { useState, useEffect, useCallback } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useStableData } from '@/hooks/useStableData';
import { useTokens } from '@/hooks/useTokens';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ModernSellerHeader } from '@/components/seller/ModernSellerHeader';
import { SellerSidebar } from '@/components/seller/SellerSidebar';
import { DashboardStatsCards } from '@/components/seller/DashboardStatsCards';
import { RecentOrdersCard } from '@/components/seller/RecentOrdersCard';
import { RecentMessagesCard } from '@/components/seller/RecentMessagesCard';
import { PerformanceChart } from '@/components/seller/PerformanceChart';
import { QuickActionsCard } from '@/components/seller/QuickActionsCard';
import { TokenBalanceCard } from '@/components/TokenBalanceCard';
import { ProductsTab } from '@/components/seller/ProductsTab';
import { MessagesOrdersTab } from '@/components/seller/MessagesOrdersTab';
import { TokensSubscriptionTab } from '@/components/seller/TokensSubscriptionTab';
import { ShopSettingsTab } from '@/components/seller/ShopSettingsTab';
import { SellerDashboardSkeleton } from '@/components/seller/SellerDashboardSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Store } from 'lucide-react';

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
  const trialStatus = useTrialStatus();
  const { tokenBalance, freeTokens, paidTokens, freeTokensExpiresAt, refreshBalance } = useTokens();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [openProductForm, setOpenProductForm] = useState(false);

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

  useEffect(() => {
    if (roleLoading || !userId) return;
    
    const currentPath = window.location.pathname;
    
    if (isSuperAdmin && currentPath !== '/superadmin') {
      navigate('/superadmin', { replace: true });
      return;
    }
    
    if (!isSeller && !roleLoading) {
      navigate('/buyer-dashboard', { replace: true });
      return;
    }
    
    // Check for payment success
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');
    
    if (paymentStatus === 'success' && reference) {
      verifyPayment(reference);
      window.history.replaceState({}, document.title, '/seller-dashboard');
    }
  }, [userId, isSeller, isSuperAdmin, roleLoading, navigate]);

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
          description: data.message || "Paiement effectué avec succès !",
        });
        refetchProducts();
        refreshBalance();
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
  }, [refetchProducts, refetchShop, refreshBalance, refreshRole]);

  const handlePublishProduct = useCallback(() => {
    setActiveTab('products');
    setOpenProductForm(true);
  }, []);

  if (roleLoading || !userId || shopLoading) {
    return <SellerDashboardSkeleton />;
  }

  if (isSuperAdmin) {
    return null;
  }

  if (!isSeller && !roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Accès vendeur requis</h2>
            <p className="text-muted-foreground mb-6">
              Vous devez activer votre profil vendeur pour accéder à cet espace.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar Navigation */}
      <SellerSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        shopName={shop?.shop_name}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <ModernSellerHeader
            shop={shop}
            onSignOut={handleSignOut}
            trialStatus={trialStatus}
            tokenBalance={tokenBalance}
            freeTokens={freeTokens}
            freeTokensExpiresAt={freeTokensExpiresAt}
            onPublishProduct={handlePublishProduct}
          />

          {/* Overview Tab - Dashboard */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <DashboardStatsCards products={products || []} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <PerformanceChart />
                  <RecentOrdersCard onViewAll={() => setActiveTab('messages-orders')} />
                </div>
                
                <div className="space-y-6">
                  <TokenBalanceCard 
                    totalTokens={tokenBalance}
                    freeTokens={freeTokens}
                    paidTokens={paidTokens}
                    expiresAt={freeTokensExpiresAt}
                  />
                  <QuickActionsCard
                    shopSlug={shop?.shop_slug}
                    onPublishProduct={handlePublishProduct}
                    onSettings={() => setActiveTab('settings')}
                  />
                  <RecentMessagesCard onViewAll={() => setActiveTab('messages-orders')} />
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <ProductsTab
              products={products || []}
              loading={productsLoading}
              shopId={shop?.id}
              onRefresh={handleRefresh}
              openFormTrigger={openProductForm}
              onFormOpenChange={setOpenProductForm}
            />
          )}

          {/* Messages & Orders Tab */}
          {activeTab === 'messages-orders' && (
            <MessagesOrdersTab userId={userId} />
          )}

          {/* Tokens Tab */}
          {activeTab === 'tokens' && (
            <TokensSubscriptionTab
              tokenBalance={tokenBalance}
              freeTokens={freeTokens}
              paidTokens={paidTokens}
              freeTokensExpiresAt={freeTokensExpiresAt}
              trialStatus={trialStatus}
              products={products || []}
              onRefresh={handleRefresh}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <ShopSettingsTab
              shop={shop}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
