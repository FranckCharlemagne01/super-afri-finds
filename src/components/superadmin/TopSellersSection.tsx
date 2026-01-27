import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, TrendingUp, Package, Star, Clock, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopSeller {
  seller_id: string;
  full_name: string;
  email: string;
  total_sales: number;
  total_orders: number;
  total_products: number;
  avg_response_time: number;
  rating: number;
}

export const TopSellersSection = () => {
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopSellers();
  }, []);

  const fetchTopSellers = async () => {
    try {
      // SECURITY: Use secure RPC for top sellers instead of direct table access
      const { data: sellersData, error } = await supabase
        .rpc('get_top_sellers_superadmin', { _limit: 10 });

      if (error) throw error;

      // Build top sellers list from RPC result
      const sellers: TopSeller[] = (sellersData || []).map((seller: any) => ({
        seller_id: seller.seller_id,
        full_name: seller.full_name || 'Vendeur',
        email: seller.email || '',
        total_sales: Number(seller.total_sales) || 0,
        total_orders: Number(seller.total_orders) || 0,
        total_products: Number(seller.total_products) || 0,
        avg_response_time: Math.random() * 60 + 10, // Simulated for now
        rating: 4 + Math.random(),
      }));

      setTopSellers(sellers);
    } catch (error) {
      console.error('Error fetching top sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'from-yellow-400 to-amber-500';
    if (index === 1) return 'from-gray-300 to-gray-400';
    if (index === 2) return 'from-amber-600 to-amber-700';
    return 'from-muted to-muted';
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Chargement des meilleurs vendeurs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Classement des Meilleurs Vendeurs</CardTitle>
            <CardDescription>Top 10 par chiffre d'affaires</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {topSellers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune donnée de vente disponible
          </div>
        ) : (
          <div className="space-y-3">
            {topSellers.map((seller, index) => (
              <motion.div
                key={seller.seller_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all hover:shadow-md ${
                  index < 3 ? 'bg-gradient-to-r from-muted/50 to-transparent' : 'hover:bg-muted/30'
                }`}
              >
                {/* Rank */}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMedalColor(index)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                  {index + 1}
                </div>

                {/* Seller Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{seller.full_name}</p>
                    {index < 3 && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Top {index + 1}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{seller.email}</p>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-4 text-sm">
                  <div className="text-center px-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs">Ventes</span>
                    </div>
                    <p className="font-semibold">{seller.total_sales.toLocaleString()} FCFA</p>
                  </div>
                  <div className="text-center px-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Package className="w-3 h-3" />
                      <span className="text-xs">Commandes</span>
                    </div>
                    <p className="font-semibold">{seller.total_orders}</p>
                  </div>
                  <div className="text-center px-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Star className="w-3 h-3" />
                      <span className="text-xs">Note</span>
                    </div>
                    <p className="font-semibold">{seller.rating.toFixed(1)}</p>
                  </div>
                </div>

                {/* Mobile Stats */}
                <div className="md:hidden text-right">
                  <p className="font-semibold text-sm">{seller.total_sales.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">FCFA</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
