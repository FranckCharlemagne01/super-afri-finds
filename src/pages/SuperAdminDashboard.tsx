import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, RefreshCw, LayoutDashboard, ImageOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useImageCleanup } from '@/hooks/useImageCleanup';

// Vertical Layout Components
import { VerticalKPISection } from '@/components/superadmin/VerticalKPISection';
import { VerticalChartsSection } from '@/components/superadmin/VerticalChartsSection';
import { RealtimeSection } from '@/components/superadmin/RealtimeSection';
import { ManagementSection } from '@/components/superadmin/ManagementSection';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const { runFullCleanup } = useImageCleanup();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCleaningImages, setIsCleaningImages] = useState(false);

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

      const today = new Date().toDateString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const month30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const ordersToday = ordersData.filter(o => new Date(o.created_at).toDateString() === today);
      const ordersMonth = ordersData.filter(o => new Date(o.created_at) >= monthStart);

      const sellers = usersData.filter(u => u.role === 'seller');

      setStats({
        total_users: usersData.length,
        new_users_30d: usersData.filter(u => new Date(u.created_at) >= month30d).length,
        total_sellers: sellers.length,
        sellers_validated: sellers.length,
        sellers_pending: 0,
        total_revenue: ordersData.filter(o => ['completed', 'delivered'].includes(o.status)).reduce((s, o) => s + Number(o.total_amount || 0), 0),
        revenue_month: ordersMonth.filter(o => ['completed', 'delivered'].includes(o.status)).reduce((s, o) => s + Number(o.total_amount || 0), 0),
        total_orders: ordersData.length,
        orders_pending: ordersData.filter(o => o.status === 'pending').length,
        orders_delivered: ordersData.filter(o => ['delivered', 'completed'].includes(o.status)).length,
        orders_cancelled: ordersData.filter(o => o.status === 'cancelled').length,
        conversion_rate: visitorData?.total_unique_visitors ? (ordersData.length / visitorData.total_unique_visitors) * 100 : 0,
        total_unique_visitors: visitorData?.total_unique_visitors || 0,
      });

      // Generate chart data
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split('T')[0];
      });

      // Get seller performance data
      const sellerStats: Record<string, { name: string; sales: number }> = {};
      ordersData.filter(o => ['completed', 'delivered'].includes(o.status)).forEach(order => {
        if (!sellerStats[order.seller_id]) {
          const seller = usersData.find(u => u.user_id === order.seller_id);
          sellerStats[order.seller_id] = { name: seller?.full_name || 'Vendeur', sales: 0 };
        }
        sellerStats[order.seller_id].sales += Number(order.total_amount || 0);
      });
      const topSellers = Object.values(sellerStats).sort((a, b) => b.sales - a.sales).slice(0, 5);

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
          { name: 'En attente', value: ordersData.filter(o => o.status === 'pending').length, color: '#f59e0b' },
          { name: 'Confirmées', value: ordersData.filter(o => o.status === 'confirmed').length, color: '#3b82f6' },
          { name: 'Expédiées', value: ordersData.filter(o => o.status === 'shipped').length, color: '#8b5cf6' },
          { name: 'Livrées', value: ordersData.filter(o => ['delivered', 'completed'].includes(o.status)).length, color: '#22c55e' },
          { name: 'Annulées', value: ordersData.filter(o => o.status === 'cancelled').length, color: '#ef4444' },
        ],
        sellerPerformanceData: topSellers,
        hourlyActivityData: Array.from({ length: 24 }, (_, h) => ({
          hour: `${h}h`,
          visits: Math.floor(Math.random() * 50) + 5,
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

  const handleCleanupBrokenImages = async () => {
    try {
      setIsCleaningImages(true);
      toast({
        title: "Nettoyage en cours",
        description: "Scan DB + Storage… cela peut prendre quelques minutes.",
      });

      const data = await runFullCleanup();

      if (!data?.success) {
        const failed =
          (data?.report?.failed?.db_updates ?? 0) +
          (data?.report?.failed?.storage_deletes ?? 0) +
          (data?.report?.failed?.http_checks ?? 0) +
          (data?.report?.failed?.storage_list ?? 0);

        toast({
          title: "Nettoyage terminé avec erreurs",
          description: data?.error || `${failed} erreur(s) rencontrée(s). Voir les logs.`,
          variant: "destructive",
        });
        return;
      }

      const report = data?.report;
      const summary = report?.summary;

      const failedCount = summary?.failed ??
        (report?.failed?.db_updates ?? 0) +
          (report?.failed?.storage_deletes ?? 0) +
          (report?.failed?.http_checks ?? 0) +
          (report?.failed?.storage_list ?? 0);

      const removedDb = report?.deleted?.db_urls_removed ?? data?.result?.imagesRemovedFromDB ?? 0;
      const deletedStorage = report?.deleted?.storage_files_deleted ??
        ((data?.result?.storageFilesDeleted ?? 0) + (data?.result?.orphanedFilesDeleted ?? 0));
      const productsCleaned = summary?.db_cleaned ?? data?.result?.productsUpdated ?? 0;

      toast({
        title: failedCount > 0 ? "Nettoyage terminé (partiel)" : "✅ Nettoyage terminé",
        description: `${productsCleaned} produits nettoyés • ${removedDb} URLs retirées DB • ${deletedStorage} fichiers supprimés storage • ${failedCount} échecs`,
        variant: failedCount > 0 ? "destructive" : "default",
      });

      fetchData();
    } catch (e: any) {
      toast({
        title: "Nettoyage échoué",
        description: e?.message || "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setIsCleaningImages(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">SuperAdmin Dashboard</h1>
                  <p className="text-xs text-muted-foreground">Djassa Marketplace Analytics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCleanupBrokenImages}
                variant="outline"
                size="sm"
                className="gap-2 rounded-full"
                disabled={isCleaningImages}
              >
                <ImageOff className={isCleaningImages ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                <span className="hidden sm:inline">Nettoyer images</span>
              </Button>
              <Button onClick={fetchData} variant="outline" size="sm" className="gap-2 rounded-full">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              <Button onClick={() => navigate('/marketplace')} size="sm" className="rounded-full">
                Retour au site
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Vertical Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-12">
          {/* Section 1: KPIs */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <VerticalKPISection stats={stats} />
            </motion.div>
          )}

          {/* Section 2: Charts */}
          {chartData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <VerticalChartsSection {...chartData} />
            </motion.div>
          )}

          {/* Section 3: Realtime */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <RealtimeSection />
          </motion.div>

          {/* Section 4: Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ManagementSection orders={orders} users={users} onRefresh={fetchData} />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
