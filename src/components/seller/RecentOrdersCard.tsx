import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowRight, Package } from 'lucide-react';

interface RecentOrdersCardProps {
  orders?: any[];
  onViewAll?: () => void;
}

export const RecentOrdersCard = ({ orders = [], onViewAll }: RecentOrdersCardProps) => {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Commandes récentes
        </CardTitle>
        {orders.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Aucune commande pour le moment</p>
            <p className="text-xs text-muted-foreground mt-1">Vos commandes apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium">Commande #{index + 1}</p>
                  <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold">1 500 FCFA</p>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                    En cours
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
