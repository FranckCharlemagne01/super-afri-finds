import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Store, Share2 } from 'lucide-react';
import { ShopManagement } from '@/components/ShopManagement';
import { LocationSelector } from '@/components/LocationSelector';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  return (
    <div className="space-y-6">
      {/* Location Selector */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Localisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LocationSelector />
        </CardContent>
      </Card>

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
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <h4 className="font-semibold mb-2">Accès à votre boutique</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="default"
                  className="flex-1 transition-all hover:scale-105"
                  onClick={() => window.open(`/shop/${shop?.shop_slug}`, '_blank')}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Voir ma boutique
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 transition-all hover:scale-105"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/shop/${shop?.shop_slug}`);
                    toast({
                      title: "Copié !",
                      description: "Le lien de votre boutique a été copié dans le presse-papier.",
                    });
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager ma boutique
                </Button>
              </div>
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
