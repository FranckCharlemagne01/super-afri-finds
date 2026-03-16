import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useStableAuth } from "@/hooks/useStableAuth";
import { toast } from "@/hooks/use-toast";
import { DriverProfileData } from "@/pages/DriverDashboard";
import { MapPin, Package, CircleDollarSign, AlertTriangle, Loader2 } from "lucide-react";

interface Mission {
  id: string;
  pickup_address: string;
  delivery_address: string;
  package_type: string;
  fee: number;
  distance_km: number | null;
  status: string;
  customer_name: string | null;
  created_at: string;
}

interface Props {
  profile: DriverProfileData | null;
}

export const DriverMissions = ({ profile }: Props) => {
  const { user } = useStableAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const isVerified = profile?.driver_status === 'verified';

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_missions')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMissions((data || []) as Mission[]);
    } catch (err) {
      console.error('Error fetching missions:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptMission = async (missionId: string) => {
    if (!user || !isVerified) return;
    setAccepting(missionId);
    try {
      const { error } = await supabase
        .from('delivery_missions')
        .update({ driver_id: user.id, status: 'accepted' })
        .eq('id', missionId)
        .eq('status', 'available');

      if (error) throw error;
      toast({ title: "Mission acceptée ✅", description: "Vous avez accepté cette mission de livraison." });
      fetchMissions();
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible d'accepter cette mission.", variant: "destructive" });
    } finally {
      setAccepting(null);
    }
  };

  if (!isVerified) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Missions disponibles</h2>
        <Card className="border-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">Vérification requise</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Les missions de livraison sont disponibles uniquement après la vérification de votre compte.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Missions disponibles</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : missions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune mission disponible pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {missions.map((mission) => (
            <Card key={mission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{mission.pickup_address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{mission.delivery_address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="secondary">{mission.package_type}</Badge>
                      {mission.distance_km && <span>{mission.distance_km} km</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-foreground">{mission.fee.toLocaleString()} F</p>
                      <p className="text-xs text-muted-foreground">Gain</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptMission(mission.id)}
                        disabled={accepting === mission.id}
                      >
                        {accepting === mission.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accepter'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
