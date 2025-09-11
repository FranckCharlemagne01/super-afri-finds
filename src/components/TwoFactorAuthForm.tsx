import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, ShieldCheck, Mail, Smartphone, Key, Copy, CheckCircle } from 'lucide-react';

export const TwoFactorAuthForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'app'>('email');

  useEffect(() => {
    check2FAStatus();
  }, [user]);

  const check2FAStatus = async () => {
    if (!user) return;

    try {
      // Check if user has 2FA enabled (this would be in a custom table)
      const { data, error } = await supabase
        .from('user_security_settings')
        .select('two_factor_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setIs2FAEnabled(data.two_factor_enabled);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const enable2FA = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // In a real implementation, you would:
      // 1. Generate TOTP secret
      // 2. Send setup email/show QR code
      // 3. Verify user can generate correct codes
      
      // For demo purposes, we'll simulate this
      const demoBackupCodes = [
        'BACKUP-001-234',
        'BACKUP-002-567',
        'BACKUP-003-890',
        'BACKUP-004-123',
        'BACKUP-005-456'
      ];

      // Save 2FA settings
      await supabase
        .from('user_security_settings')
        .upsert({
          user_id: user.id,
          two_factor_enabled: true,
          backup_codes: demoBackupCodes,
          created_at: new Date().toISOString()
        });

      setIs2FAEnabled(true);
      setBackupCodes(demoBackupCodes);
      setShowBackupCodes(true);

      toast({
        title: "2FA activé",
        description: "L'authentification à deux facteurs a été activée avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'activer la 2FA.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await supabase
        .from('user_security_settings')
        .update({
          two_factor_enabled: false,
          backup_codes: null
        })
        .eq('user_id', user.id);

      setIs2FAEnabled(false);
      setBackupCodes([]);
      setShowBackupCodes(false);

      toast({
        title: "2FA désactivé",
        description: "L'authentification à deux facteurs a été désactivée.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de désactiver la 2FA.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // This would call an edge function to send verification email
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      toast({
        title: "Code envoyé",
        description: `Code de vérification envoyé à ${user.email}. Code: ${verificationCode}`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le code de vérification.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Code copié dans le presse-papiers.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {is2FAEnabled ? (
                <ShieldCheck className="w-8 h-8 text-green-600" />
              ) : (
                <Shield className="w-8 h-8 text-yellow-600" />
              )}
              <div>
                <h3 className="font-semibold">
                  Authentification à deux facteurs (2FA)
                </h3>
                <p className="text-sm text-muted-foreground">
                  {is2FAEnabled 
                    ? "Votre compte est protégé par la 2FA" 
                    : "Renforcez la sécurité de votre compte"
                  }
                </p>
              </div>
            </div>
            <Badge variant={is2FAEnabled ? "default" : "secondary"}>
              {is2FAEnabled ? "Activé" : "Désactivé"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {!is2FAEnabled ? (
        /* Enable 2FA */
        <Card>
          <CardHeader>
            <CardTitle>Activer la 2FA</CardTitle>
            <CardDescription>
              Choisissez votre méthode d'authentification préférée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  verificationMethod === 'email' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setVerificationMethod('email')}
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">
                      Codes envoyés par email
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  verificationMethod === 'app' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setVerificationMethod('app')}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-6 h-6" />
                  <div>
                    <div className="font-medium">Application</div>
                    <div className="text-sm text-muted-foreground">
                      Google Authenticator, etc.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={enable2FA} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Shield className="mr-2 h-4 w-4" />
              Activer la 2FA
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Manage 2FA */
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion de la 2FA</CardTitle>
              <CardDescription>
                Gérez vos paramètres d'authentification à deux facteurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={sendVerificationEmail} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Mail className="mr-2 h-4 w-4" />
                Envoyer un code de test
              </Button>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Code de vérification</Label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Entrez le code reçu"
                  maxLength={6}
                />
              </div>

              <Button 
                onClick={disable2FA} 
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Désactiver la 2FA
              </Button>
            </CardContent>
          </Card>

          {/* Backup Codes */}
          {showBackupCodes && backupCodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Codes de récupération
                </CardTitle>
                <CardDescription>
                  Conservez ces codes en lieu sûr. Ils vous permettront d'accéder à votre compte si vous perdez accès à votre méthode 2FA.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded font-mono text-sm"
                    >
                      <span>{code}</span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Important</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Chaque code ne peut être utilisé qu'une seule fois. Téléchargez ou imprimez ces codes et conservez-les en sécurité.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};