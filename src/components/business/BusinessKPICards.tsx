import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  ShoppingBag, 
  Store, 
  Users, 
  TrendingUp, 
  Percent,
  Package,
  Coins,
  Eye,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { BusinessStats } from '@/hooks/useBusinessDashboard';

interface BusinessKPICardsProps {
  stats: BusinessStats;
}

const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient,
  delay = 0
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: any;
  gradient: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <Card className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${gradient}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-white/80 uppercase tracking-wide">{title}</p>
            <p className="text-2xl lg:text-3xl font-bold text-white tabular-nums">{value}</p>
            {subtitle && (
              <p className="text-xs text-white/70">{subtitle}</p>
            )}
          </div>
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA';
};

export const BusinessKPICards = ({ stats }: BusinessKPICardsProps) => {
  return (
    <div className="space-y-6">
      {/* Revenue KPIs */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          💰 Revenus & Monétisation
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Chiffre d'Affaires Total"
            value={formatCurrency(stats.total_revenue)}
            subtitle={`+${formatCurrency(stats.revenue_today)} aujourd'hui`}
            icon={DollarSign}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
            delay={0}
          />
          <KPICard
            title="CA du Mois"
            value={formatCurrency(stats.revenue_month)}
            subtitle={`Semaine: ${formatCurrency(stats.revenue_week)}`}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-green-500 to-green-700"
            delay={0.05}
          />
          <KPICard
            title="Commissions Marketplace"
            value={formatCurrency(stats.total_commissions)}
            subtitle={`Mois: ${formatCurrency(stats.commissions_month)}`}
            icon={Percent}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            delay={0.1}
          />
          <KPICard
            title="Revenus Jetons"
            value={formatCurrency(stats.token_revenue)}
            subtitle={`Abonnements: ${formatCurrency(stats.subscription_revenue)}`}
            icon={Coins}
            gradient="bg-gradient-to-br from-violet-500 to-purple-700"
            delay={0.15}
          />
        </div>
      </div>

      {/* Activity KPIs */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          📊 Activité Marketplace
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KPICard
            title="Commandes Totales"
            value={stats.total_orders.toLocaleString()}
            subtitle={`+${stats.orders_today} aujourd'hui`}
            icon={ShoppingBag}
            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
            delay={0.2}
          />
          <KPICard
            title="Boutiques Actives"
            value={stats.total_shops}
            subtitle={`${stats.shops_with_subscription} abonnées`}
            icon={Store}
            gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
            delay={0.25}
          />
          <KPICard
            title="Clients Actifs"
            value={stats.total_customers.toLocaleString()}
            subtitle={`${stats.active_customers_month} ce mois`}
            icon={Users}
            gradient="bg-gradient-to-br from-pink-500 to-rose-600"
            delay={0.3}
          />
          <KPICard
            title="Produits Actifs"
            value={stats.total_products}
            subtitle={`${stats.boosted_products} boostés`}
            icon={Package}
            gradient="bg-gradient-to-br from-cyan-500 to-cyan-700"
            delay={0.35}
          />
          <KPICard
            title="Visiteurs"
            value={stats.total_visitors.toLocaleString()}
            subtitle={`+${stats.visitors_today} aujourd'hui`}
            icon={Eye}
            gradient="bg-gradient-to-br from-slate-500 to-slate-700"
            delay={0.4}
          />
        </div>
      </div>

      {/* Order Status KPIs */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          📦 Statut Commandes
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          <KPICard
            title="En Attente"
            value={stats.orders_pending}
            icon={ShoppingBag}
            gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
            delay={0.45}
          />
          <KPICard
            title="Livrées"
            value={stats.orders_delivered}
            icon={Package}
            gradient="bg-gradient-to-br from-green-600 to-green-800"
            delay={0.5}
          />
          <KPICard
            title="Annulées"
            value={stats.orders_cancelled}
            icon={ShoppingBag}
            gradient="bg-gradient-to-br from-red-500 to-red-700"
            delay={0.55}
          />
          <KPICard
            title="Panier Moyen"
            value={formatCurrency(stats.average_order_value)}
            icon={CreditCard}
            gradient="bg-gradient-to-br from-teal-500 to-teal-700"
            delay={0.6}
          />
        </div>
      </div>
    </div>
  );
};
