import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, Package, ShoppingBag, DollarSign, TrendingUp, 
  ShieldAlert, Store, Plus, Eye, Bell, ArrowUpRight
} from 'lucide-react';
import type { AdminSection } from './SuperAdminSidebar';

interface OverviewStats {
  total_users: number;
  total_sellers: number;
  total_buyers: number;
  total_active_products: number;
  total_orders: number;
  total_revenue: number;
  orders_today: number;
  new_users_today: number;
}

interface SuperAdminOverviewProps {
  stats: OverviewStats | null;
  loading: boolean;
  onNavigate: (section: AdminSection) => void;
}

export const SuperAdminOverview = ({ stats, loading, onNavigate }: SuperAdminOverviewProps) => {
  const kpis = [
    {
      label: 'Utilisateurs',
      value: stats?.total_users ?? 0,
      sub: `+${stats?.new_users_today ?? 0} aujourd'hui`,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Boutiques actives',
      value: stats?.total_sellers ?? 0,
      sub: 'Vendeurs',
      icon: Store,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Commandes',
      value: stats?.total_orders ?? 0,
      sub: `+${stats?.orders_today ?? 0} aujourd'hui`,
      icon: ShoppingBag,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Revenus',
      value: `${new Intl.NumberFormat('fr-FR').format(stats?.total_revenue ?? 0)} F`,
      sub: 'Commandes terminées',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ];

  const quickActions = [
    { label: 'Voir boutiques', icon: Store, section: 'shops' as AdminSection },
    { label: 'Commandes', icon: ShoppingBag, section: 'orders' as AdminSection },
    { label: 'Alertes sécurité', icon: ShieldAlert, section: 'security' as AdminSection },
    { label: 'Analytics', icon: TrendingUp, section: 'analytics' as AdminSection },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de la plateforme Djassa</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Actions rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.section)}
              className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-card hover:bg-muted/40 hover:border-border transition-all group"
            >
              <action.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-foreground">{action.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-foreground">Commissions (5%)</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {new Intl.NumberFormat('fr-FR').format((stats?.total_revenue ?? 0) * 0.05)} FCFA
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-foreground">Revenus vendeurs</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {new Intl.NumberFormat('fr-FR').format((stats?.total_revenue ?? 0) * 0.95)} FCFA
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Package className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-sm font-medium text-foreground">Produits actifs</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {stats?.total_active_products ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
