import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useStableAuth } from "@/hooks/useStableAuth";
import { toast } from "@/hooks/use-toast";
import { DriverProfileData } from "@/pages/DriverDashboard";
import { Loader2 } from "lucide-react";

interface Props {
  profile: DriverProfileData | null;
  onRefresh: () => void;
}

export const DriverProfile = ({ profile, onRefresh }: Props) => {
  const { user } = useStableAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [city, setCity] = useState(profile?.city || 'Abidjan');
  const [vehicleType, setVehicleType] = useState(profile?.vehicle_type || 'moto');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !fullName.trim() || !phone.trim()) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          city: city.trim(),
          vehicle_type: vehicleType,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast({ title: "Profil mis à jour ✅" });
      onRefresh();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Mon profil</h2>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Type de véhicule</Label>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="moto">Moto</SelectItem>
                <SelectItem value="voiture">Voiture</SelectItem>
                <SelectItem value="velo">Vélo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
