import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, LayoutDashboard, Users, ShoppingBag, Package, Coins, MessageSquare, Trophy, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Components
import { KPICards } from '@/components/superadmin/KPICards';
import { AnalyticsCharts } from '@/components/superadmin/AnalyticsCharts';
import { OrdersManagement } from '@/components/superadmin/OrdersManagement';
import { UsersManagement } from '@/components/superadmin/UsersManagement';
import { TopSellersSection } from '@/components/superadmin/TopSellersSection';
import { MessagesMonitoring } from '@/components/superadmin/MessagesMonitoring';
import { TokenStatsSuperAdmin } from '@/components/TokenStatsSuperAdmin';
import { TokenTransactionsSuperAdmin } from '@/components/TokenTransactionsSuperAdmin';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      toast({ title: "Accès refusé", description: "Permissions insuffisantes.", variant: "destructive" });
      navigate('/');
      return;
    }
    if (isSuperAdmin) fetchData();
  }, [isSuperAdmin, roleLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, ordersRes, tokensRes, visitorRes] = await Promise.all([
        supabase.rpc('get_users_with_profiles'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('token_transactions').select('*').eq('transaction_type', 'purchase').eq('status', 'completed'),
        supabase.rpc('get_visitor_statistics').single()
      ]);

      const usersData = usersRes.data || [];
      const ordersData = ordersRes.data || [];
      const tokensData = tokensRes.data || [];
      const visitorData = visitorRes.data;

      setUsers(usersData);
      setOrders(ordersData);

      // Calculate stats
      const today = new Date().toDateString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const week7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const month30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const ordersToday = ordersData.filter(o => new Date(o.created_at).toDateString() === today);
      const ordersMonth = ordersData.filter(o => new Date(o.created_at) >= monthStart);

      setStats({
        total_users: usersData.length,
        total_sellers: usersData.filter(u => u.role === 'seller').length,
        total_buyers: usersData.filter(u => u.role === 'buyer').length,
        total_active_products: 0,
        total_orders: ordersData.length,
        total_revenue: ordersData.filter(o => ['completed', 'delivered'].includes(o.status)).reduce((s, o) => s + Number(o.total_amount || 0), 0),
        orders_today: ordersToday.length,
        new_users_today: usersData.filter(u => new Date(u.created_at).toDateString() === today).length,
        new_users_7d: usersData.filter(u => new Date(u.created_at) >= week7d).length,
        new_users_30d: usersData.filter(u => new Date(u.created_at) >= month30d).length,
        total_tokens_revenue: tokensData.reduce((s, t) => s + Number(t.price_paid || 0), 0),
        total_tokens_distributed: tokensData.reduce((s, t) => s + Number(t.tokens_amount || 0), 0),
        total_unique_visitors: visitorData?.total_unique_visitors || 0,
        new_visitors_24h: visitorData?.new_visitors_24h || 0,
        new_visitors_7d: visitorData?.new_visitors_7d || 0,
        total_visits_today: visitorData?.total_visits_today || 0,
        orders_pending: ordersData.filter(o => o.status === 'pending').length,
        orders_delivered: ordersData.filter(o => ['delivered', 'completed'].includes(o.status)).length,
        orders_cancelled: ordersData.filter(o => o.status === 'cancelled').length,
        revenue_today: ordersToday.filter(o => ['completed', 'delivered'].includes(o.status)).reduce((s, o) => s + Number(o.total_amount || 0), 0),
        revenue_month: ordersMonth.filter(o => ['completed', 'delivered'].includes(o.status)).reduce((s, o) => s + Number(o.total_amount || 0), 0),
        conversion_rate: visitorData?.total_unique_visitors ? (ordersData.length / visitorData.total_unique_visitors) * 100 : 0,
        cart_abandonment_rate: 0,
      });

      // Generate chart data
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split('T')[0];
      });

      setChartData({
        registrationData: last30Days.map(date => ({
          date: date.slice(5),
          count: usersData.filter(u => u.created_at?.startsWith(date)).length
        })),
        salesData: last30Days.map(date => ({
          date: date.slice(5),
          amount: ordersData.filter(o => o.created_at?.startsWith(date) && ['completed', 'delivered'].includes(o.status)).reduce((s, o) => s + Number(o.total_amount || 0), 0),
          orders: ordersData.filter(o => o.created_at?.startsWith(date)).length
        })),
        orderStatusData: [
          { name: 'En attente', value: ordersData.filter(o => o.status === 'pending').length, color: '#fbbf24' },
          { name: 'Confirmées', value: ordersData.filter(o => o.status === 'confirmed').length, color: '#3b82f6' },
          { name: 'Expédiées', value: ordersData.filter(o => o.status === 'shipped').length, color: '#8b5cf6' },
          { name: 'Livrées', value: ordersData.filter(o => ['delivered', 'completed'].includes(o.status)).length, color: '#22c55e' },
          { name: 'Annulées', value: ordersData.filter(o => o.status === 'cancelled').length, color: '#ef4444' },
        ],
        sellerPerformanceData: [],
        hourlyActivityData: Array.from({ length: 24 }, (_, h) => ({
          hour: `${h}h`,
          visits: Math.floor(Math.random() * 50),
          orders: ordersData.filter(o => new Date(o.created_at).getHours() === h && new Date(o.created_at).toDateString() === today).length
        }))
      });

    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  SuperAdmin Dashboard
                </h1>
                <p className="text-xs text-muted-foreground">Djassa Marketplace Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              <Button onClick={() => navigate('/marketplace')} size="sm">
                Retour au site
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        {stats && <KPICards stats={stats} />}

        {/* Charts */}
        {chartData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <AnalyticsCharts {...chartData} />
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            {[
              { value: 'orders', icon: ShoppingBag, label: 'Commandes' },
              { value: 'users', icon: Users, label: 'Utilisateurs' },
              { value: 'sellers', icon: Trophy, label: 'Vendeurs' },
              { value: 'messages', icon: MessageSquare, label: 'Messages' },
              { value: 'tokens', icon: Coins, label: 'Jetons' },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="orders">
            <OrdersManagement orders={orders} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement users={users} />
          </TabsContent>

          <TabsContent value="sellers">
            <TopSellersSection />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesMonitoring />
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6">
            <TokenStatsSuperAdmin />
            <TokenTransactionsSuperAdmin />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
