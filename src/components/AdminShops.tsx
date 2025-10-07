import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Store, ExternalLink, Search, Check, X, Edit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Shop {
  id: string;
  seller_id: string;
  shop_name: string;
  shop_slug: string;
  shop_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  subscription_active: boolean;
  subscription_expires_at: string | null;
  monthly_fee: number;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

export const AdminShops = () => {
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  const [actionType, setActionType] = useState<'activate' | 'deactivate'>('activate');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const { data: shopsData, error } = await supabase
        .from('seller_shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (shopsData && shopsData.length > 0) {
        const sellerIds = shopsData.map(shop => shop.seller_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', sellerIds);

        const shopsWithProfiles = shopsData.map(shop => {
          const profile = profilesData?.find(p => p.user_id === shop.seller_id);
          return {
            ...shop,
            profiles: profile ? { full_name: profile.full_name, email: profile.email } : undefined
          };
        });
        setShops(shopsWithProfiles as Shop[]);
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les boutiques.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedShop) return;

    try {
      const { error } = await supabase
        .from('seller_shops')
        .update({ is_active: actionType === 'activate' })
        .eq('id', selectedShop.id);

      if (error) throw error;

      toast({
        title: 'Boutique mise à jour',
        description: `La boutique a été ${actionType === 'activate' ? 'activée' : 'désactivée'}.`,
      });

      await fetchShops();
      setShowToggleDialog(false);
      setSelectedShop(null);
    } catch (error) {
      console.error('Error toggling shop:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la boutique.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleSubscription = async (shop: Shop) => {
    try {
      const { error } = await supabase
        .from('seller_shops')
        .update({
          subscription_active: !shop.subscription_active,
          subscription_expires_at: !shop.subscription_active
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : null,
        })
        .eq('id', shop.id);

      if (error) throw error;

      toast({
        title: 'Abonnement mis à jour',
        description: `L'abonnement a été ${!shop.subscription_active ? 'activé' : 'désactivé'}.`,
      });

      await fetchShops();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier l\'abonnement.',
        variant: 'destructive',
      });
    }
  };

  const filteredShops = shops.filter(
    (shop) =>
      shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.shop_slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shop.profiles as any)?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Gestion des Boutiques</h3>
          </div>
          <Badge variant="secondary">{shops.length} boutique(s)</Badge>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, slug ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Boutique</TableHead>
                <TableHead>Vendeur</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Abonnement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune boutique trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredShops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {shop.logo_url ? (
                          <img
                            src={shop.logo_url}
                            alt={shop.shop_name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Store className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{shop.shop_name}</div>
                          <div className="text-xs text-muted-foreground">{shop.shop_slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{(shop.profiles as any)?.full_name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">
                          {(shop.profiles as any)?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/boutique/${shop.shop_slug}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={shop.subscription_active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleSubscription(shop)}
                      >
                        {shop.subscription_active ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Actif
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Inactif
                          </>
                        )}
                      </Button>
                      {shop.subscription_active && shop.subscription_expires_at && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Expire: {new Date(shop.subscription_expires_at).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {shop.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(shop.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedShop(shop);
                          setActionType(shop.is_active ? 'deactivate' : 'activate');
                          setShowToggleDialog(true);
                        }}
                      >
                        {shop.is_active ? 'Désactiver' : 'Activer'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'activate' ? 'Activer' : 'Désactiver'} la boutique
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir {actionType === 'activate' ? 'activer' : 'désactiver'} la
              boutique "{selectedShop?.shop_name}" ?
              {actionType === 'deactivate' && (
                <p className="mt-2 text-destructive">
                  La boutique ne sera plus visible publiquement.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
