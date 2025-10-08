import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Store } from 'lucide-react';
import { ShopManagement } from '@/components/ShopManagement';

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
}

interface ShopSettingsTabProps {
  shop: Shop | null;
  onRefresh: () => void;
}

export const ShopSettingsTab = ({ shop, onRefresh }: ShopSettingsTabProps) => {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de la Boutique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ShopManagement />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Informations Supplémentaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">URL de votre boutique</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Votre boutique est accessible publiquement via l'URL suivante :
              </p>
              <code className="block p-2 bg-card rounded border text-sm">
                {window.location.origin}/shop/{shop?.shop_slug || 'votre-boutique'}
              </code>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="font-semibold text-blue-600 mb-2">💡 Conseil</h4>
              <p className="text-sm text-muted-foreground">
                Personnalisez votre boutique avec un logo et une bannière pour attirer plus de clients. 
                Une boutique bien présentée inspire confiance et augmente vos ventes !
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
