import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStableAuth } from "@/hooks/useStableAuth";
import { useNavigate } from "react-router-dom";
import { LogOut, Bell, Shield } from "lucide-react";

export const DriverSettings = () => {
  const { signOut } = useStableAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Paramètres</h2>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Notifications</p>
                <p className="text-xs text-muted-foreground">Gérer vos préférences de notification</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Sécurité</p>
                <p className="text-xs text-muted-foreground">Modifier votre mot de passe</p>
              </div>
            </div>
          </div>

          <Button variant="destructive" className="w-full mt-4" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
