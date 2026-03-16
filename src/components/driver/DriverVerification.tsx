import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useStableAuth } from "@/hooks/useStableAuth";
import { toast } from "@/hooks/use-toast";
import { DriverProfileData } from "@/pages/DriverDashboard";
import { Upload, CheckCircle2, Loader2, AlertTriangle, Camera, Car, User } from "lucide-react";

interface Props {
  profile: DriverProfileData | null;
  onRefresh: () => void;
}

export const DriverVerification = ({ profile, onRefresh }: Props) => {
  const { user } = useStableAuth();
  const [idFile, setIdFile] = useState<File | null>(null);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isVerified = profile?.driver_status === 'verified';
  const isPending = profile?.driver_status === 'pending';

  const hasDocuments = profile?.id_document_url && profile?.vehicle_photo_url && profile?.selfie_url;

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${folder}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('driver-documents').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data: urlData } = supabase.storage.from('driver-documents').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user || !idFile || !vehicleFile || !selfieFile) {
      toast({ title: "Erreur", description: "Veuillez fournir tous les documents requis.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const [idUrl, vehicleUrl, selfieUrl] = await Promise.all([
        uploadFile(idFile, 'id_document'),
        uploadFile(vehicleFile, 'vehicle_photo'),
        uploadFile(selfieFile, 'selfie'),
      ]);

      if (!idUrl || !vehicleUrl || !selfieUrl) {
        throw new Error('Upload failed');
      }

      const { error } = await supabase
        .from('driver_profiles')
        .update({
          id_document_url: idUrl,
          vehicle_photo_url: vehicleUrl,
          selfie_url: selfieUrl,
          driver_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: "Documents envoyés ✅", description: "Votre demande de vérification est en cours de traitement." });
      onRefresh();
    } catch (err) {
      console.error('Error:', err);
      toast({ title: "Erreur", description: "Impossible d'envoyer les documents.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isVerified) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Vérification du compte</h2>
        <Card className="border-green-500/30 bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Compte vérifié</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Votre identité a été vérifiée. Vous pouvez recevoir et accepter des missions de livraison.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPending && hasDocuments) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Vérification du compte</h2>
        <Card className="border-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Vérification en cours</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Vos documents ont été soumis et sont en cours de vérification par notre équipe. Vous serez notifié dès que votre compte sera validé.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Vérification du compte</h2>
      <p className="text-sm text-muted-foreground">
        Envoyez les documents ci-dessous pour activer votre compte livreur.
      </p>

      <Card>
        <CardContent className="p-5 space-y-5">
          {/* ID Document */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" /> Pièce d'identité
            </Label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="id-upload"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="id-upload" className="cursor-pointer">
                {idFile ? (
                  <p className="text-sm text-primary font-medium">✅ {idFile.name}</p>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Cliquez pour télécharger</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Vehicle Photo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Car className="w-4 h-4" /> Photo du véhicule
            </Label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="vehicle-upload"
                onChange={(e) => setVehicleFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="vehicle-upload" className="cursor-pointer">
                {vehicleFile ? (
                  <p className="text-sm text-primary font-medium">✅ {vehicleFile.name}</p>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Cliquez pour télécharger</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Selfie */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="w-4 h-4" /> Photo selfie
            </Label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="selfie-upload"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="selfie-upload" className="cursor-pointer">
                {selfieFile ? (
                  <p className="text-sm text-primary font-medium">✅ {selfieFile.name}</p>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Cliquez pour télécharger</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || !idFile || !vehicleFile || !selfieFile}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Envoi en cours...</>
            ) : (
              'Envoyer pour vérification'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
