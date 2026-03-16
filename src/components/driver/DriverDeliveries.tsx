import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useStableAuth } from "@/hooks/useStableAuth";
import { toast } from "@/hooks/use-toast";
import { DriverProfileData } from "@/pages/DriverDashboard";
import { MapPin, Package, Loader2 } from "lucide-react";

interface Delivery {
  id: string;
  pickup_address: string;
  delivery_address: string;
  package_type: string;
  fee: number;
  status: string;
  created_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  accepted: { label: 'Acceptée', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  picked_up: { label: 'Colis récupéré', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  in_transit: { label: 'En livraison', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  delivered: { label: 'Livré', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  cancelled: { label: 'Annulé', color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

interface Props {
  profile: DriverProfileData | null;
}

export const DriverDeliveries = ({ profile }: Props) => {
  const { user } = useStableAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDeliveries();
  }, [user]);

  const fetchDeliveries = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('delivery_missions')
        .select('*')
        .eq('driver_id', user.id)
        .neq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries((data || []) as Delivery[]);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === 'picked_up') updateData.picked_up_at = new Date().toISOString();
      if (newStatus === 'delivered') updateData.delivered_at = new Date().toISOString();

      const { error } = await supabase
        .from('delivery_missions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Statut mis à jour ✅" });
      fetchDeliveries();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'accepted': return { label: 'Colis récupéré', next: 'picked_up' };
      case 'picked_up': return { label: 'En livraison', next: 'in_transit' };
      case 'in_transit': return { label: 'Livré', next: 'delivered' };
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Mes livraisons</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : deliveries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune livraison pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {deliveries.map((d) => {
            const st = statusLabels[d.status] || { label: d.status, color: '' };
            const action = getNextAction(d.status);
            return (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-sm">{d.pickup_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-destructive shrink-0" />
                        <span className="text-sm">{d.delivery_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={st.color}>{st.label}</Badge>
                        <span className="text-sm font-semibold text-foreground">{d.fee.toLocaleString()} F</span>
                      </div>
                    </div>
                    {action && (
                      <Button size="sm" onClick={() => updateStatus(d.id, action.next)}>
                        {action.label}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
