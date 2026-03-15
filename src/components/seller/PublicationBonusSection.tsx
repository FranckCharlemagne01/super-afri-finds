import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Gift, Clock, Package, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';
import { toast } from 'sonner';

interface PublicationBonus {
  id: string;
  bonus_type: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string;
  max_products: number;
  products_used: number;
  reason: string | null;
}

export const PublicationBonusSection = () => {
  const { user } = useStableAuth();
  const [bonuses, setBonuses] = useState<PublicationBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchBonuses = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('publication_bonuses')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBonuses(data as PublicationBonus[]);
      }
    } catch (err) {
      console.error('Error fetching bonuses:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBonuses();
  }, [fetchBonuses]);

  const handleToggle = async (bonusId: string, active: boolean) => {
    setToggling(bonusId);
    try {
      const { data, error } = await supabase.rpc('toggle_publication_bonus', {
        p_bonus_id: bonusId,
        p_active: active,
      });

      if (error) throw error;
      const result = (typeof data === 'string' ? JSON.parse(data) : data) as any;
      if (result?.success) {
        toast.success(active ? 'Bonus activé !' : 'Bonus désactivé');
        await fetchBonuses();
      } else {
        toast.error(result?.error || 'Erreur');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setToggling(null);
    }
  };

  const now = new Date();

  const activeBonuses = bonuses.filter(
    b => new Date(b.expires_at) > now && b.products_used < b.max_products
  );
  const expiredBonuses = bonuses.filter(
    b => new Date(b.expires_at) <= now || b.products_used >= b.max_products
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Gift className="h-5 w-5 text-green-600" />
          </div>
          <span>Bonus publication</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {activeBonuses.length === 0 && expiredBonuses.length === 0 && (
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Aucun bonus de publication disponible pour le moment.
            </p>
          </div>
        )}

        {activeBonuses.map((bonus) => {
          const remaining = bonus.max_products - bonus.products_used;
          const progress = (bonus.products_used / bonus.max_products) * 100;
          const isToggling = toggling === bonus.id;

          return (
            <div
              key={bonus.id}
              className="p-4 rounded-xl border border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5 space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white">
                    {bonus.bonus_type === 'trial' ? '🎁 Essai' : '⭐ Admin'}
                  </Badge>
                  <Badge variant={bonus.is_active ? 'default' : 'secondary'}>
                    {bonus.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isToggling && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Switch
                    checked={bonus.is_active}
                    onCheckedChange={(checked) => handleToggle(bonus.id, checked)}
                    disabled={isToggling}
                  />
                </div>
              </div>

              {bonus.is_active && (
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  ✅ Bonus actif – {remaining} produit{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''} – expire le{' '}
                  {new Date(bonus.expires_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Début</p>
                    <p className="font-medium text-xs">{formatDate(bonus.starts_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Expiration</p>
                    <p className="font-medium text-xs">{formatDate(bonus.expires_at)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" /> Publications
                  </span>
                  <span className="font-semibold">{bonus.products_used} / {bonus.max_products}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {bonus.reason && (
                <p className="text-xs text-muted-foreground italic">📝 {bonus.reason}</p>
              )}
            </div>
          );
        })}

        {expiredBonuses.length > 0 && (
          <details className="text-sm">
            <summary className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Bonus expirés ({expiredBonuses.length})
            </summary>
            <div className="mt-2 space-y-2">
              {expiredBonuses.map((bonus) => (
                <div
                  key={bonus.id}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {bonus.bonus_type === 'trial' ? 'Essai' : 'Admin'} – expiré
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {bonus.products_used}/{bonus.max_products} utilisés
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};
