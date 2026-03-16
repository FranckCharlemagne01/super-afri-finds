import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DriverProfileData, DriverTab } from "@/pages/DriverDashboard";
import { AlertTriangle, CheckCircle2, Package, Star, Wallet, Truck } from "lucide-react";

interface Props {
  profile: DriverProfileData | null;
  onNavigate: (tab: DriverTab) => void;
}

export const DriverOverview = ({ profile, onNavigate }: Props) => {
  const isPending = !profile || profile.driver_status === 'pending';
  const isRejected = profile?.driver_status === 'rejected';
  const isVerified = profile?.driver_status === 'verified';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bienvenue, {profile?.full_name || 'Livreur'} 👋
        </p>
      </div>

      {/* Status info */}
      {isPending && (
        <Card className="border-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Compte en attente</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Votre compte livreur est en cours de validation. Vous serez notifié dès que votre profil sera activé.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">Vérification rejetée</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Votre demande de vérification a été rejetée. Veuillez soumettre de nouveaux documents.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isVerified && (
        <Card className="border-green-500/30 bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <span className="text-sm font-medium text-foreground">Compte vérifié — Vous pouvez recevoir des missions !</span>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{profile?.total_deliveries || 0}</p>
            <p className="text-xs text-muted-foreground">Livraisons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{(profile?.total_earnings || 0).toLocaleString()} F</p>
            <p className="text-xs text-muted-foreground">Gains totaux</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{profile?.average_rating?.toFixed(1) || '0.0'}</p>
            <p className="text-xs text-muted-foreground">Note moyenne</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('missions')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Voir les missions</p>
              <p className="text-xs text-muted-foreground">Missions disponibles près de vous</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('earnings')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Mes gains</p>
              <p className="text-xs text-muted-foreground">Consultez vos revenus</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
