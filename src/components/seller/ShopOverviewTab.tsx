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
}

export const ShopOverviewTab = ({
  shop,
  products,
  tokenBalance,
  trialStatus,
  onRefresh
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
      onClick: () => {
        // Switch to products tab
        const productsTab = document.querySelector('[value="products"]') as HTMLElement;
        if (productsTab) productsTab.click();
      },
      variant: 'default' as const,
    },
    {
      label: 'Voir ma boutique',
      icon: ShoppingBag,
      onClick: () => shop && navigate(`/shop/${shop.shop_slug}`),
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-2">
            Bienvenue dans votre boutique, {shop?.shop_name} ! 👋
          </h2>
          <p className="text-muted-foreground mb-4">
            Gérez vos produits, suivez vos performances et développez votre activité.
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                onClick={action.onClick}
                variant={action.variant}
                size="lg"
                className="gap-2"
              >
                <action.icon className="h-5 w-5" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} style={{
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance de votre boutique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
            <div className="text-center">
              <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Graphiques de performance bientôt disponibles
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Suivez vos ventes et statistiques détaillées
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
