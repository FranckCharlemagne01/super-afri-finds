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
    <div className="space-y-4 md:space-y-6 animate-in fade-in-0 duration-500">
      {/* Location Selector */}
      <Card className="border-0 shadow-lg overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <span className="break-words">Localisation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <LocationSelector />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <span className="break-words">Paramètres de la Boutique</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <ShopManagement />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <span className="break-words">Informations Supplémentaires</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 space-y-3 transition-all">
              <h4 className="font-semibold mb-2 break-words">Accès à votre boutique</h4>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Button
                  variant="default"
                  className="flex-1 transition-all hover:scale-105 active:scale-95 touch-manipulation gap-2"
                  onClick={() => window.open(`/boutique/${shop?.shop_slug}`, '_blank')}
                >
                  <Store className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Voir ma boutique</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 transition-all hover:scale-105 active:scale-95 touch-manipulation gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/boutique/${shop?.shop_slug}`);
                    toast({
                      title: "Copié !",
                      description: "Le lien de votre boutique a été copié dans le presse-papier.",
                    });
                  }}
                >
                  <Share2 className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Partager ma boutique</span>
                </Button>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl animate-in slide-in-from-bottom-2 duration-700">
              <h4 className="font-semibold text-blue-600 mb-2 break-words">💡 Conseil</h4>
              <p className="text-sm text-muted-foreground break-words">
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
