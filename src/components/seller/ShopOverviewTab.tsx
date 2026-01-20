import { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Package, 
  Star, 
  ShoppingBag, 
  Plus,
  BarChart3,
  Activity,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  canPublish?: boolean;
}

interface ShopOverviewTabProps {
  shop: Shop | null;
  products: Product[];
  tokenBalance: number;
  trialStatus: TrialStatus;
  onRefresh: () => void;
  onPublishProduct?: () => void;
}

export const ShopOverviewTab = memo(({
  shop,
  products,
  tokenBalance,
  trialStatus,
  onRefresh,
  onPublishProduct
}: ShopOverviewTabProps) => {
  const navigate = useNavigate();

  // ✅ Memoize expensive calculations
  const { activeProducts, totalReviews, thisMonthProducts } = useMemo(() => {
    const active = products.filter(p => p.is_active).length;
    const reviews = products.reduce((sum, p) => sum + (p.reviews_count || 0), 0);
    const now = new Date();
    const thisMonth = products.filter(p => {
      const createdAt = new Date(p.created_at);
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;
    
    return { activeProducts: active, totalReviews: reviews, thisMonthProducts: thisMonth };
  }, [products]);

  // ✅ Memoize stats array
  const stats = useMemo(() => [
    {
      title: 'Total Produits',
      value: products.length,
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600',
    },
    {
      title: 'Produits Actifs',
      value: activeProducts,
      icon: Activity,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600',
    },
    {
      title: 'Ce Mois',
      value: thisMonthProducts,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-600',
    },
    {
      title: 'Avis Clients',
      value: totalReviews,
      icon: Star,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-600',
    },
  ], [products.length, activeProducts, thisMonthProducts, totalReviews]);

  const canPublish = trialStatus.canPublish ?? true;

  // ✅ Memoize quick actions
  const quickActions = useMemo(() => [
    {
      label: 'Publier un produit',
      icon: canPublish ? Plus : Lock,
      onClick: canPublish ? (onPublishProduct || (() => {})) : undefined,
      variant: 'default' as const,
      description: canPublish ? 'Ajouter un nouveau produit' : 'Abonnement requis',
      disabled: !canPublish,
    },
    {
      label: 'Voir ma boutique',
      icon: ShoppingBag,
      onClick: () => shop && navigate(`/boutique/${shop.shop_slug}`),
      variant: 'outline' as const,
      description: 'Voir la page publique',
      disabled: false,
    },
  ], [canPublish, onPublishProduct, shop, navigate]);

  return (
    <div className="space-y-3 md:space-y-4 animate-in fade-in-0 duration-500">
      {/* Welcome Section - Modernized */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden">
        <CardContent className="p-4 md:p-5 lg:p-6">
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold mb-1.5 break-words bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Bienvenue, {shop?.shop_name} ! 👋
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground break-words">
              Gérez vos produits et développez votre activité
            </p>
          </div>
          
          {/* Quick Actions Grid - Mobile First */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {quickActions.map((action) => (
              <TooltipProvider key={action.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={action.onClick}
                        variant={action.variant}
                        disabled={action.disabled}
                        className={`h-auto py-3 md:py-4 flex flex-col items-center gap-2 transition-all touch-manipulation rounded-xl shadow-sm w-full ${
                          action.disabled 
                            ? 'opacity-60 cursor-not-allowed' 
                            : 'hover:scale-[1.02] active:scale-95'
                        }`}
                      >
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${action.variant === 'default' ? 'bg-primary-foreground/20' : 'bg-primary/10'} flex items-center justify-center`}>
                          <action.icon className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <div className="text-center">
                          <span className="text-xs md:text-sm font-medium block">{action.label}</span>
                          <span className="text-[10px] md:text-xs text-muted-foreground/80 mt-0.5 block">{action.description}</span>
                        </div>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {action.disabled && (
                    <TooltipContent>
                      <p>Renouvelez votre abonnement</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-3">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group rounded-2xl animate-in fade-in-0 slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
          >
            <CardContent className="p-3 md:p-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 space-y-2 md:space-y-3">
                {/* Icon & Value Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl ${stat.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.textColor}`} />
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <p className="text-2xl md:text-3xl font-bold tabular-nums truncate">{stat.value}</p>
                  </div>
                </div>
                
                {/* Title & Progress */}
                <div className="space-y-1.5">
                  <p className="text-[11px] md:text-xs text-muted-foreground font-medium truncate leading-tight">
                    {stat.title}
                  </p>
                  <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-1000 rounded-full`}
                      style={{ width: `${Math.min(stat.value * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart - Mobile-First Enhanced */}
      <Card className="border-0 shadow-lg overflow-hidden rounded-2xl">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <span className="break-words">Performance boutique</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-5 pt-0">
          <div className="h-48 md:h-64 flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/5 rounded-xl border border-border/30 relative overflow-hidden">
            {/* Decorative animated bars */}
            <div className="absolute inset-0 flex items-end justify-around px-4 md:px-8 py-4 md:py-6 gap-1 md:gap-2">
              {[40, 70, 45, 85, 60, 75, 50].map((height, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-gradient-to-t from-primary/30 to-primary/10 rounded-t-lg animate-pulse"
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${i * 200}ms`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
            
            <div className="text-center px-3 md:px-4 relative z-10 bg-background/90 backdrop-blur-sm rounded-xl p-4 md:p-6 mx-3">
              <Activity className="h-10 w-10 md:h-14 md:w-14 text-primary mx-auto mb-2 md:mb-3 animate-pulse" />
              <p className="text-sm md:text-base font-semibold text-foreground mb-1">
                Graphiques de performance
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Bientôt disponibles
              </p>
              <p className="text-[11px] md:text-xs text-muted-foreground/80 mt-1.5 md:mt-2 max-w-[280px] mx-auto break-words leading-relaxed">
                Suivez vos ventes, vues et statistiques en temps réel
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ShopOverviewTab.displayName = 'ShopOverviewTab';
