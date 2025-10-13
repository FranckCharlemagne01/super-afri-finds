import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';

export const PerformanceChart = () => {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Performance des ventes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-dashed border-muted-foreground/20">
          <div className="text-center px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Graphique de performance
            </p>
            <p className="text-xs text-muted-foreground">
              Visualisez vos ventes sur 7 ou 30 jours (bientôt disponible)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
