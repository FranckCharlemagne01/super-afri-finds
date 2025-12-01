import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Package, 
  Star, 
  ShoppingBag, 
  Plus,
  BarChart3,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  is_active?: boolean;
  reviews_count?: number;
  created_at: string;
}

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
}

interface TrialStatus {
  isInTrial: boolean;
  isPremium: boolean;
}

interface ShopOverviewTabProps {
  shop: Shop | null;
  products: Product[];
  tokenBalance: number;
  trialStatus: TrialStatus;
  onRefresh: () => void;
  onPublishProduct?: () => void;
}

export const ShopOverviewTab = ({
  shop,
  products,
  tokenBalance,
  trialStatus,
  onRefresh,
  onPublishProduct
}: ShopOverviewTabProps) => {
  const navigate = useNavigate();

  const activeProducts = products.filter(p => p.is_active).length;
  const totalReviews = products.reduce((sum, p) => sum + (p.reviews_count || 0), 0);
  const thisMonthProducts = products.filter(p => {
    const createdAt = new Date(p.created_at);
    const now = new Date();
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    {
      title: 'Total Produits',
      value: products.length,
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Produits Actifs',
      value: activeProducts,
      icon: Activity,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Ce Mois',
      value: thisMonthProducts,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Avis Clients',
      value: totalReviews,
      icon: Star,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const quickActions = [
    {
      label: 'Publier un produit',
      icon: Plus,
      onClick: onPublishProduct || (() => {}),
      variant: 'default' as const,
    },
    {
      label: 'Voir ma boutique',
      icon: ShoppingBag,
      onClick: () => shop && navigate(`/boutique/${shop.shop_slug}`),
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in-0 duration-500">
      {/* Welcome Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/10 via-primary/5 to-background overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-4 md:p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 break-words">
                Bienvenue, {shop?.shop_name} ! 👋
              </h2>
              <p className="text-sm md:text-base text-muted-foreground break-words">
                Gérez vos produits, suivez vos performances et développez votre activité.
              </p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 md:gap-3 mt-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                onClick={action.onClick}
                variant={action.variant}
                size={action.variant === 'default' ? 'default' : 'default'}
                className="gap-2 transition-all hover:scale-105 active:scale-95 touch-manipulation flex-1 sm:flex-none min-w-[140px]"
              >
                <action.icon className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden group cursor-pointer animate-in fade-in-0 slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
          >
            <CardContent className="p-4 md:p-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex flex-col gap-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-5 w-5 md:h-6 md:w-6 text-primary`} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl md:text-3xl lg:text-4xl font-bold tabular-nums">{stat.value}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">{stat.title}</p>
                  {/* Mini progress bar for visual appeal */}
                  <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-1000`}
                      style={{ width: `${Math.min(stat.value * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart - Enhanced Visual */}
      <Card className="border-0 shadow-lg overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <span className="break-words">Performance de votre boutique</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 relative">
          <div className="h-56 md:h-72 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50 relative overflow-hidden">
            {/* Decorative animated bars */}
            <div className="absolute inset-0 flex items-end justify-around px-8 py-8 gap-2">
              {[40, 70, 45, 85, 60, 75, 50].map((height, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-primary/20 rounded-t-lg animate-pulse"
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${i * 200}ms`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
            
            <div className="text-center px-4 relative z-10 bg-background/80 backdrop-blur-sm rounded-xl p-6">
              <Activity className="h-12 w-12 md:h-16 md:w-16 text-primary mx-auto mb-3 animate-pulse" />
              <p className="text-base md:text-lg font-semibold text-foreground mb-1">
                Graphiques de performance
              </p>
              <p className="text-sm md:text-base text-muted-foreground">
                Bientôt disponibles
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-sm mx-auto break-words">
                Suivez vos ventes, vos vues et vos statistiques détaillées en temps réel
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
