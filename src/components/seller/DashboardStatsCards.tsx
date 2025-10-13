import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Package, ShoppingCart, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  gradient: string;
}

const StatsCard = ({ title, value, icon: Icon, trend, trendUp, gradient }: StatsCardProps) => (
  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              <TrendingUp className={cn(
                "h-4 w-4",
                trendUp ? "text-green-500" : "text-red-500 rotate-180"
              )} />
              <span className={cn(
                "text-sm font-medium",
                trendUp ? "text-green-500" : "text-red-500"
              )}>
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          gradient
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface DashboardStatsCardsProps {
  products: any[];
  orders?: any[];
  messages?: any[];
}

export const DashboardStatsCards = ({ products, orders = [], messages = [] }: DashboardStatsCardsProps) => {
  const activeProducts = products.filter(p => p.is_active).length;
  const thisMonthProducts = products.filter(p => {
    const createdAt = new Date(p.created_at);
    const now = new Date();
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    {
      title: 'Ventes du mois',
      value: '0 FCFA',
      icon: TrendingUp,
      trend: '+0%',
      trendUp: true,
      gradient: 'bg-gradient-to-br from-violet-500 to-purple-600'
    },
    {
      title: 'Produits actifs',
      value: activeProducts,
      icon: Package,
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600'
    },
    {
      title: 'Commandes récentes',
      value: orders.length,
      icon: ShoppingCart,
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600'
    },
    {
      title: 'Messages',
      value: messages.length,
      icon: MessageSquare,
      gradient: 'bg-gradient-to-br from-orange-500 to-amber-600'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatsCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};
