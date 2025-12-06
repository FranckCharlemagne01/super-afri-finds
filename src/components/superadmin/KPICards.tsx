import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  Eye,
  ShoppingCart,
  Package,
  UserPlus,
  Percent,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface KPICardsProps {
  stats: {
    total_users: number;
    total_sellers: number;
    total_buyers: number;
    total_active_products: number;
    total_orders: number;
    total_revenue: number;
    orders_today: number;
    new_users_today: number;
    total_tokens_revenue: number;
    total_tokens_distributed: number;
    total_unique_visitors: number;
    new_visitors_24h: number;
    new_visitors_7d: number;
    total_visits_today: number;
    orders_pending: number;
    orders_delivered: number;
    orders_cancelled: number;
    revenue_today: number;
    revenue_month: number;
    new_users_7d: number;
    new_users_30d: number;
    conversion_rate: number;
    cart_abandonment_rate: number;
  };
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

export const KPICards = ({ stats }: KPICardsProps) => {
  return (
    <div className="space-y-6">
      {/* Primary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KPICard
          title="Utilisateurs"
          value={stats.total_users.toLocaleString()}
          subtitle={`+${stats.new_users_today} aujourd'hui`}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          delay={0}
        />
        <KPICard
          title="Vendeurs Actifs"
          value={stats.total_sellers}
          subtitle={`${stats.total_buyers} acheteurs`}
          icon={ShoppingBag}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          delay={0.05}
        />
        <KPICard
          title="Produits Actifs"
          value={stats.total_active_products}
          subtitle="En ligne"
          icon={Package}
          gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          delay={0.1}
        />
        <KPICard
          title="Commandes"
          value={stats.total_orders}
          subtitle={`+${stats.orders_today} aujourd'hui`}
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          delay={0.15}
        />
        <KPICard
          title="Visiteurs"
          value={stats.total_unique_visitors.toLocaleString()}
          subtitle={`+${stats.new_visitors_24h} (24h)`}
          icon={Eye}
          gradient="bg-gradient-to-br from-pink-500 to-rose-600"
          delay={0.2}
        />
      </div>

      {/* Revenue & Performance KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Revenus du Jour"
          value={`${stats.revenue_today.toLocaleString()} FCFA`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-green-500 to-green-700"
          delay={0.25}
        />
        <KPICard
          title="Revenus du Mois"
          value={`${stats.revenue_month.toLocaleString()} FCFA`}
          subtitle="Commandes complétées"
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-teal-500 to-teal-700"
          delay={0.3}
        />
        <KPICard
          title="Nouveaux (7j)"
          value={stats.new_users_7d}
          subtitle={`${stats.new_users_30d} (30j)`}
          icon={UserPlus}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
          delay={0.35}
        />
        <KPICard
          title="Taux de Conversion"
          value={`${stats.conversion_rate.toFixed(1)}%`}
          subtitle="Visites → Commandes"
          icon={Percent}
          gradient="bg-gradient-to-br from-cyan-500 to-cyan-700"
          delay={0.4}
        />
      </div>

      {/* Order Status KPIs */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        <KPICard
          title="En Attente"
          value={stats.orders_pending}
          icon={Clock}
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
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-red-500 to-red-700"
          delay={0.55}
        />
        <KPICard
          title="Revenus Jetons"
          value={`${stats.total_tokens_revenue.toLocaleString()} FCFA`}
          subtitle={`${stats.total_tokens_distributed} distribués`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-purple-500 to-purple-700"
          delay={0.6}
        />
      </div>
    </div>
  );
};
