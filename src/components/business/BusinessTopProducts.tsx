import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Package, TrendingUp, ShoppingCart } from 'lucide-react';
import type { TopProduct } from '@/hooks/useBusinessDashboard';

interface BusinessTopProductsProps {
  products: TopProduct[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA';
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'electronics': 'bg-blue-100 text-blue-700',
    'fashion': 'bg-pink-100 text-pink-700',
    'beauty': 'bg-purple-100 text-purple-700',
    'home': 'bg-amber-100 text-amber-700',
    'phones': 'bg-indigo-100 text-indigo-700',
    'auto': 'bg-gray-100 text-gray-700',
    'grocery': 'bg-green-100 text-green-700',
  };
  return colors[category.toLowerCase()] || 'bg-muted text-muted-foreground';
};

export const BusinessTopProducts = ({ products }: BusinessTopProductsProps) => {
  if (!products || products.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-2 border-b bg-muted/20">
          <CardTitle className="text-base font-semibold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500">
              <Package className="w-4 h-4 text-white" />
            </div>
            Produits les Plus Vendus
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            Aucun produit vendu
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-2 border-b bg-muted/20">
          <CardTitle className="text-base font-semibold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500">
              <Package className="w-4 h-4 text-white" />
            </div>
            Produits les Plus Vendus
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
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

                {/* Product Image */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className={`text-xs ${getCategoryColor(product.category)}`}>
                      {product.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                </div>

                {/* Sales Stats */}
                <div className="text-right space-y-1">
                  <p className="font-bold text-sm text-green-600 flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {formatCurrency(product.total_revenue)}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    {product.total_sales} ventes
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
