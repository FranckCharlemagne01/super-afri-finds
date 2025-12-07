import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  UserPlus,
  Store, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Percent,
  UserCheck,
  Hourglass
} from 'lucide-react';
import { motion } from 'framer-motion';

interface KPIData {
  total_users: number;
  new_users_30d: number;
  total_sellers: number;
  sellers_validated: number;
  sellers_pending: number;
  total_revenue: number;
  revenue_month: number;
  total_orders: number;
  orders_pending: number;
  orders_delivered: number;
  orders_cancelled: number;
  conversion_rate: number;
  total_unique_visitors: number;
}

interface VerticalKPISectionProps {
  stats: KPIData;
}

const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  color,
  bgColor,
  delay = 0
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  color: string;
  bgColor: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <Card className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 ${bgColor}`}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color} bg-white/80 shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const VerticalKPISection = ({ stats }: VerticalKPISectionProps) => {
  const kpis = [
    { title: 'Total Utilisateurs', value: stats.total_users.toLocaleString(), icon: Users, color: 'text-blue-600', bgColor: 'bg-gradient-to-r from-blue-50 to-blue-100/50' },
    { title: 'Nouveaux Utilisateurs (30j)', value: stats.new_users_30d, icon: UserPlus, color: 'text-indigo-600', bgColor: 'bg-gradient-to-r from-indigo-50 to-indigo-100/50' },
    { title: 'Total Vendeurs', value: stats.total_sellers, icon: Store, color: 'text-violet-600', bgColor: 'bg-gradient-to-r from-violet-50 to-violet-100/50' },
    { title: 'Vendeurs Validés', value: stats.sellers_validated, icon: UserCheck, color: 'text-emerald-600', bgColor: 'bg-gradient-to-r from-emerald-50 to-emerald-100/50' },
    { title: 'Vendeurs en Attente', value: stats.sellers_pending, icon: Hourglass, color: 'text-amber-600', bgColor: 'bg-gradient-to-r from-amber-50 to-amber-100/50' },
    { title: 'Revenus Totaux', value: `${stats.total_revenue.toLocaleString()} FCFA`, icon: DollarSign, color: 'text-green-600', bgColor: 'bg-gradient-to-r from-green-50 to-green-100/50' },
    { title: 'Revenus du Mois', value: `${stats.revenue_month.toLocaleString()} FCFA`, icon: TrendingUp, color: 'text-teal-600', bgColor: 'bg-gradient-to-r from-teal-50 to-teal-100/50' },
    { title: 'Total Commandes', value: stats.total_orders, icon: ShoppingBag, color: 'text-purple-600', bgColor: 'bg-gradient-to-r from-purple-50 to-purple-100/50' },
    { title: 'Commandes en Cours', value: stats.orders_pending, icon: Clock, color: 'text-orange-600', bgColor: 'bg-gradient-to-r from-orange-50 to-orange-100/50' },
    { title: 'Commandes Livrées', value: stats.orders_delivered, icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-gradient-to-r from-green-50 to-green-100/50' },
    { title: 'Commandes Annulées', value: stats.orders_cancelled, icon: XCircle, color: 'text-red-600', bgColor: 'bg-gradient-to-r from-red-50 to-red-100/50' },
    { title: 'Taux de Conversion', value: `${stats.conversion_rate.toFixed(1)}%`, icon: Percent, color: 'text-cyan-600', bgColor: 'bg-gradient-to-r from-cyan-50 to-cyan-100/50' },
    { title: 'Visiteurs Uniques', value: stats.total_unique_visitors.toLocaleString(), icon: Eye, color: 'text-pink-600', bgColor: 'bg-gradient-to-r from-pink-50 to-pink-100/50' },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
        <h2 className="text-xl font-bold text-foreground">Indicateurs Clés (KPIs)</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            bgColor={kpi.bgColor}
            delay={index * 0.03}
          />
        ))}
      </div>
    </section>
  );
};
