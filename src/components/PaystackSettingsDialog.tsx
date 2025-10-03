import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Save, Shield, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaystackSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaystackSettingsDialog({ open, onOpenChange }: PaystackSettingsDialogProps) {
  const [testSecretKey, setTestSecretKey] = useState('');
  const [liveSecretKey, setLiveSecretKey] = useState('');
  const [testPublicKey, setTestPublicKey] = useState('');
  const [livePublicKey, setLivePublicKey] = useState('');
  const [mode, setMode] = useState<'test' | 'live'>('test');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [hasTestKeys, setHasTestKeys] = useState(false);
  const [hasLiveKeys, setHasLiveKeys] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<{secretKey: string; publicKey: string; mode: string} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('paystack-config', {
        body: { action: 'get' }
      });

      if (error) throw error;

      if (data.success) {
        setMode(data.mode);
        setHasTestKeys(data.has_test_keys);
        setHasLiveKeys(data.has_live_keys);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleTestKey = async (keyType: 'test' | 'live') => {
    const secretKey = keyType === 'test' ? testSecretKey : liveSecretKey;
    
    if (!secretKey.trim()) {
      toast({
        title: "Erreur",
        description: `Veuillez entrer une clé secrète ${keyType === 'test' ? 'Test' : 'Live'}`,
        variant: "destructive",
      });
      return;
    }

    // Validate secret key format
    const expectedPrefix = keyType === 'test' ? 'sk_test_' : 'sk_live_';
    if (!secretKey.startsWith(expectedPrefix)) {
      toast({
        title: "Erreur",
        description: `La clé secrète ${keyType === 'test' ? 'Test' : 'Live'} doit commencer par '${expectedPrefix}'`,
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      // Test the key by calling Paystack API
      const response = await fetch('https://api.paystack.co/transaction', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        toast({
          title: "❌ Clé invalide",
          description: "Votre clé secrète Paystack n'est pas valide. Merci d'entrer une clé valide.",
          variant: "destructive",
        });
      } else if (response.status === 200) {
        toast({
          title: "✅ Connexion réussie",
          description: `Les clés ${keyType === 'test' ? 'Test' : 'Live'} Paystack sont valides et fonctionnent correctement.`,
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de valider la clé. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing key:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion lors du test de la clé.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteKeys = async (keyType: 'test' | 'live') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-config', {
        body: {
          action: 'save',
          secret_key_test: keyType === 'test' ? null : undefined,
          public_key_test: keyType === 'test' ? null : undefined,
          secret_key_live: keyType === 'live' ? null : undefined,
          public_key_live: keyType === 'live' ? null : undefined,
          mode: mode,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Clés supprimées",
          description: `Les clés ${keyType === 'test' ? 'Test' : 'Live'} ont été supprimées avec succès`,
        });
        await loadConfig();
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error deleting keys:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer les clés",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate at least one pair is provided
    if ((!testSecretKey.trim() && !testPublicKey.trim()) && (!liveSecretKey.trim() && !livePublicKey.trim())) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer au moins une paire de clés (Test ou Live)",
        variant: "destructive",
      });
      return;
    }

    // Validate test keys format if provided
    if (testSecretKey.trim() && !testSecretKey.startsWith('sk_test_')) {
      toast({
        title: "Erreur",
        description: "La clé secrète de test doit commencer par 'sk_test_'",
        variant: "destructive",
      });
      return;
    }
    if (testPublicKey.trim() && !testPublicKey.startsWith('pk_test_')) {
      toast({
        title: "Erreur",
        description: "La clé publique de test doit commencer par 'pk_test_'",
        variant: "destructive",
      });
      return;
    }

    // Validate live keys format if provided
    if (liveSecretKey.trim() && !liveSecretKey.startsWith('sk_live_')) {
      toast({
        title: "Erreur",
        description: "La clé secrète live doit commencer par 'sk_live_'",
        variant: "destructive",
      });
      return;
    }
    if (livePublicKey.trim() && !livePublicKey.startsWith('pk_live_')) {
      toast({
        title: "Erreur",
        description: "La clé publique live doit commencer par 'pk_live_'",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-config', {
        body: {
          action: 'save',
          secret_key_test: testSecretKey.trim() || null,
          public_key_test: testPublicKey.trim() || null,
          secret_key_live: liveSecretKey.trim() || null,
          public_key_live: livePublicKey.trim() || null,
          mode: mode,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Configuration enregistrée avec succès",
          description: `Vos clés Paystack ${mode === 'test' ? 'Test' : 'Live'} sont maintenant actives et prêtes à être utilisées`,
          duration: 5000,
        });
        
        setTestSecretKey('');
        setTestPublicKey('');
        setLiveSecretKey('');
        setLivePublicKey('');
        await loadConfig();
        onOpenChange(false);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder la configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Configuration Sécurisée Paystack
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Les clés sont chiffrées avec AES-256 et stockées de manière sécurisée
          </p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Help section with Paystack links */}
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <KeyRound className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="space-y-2">
                <p className="font-medium">📚 Comment obtenir vos clés Paystack ?</p>
                <ol className="text-sm space-y-1 ml-4 list-decimal">
                  <li>Connectez-vous à votre tableau de bord Paystack</li>
                  <li>Allez dans Paramètres → API Keys & Webhooks</li>
                  <li>Copiez vos clés Test ou Live selon vos besoins</li>
                  <li>Collez-les ci-dessous et testez la connexion</li>
                </ol>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open('https://dashboard.paystack.com/#/settings/developers', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ouvrir le Dashboard Paystack
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Active key indicator */}
          {(hasTestKeys || hasLiveKeys) && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                ✅ Clés {mode === 'test' ? 'Test' : 'Live'} actives et prêtes à l'utilisation
              </AlertDescription>
            </Alert>
          )}
          
          {!hasTestKeys && !hasLiveKeys && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                ⚠️ Aucune clé Paystack configurée. Veuillez ajouter vos clés pour activer les paiements.
              </AlertDescription>
            </Alert>
          )}

          {/* Mode selector */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Mode de paiement actuel</Label>
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'test' | 'live')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="test" id="test" />
                <Label htmlFor="test" className="flex-1 cursor-pointer">
                  <div className="font-medium flex items-center gap-2">
                    Mode Test
                    {mode === 'test' && hasTestKeys && <span className="text-xs text-green-600 dark:text-green-400">✅ Active</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">Pour les tests et le développement</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="live" id="live" />
                <Label htmlFor="live" className="flex-1 cursor-pointer">
                  <div className="font-medium flex items-center gap-2">
                    Mode Live
                    {mode === 'live' && hasLiveKeys && <span className="text-xs text-green-600 dark:text-green-400">✅ Active</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">Pour les paiements réels</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Test keys */}
          <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <Label className="text-base font-semibold">Clés Test Paystack</Label>
                {hasTestKeys && <span className="text-xs text-green-600 dark:text-green-400">✓ Configurées</span>}
              </div>
              {hasTestKeys && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteKeys('test')}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-secret-key">Clé Secrète (Secret Key)</Label>
              <Input
                id="test-secret-key"
                type="password"
                placeholder="sk_test_..."
                value={testSecretKey}
                onChange={(e) => setTestSecretKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Utilisée côté serveur pour traiter les paiements
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-public-key">Clé Publique (Public Key)</Label>
              <Input
                id="test-public-key"
                type="text"
                placeholder="pk_test_..."
                value={testPublicKey}
                onChange={(e) => setTestPublicKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Utilisée côté client pour initialiser les paiements
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleTestKey('test')}
              disabled={isTesting || !testSecretKey.trim()}
              className="w-full"
            >
              {isTesting ? 'Test en cours...' : '🔍 Tester la connexion Test'}
            </Button>
          </div>

          {/* Live keys */}
          <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <Label className="text-base font-semibold">Clés Live Paystack</Label>
                {hasLiveKeys && <span className="text-xs text-green-600 dark:text-green-400">✓ Configurées</span>}
              </div>
              {hasLiveKeys && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteKeys('live')}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="live-secret-key">Clé Secrète (Secret Key)</Label>
              <Input
                id="live-secret-key"
                type="password"
                placeholder="sk_live_..."
                value={liveSecretKey}
                onChange={(e) => setLiveSecretKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Utilisée côté serveur pour traiter les paiements réels
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="live-public-key">Clé Publique (Public Key)</Label>
              <Input
                id="live-public-key"
                type="text"
                placeholder="pk_live_..."
                value={livePublicKey}
                onChange={(e) => setLivePublicKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Utilisée côté client pour initialiser les paiements réels
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleTestKey('live')}
              disabled={isTesting || !liveSecretKey.trim()}
              className="w-full"
            >
              {isTesting ? 'Test en cours...' : '🔍 Tester la connexion Live'}
            </Button>
          </div>

          {/* Debug mode */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('paystack-config', {
                    body: { action: 'get_decrypted_keys' }
                  });
                  if (error) throw error;
                  if (data.success) {
                    setCurrentKeys({
                      secretKey: '', // Not returned for regular users
                      publicKey: data.public_key,
                      mode: data.mode
                    });
                    setShowDebugInfo(true);
                  }
                } catch (err: any) {
                  toast({
                    title: "Erreur",
                    description: err.message || "Impossible de récupérer les clés",
                    variant: "destructive",
                  });
                }
              }}
              className="w-full"
            >
              🔍 Mode Debug : Afficher les clés en cours d'utilisation
            </Button>
            
            {showDebugInfo && currentKeys && (
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  🔐 Mode Debug (Admin seulement)
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground">Mode actuel :</span>
                    <span className="ml-2 font-bold text-yellow-700 dark:text-yellow-300">
                      {currentKeys.mode.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clé publique en cours d'utilisation :</span>
                    <div className="mt-1 p-2 bg-white dark:bg-gray-900 rounded break-all">
                      {currentKeys.publicKey}
                    </div>
                  </div>
                  <p className="text-green-700 dark:text-green-300 mt-2">
                    ✅ Cette clé publique est utilisée pour initialiser les paiements
                  </p>
                  <p className="text-muted-foreground text-xs mt-2">
                    Note : La clé secrète est utilisée uniquement côté serveur et n'est jamais exposée au front-end
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Security info */}
          <div className="bg-accent/30 p-3 rounded-lg border">
            <div className="flex items-start gap-2">
              <KeyRound className="w-4 h-4 mt-0.5 text-primary" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Sécurité maximale :</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Chiffrement AES-256 côté serveur</li>
                  <li>Clés jamais visibles en clair</li>
                  <li>Accès réservé aux super admins</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}