import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Store, TrendingUp, Package, ShoppingBag } from 'lucide-react';
import type { ShopPerformance } from '@/hooks/useBusinessDashboard';

interface BusinessTopShopsProps {
  shops: ShopPerformance[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA';
};

export const BusinessTopShops = ({ shops }: BusinessTopShopsProps) => {
  if (!shops || shops.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-2 border-b bg-muted/20">
          <CardTitle className="text-base font-semibold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500">
              <Store className="w-4 h-4 text-white" />
            </div>
            Top Boutiques
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            Aucune boutique active
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-2 border-b bg-muted/20">
          <CardTitle className="text-base font-semibold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500">
              <Store className="w-4 h-4 text-white" />
            </div>
            Top Boutiques (par CA)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {shops.map((shop, index) => (
              <motion.div
                key={shop.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-amber-700' :
                  'bg-muted-foreground/30'
                }`}>
                  {index + 1}
                </div>

                {/* Shop Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={shop.logo_url || ''} alt={shop.shop_name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {shop.shop_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Shop Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{shop.shop_name}</p>
                    {shop.subscription_active && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {shop.total_products} produits
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      {shop.total_orders} ventes
                    </span>
                  </div>
                </div>

                {/* Revenue */}
                <div className="text-right">
                  <p className="font-bold text-sm text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {formatCurrency(shop.total_revenue)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
