import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard';
import { useStableRole } from '@/hooks/useStableRole';
import { ArrowLeft, RefreshCw, LayoutDashboard, Building2, ArrowRightLeft, Wrench } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

// Business Dashboard Components
import { BusinessKPICards } from '@/components/business/BusinessKPICards';
import { BusinessRevenueChart } from '@/components/business/BusinessRevenueChart';
import { BusinessTopShops } from '@/components/business/BusinessTopShops';
import { BusinessTopProducts } from '@/components/business/BusinessTopProducts';
import { BusinessCategoryPerformance } from '@/components/business/BusinessCategoryPerformance';

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useStableRole();
  const {
    stats,
    revenueChart,
    topShops,
    topProducts,
    categoryPerformance,
    loading,
    error,
    refetch,
    isAuthorized,
  } = useBusinessDashboard();

  // Handle unauthorized access
  if (!loading && !isAuthorized) {
    toast({
      title: 'Accès refusé',
      description: 'Vous n\'avez pas les permissions nécessaires pour accéder à ce tableau de bord.',
      variant: 'destructive',
    });
    navigate('/');
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-[350px] rounded-xl" />
              <Skeleton className="h-[350px] rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto">
            <Building2 className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Erreur de chargement</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={refetch} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

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
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Dashboard Business</h1>
                  <p className="text-xs text-muted-foreground">Pilotage de la performance Djassa</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={refetch} variant="outline" size="sm" className="gap-2 rounded-full">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              {/* Return to SuperAdmin Technical - visible only for superadmin role holders */}
              {isSuperAdmin && (
                <Button 
                  onClick={() => navigate('/superadmin')} 
                  size="sm" 
                  variant="outline" 
                  className="rounded-full gap-2 border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700"
                >
                  <Wrench className="w-4 h-4" />
                  <span className="hidden sm:inline">Superadmin Technique</span>
                  <ArrowRightLeft className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-12">
          {/* Section 1: KPIs */}
          {stats && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                <h2 className="text-xl font-bold text-foreground">Indicateurs Clés</h2>
              </div>
              <BusinessKPICards stats={stats} />
            </motion.section>
          )}

          {/* Section 2: Revenue Charts */}
          {revenueChart && revenueChart.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
                <h2 className="text-xl font-bold text-foreground">Revenus & Monétisation</h2>
              </div>
              <BusinessRevenueChart data={revenueChart} />
            </motion.section>
          )}

          {/* Section 3: Top Shops & Products */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
              <h2 className="text-xl font-bold text-foreground">Vendeurs & Produits</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BusinessTopShops shops={topShops} />
              <BusinessTopProducts products={topProducts} />
            </div>
          </motion.section>

          {/* Section 4: Category Performance */}
          {categoryPerformance && categoryPerformance.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                <h2 className="text-xl font-bold text-foreground">Performance par Catégorie</h2>
              </div>
              <BusinessCategoryPerformance categories={categoryPerformance} />
            </motion.section>
          )}
        </div>
      </main>
    </div>
  );
};

export default BusinessDashboard;
