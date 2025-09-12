import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileUpdateForm } from '@/components/ProfileUpdateForm';
import { PasswordUpdateForm } from '@/components/PasswordUpdateForm';
import { TwoFactorAuthForm } from '@/components/TwoFactorAuthForm';
import { PaystackSettingsDialog } from '@/components/PaystackSettingsDialog';
import { User, Lock, Shield, Bell, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuperAdminSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SuperAdminSettingsDialog = ({ open, onOpenChange }: SuperAdminSettingsDialogProps) => {
  const [showPaystackSettings, setShowPaystackSettings] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Paramètres SuperAdmin
          </DialogTitle>
          <DialogDescription>
            Gérez vos paramètres de compte et de sécurité
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="2fa" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              2FA
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="paystack" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Paystack
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Modifiez vos informations de profil SuperAdmin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileUpdateForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sécurité du compte</CardTitle>
                <CardDescription>
                  Modifiez votre mot de passe et renforcez la sécurité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordUpdateForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="2fa" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Authentification à deux facteurs</CardTitle>
                <CardDescription>
                  Sécurisez votre compte avec la double authentification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TwoFactorAuthForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Préférences de notification</CardTitle>
                <CardDescription>
                  Configurez vos alertes et notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">Nouvelles commandes</div>
                      <div className="text-sm text-muted-foreground">
                        Recevoir une notification pour chaque nouvelle commande
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">Nouveaux utilisateurs</div>
                      <div className="text-sm text-muted-foreground">
                        Recevoir une notification pour chaque nouvel utilisateur
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">Problèmes de sécurité</div>
                      <div className="text-sm text-muted-foreground">
                        Recevoir des alertes importantes de sécurité
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">Rapports hebdomadaires</div>
                      <div className="text-sm text-muted-foreground">
                        Recevoir un résumé hebdomadaire de l'activité
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paystack" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Paystack</CardTitle>
                <CardDescription>
                  Configurez votre clé secrète Paystack pour activer les paiements Premium des vendeurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Votre clé secrète Paystack sera stockée de manière sécurisée et utilisée pour traiter les paiements Premium.
                  </p>
                  <Button 
                    onClick={() => setShowPaystackSettings(true)}
                    className="w-full"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Configurer Paystack
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <PaystackSettingsDialog 
        open={showPaystackSettings}
        onOpenChange={setShowPaystackSettings}
      />
    </Dialog>
  );
};