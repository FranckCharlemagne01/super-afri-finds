import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Save, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
          title: "✅ Succès",
          description: "Configuration Paystack enregistrée de manière sécurisée",
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
          {/* Mode selector */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Mode de paiement</Label>
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'test' | 'live')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="test" id="test" />
                <Label htmlFor="test" className="flex-1 cursor-pointer">
                  <div className="font-medium">Mode Test</div>
                  <div className="text-sm text-muted-foreground">Pour les tests et le développement</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="live" id="live" />
                <Label htmlFor="live" className="flex-1 cursor-pointer">
                  <div className="font-medium">Mode Live</div>
                  <div className="text-sm text-muted-foreground">Pour les paiements réels</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Test keys */}
          <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
              <Label className="text-base font-semibold">Clés Test Paystack</Label>
              {hasTestKeys && <span className="text-xs text-green-600 dark:text-green-400">✓ Configurées</span>}
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
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <Label className="text-base font-semibold">Clés Live Paystack</Label>
              {hasLiveKeys && <span className="text-xs text-green-600 dark:text-green-400">✓ Configurées</span>}
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