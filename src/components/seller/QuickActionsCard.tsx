import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Store, Settings, Coins, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsCardProps {
  shopSlug?: string;
  currentCity?: string;
  onPublishProduct?: () => void;
  onChangeCity?: () => void;
  onSettings?: () => void;
}

export const QuickActionsCard = ({ 
  shopSlug, 
  currentCity,
  onPublishProduct,
  onChangeCity,
  onSettings
}: QuickActionsCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={onPublishProduct}
          className="w-full justify-start gap-2 h-11 bg-gradient-to-r from-primary to-primary-hover hover:opacity-90"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Publier un produit
        </Button>
        
        {shopSlug && (
          <Button 
            onClick={() => navigate(`/boutique/${shopSlug}`)}
            variant="outline"
            className="w-full justify-start gap-2 h-11"
            size="lg"
          >
            <Store className="h-5 w-5" />
            Voir ma boutique
          </Button>
        )}

        {currentCity && (
          <div className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Ville actuelle</p>
                <p className="text-sm font-medium">{currentCity}</p>
              </div>
            </div>
            {onChangeCity && (
              <Button variant="ghost" size="sm" onClick={onChangeCity}>
                Changer
              </Button>
            )}
          </div>
        )}

        <Button 
          onClick={onSettings}
          variant="outline"
          className="w-full justify-start gap-2 h-11"
          size="lg"
        >
          <Settings className="h-5 w-5" />
          Paramètres
        </Button>
      </CardContent>
    </Card>
  );
};
