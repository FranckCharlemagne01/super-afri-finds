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
import { ShopOverviewTab } from '@/components/seller/ShopOverviewTab';
import { ProductsTab } from '@/components/seller/ProductsTab';
import { MessagesOrdersTab } from '@/components/seller/MessagesOrdersTab';
import { TokensSubscriptionTab } from '@/components/seller/TokensSubscriptionTab';
import { ShopSettingsTab } from '@/components/seller/ShopSettingsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
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
  const trialStatus = useTrialStatus();
  const { tokenBalance, freeTokens, paidTokens, freeTokensExpiresAt, refreshBalance } = useTokens();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

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

  if (roleLoading || !userId || shopLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-center text-muted-foreground">Chargement de votre boutique...</p>
          </CardContent>
        </Card>
      </div>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Modern Header */}
        <ModernSellerHeader
          shop={shop}
          onSignOut={handleSignOut}
          trialStatus={trialStatus}
          tokenBalance={tokenBalance}
          freeTokens={freeTokens}
          freeTokensExpiresAt={freeTokensExpiresAt}
        />

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-card/50 backdrop-blur-sm border shadow-sm h-auto p-1">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Ma Boutique</span>
              <span className="sm:hidden">Boutique</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Produits</span>
              <span className="sm:hidden">Produits</span>
            </TabsTrigger>
            <TabsTrigger value="messages-orders" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages & Commandes</span>
              <span className="sm:hidden">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="tokens" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">Jetons & Abonnement</span>
              <span className="sm:hidden">Jetons</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paramètres Boutique</span>
              <span className="sm:hidden">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <ShopOverviewTab
              shop={shop}
              products={products || []}
              tokenBalance={tokenBalance}
              trialStatus={trialStatus}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-6 mt-6">
            <ProductsTab
              products={products || []}
              loading={productsLoading}
              shopId={shop?.id}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="messages-orders" className="space-y-6 mt-6">
            <MessagesOrdersTab userId={userId} />
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6 mt-6">
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

          <TabsContent value="settings" className="space-y-6 mt-6">
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
