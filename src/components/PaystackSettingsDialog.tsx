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
  const [testKey, setTestKey] = useState('');
  const [liveKey, setLiveKey] = useState('');
  const [mode, setMode] = useState<'test' | 'live'>('test');
  const [isLoading, setIsLoading] = useState(false);
  const [hasTestKey, setHasTestKey] = useState(false);
  const [hasLiveKey, setHasLiveKey] = useState(false);
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
        setHasTestKey(data.has_test_key);
        setHasLiveKey(data.has_live_key);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleSave = async () => {
    // Validate at least one key is provided
    if (!testKey.trim() && !liveKey.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer au moins une clé (Test ou Live)",
        variant: "destructive",
      });
      return;
    }

    // Validate test key format if provided
    if (testKey.trim() && !testKey.startsWith('sk_test_')) {
      toast({
        title: "Erreur",
        description: "La clé de test doit commencer par 'sk_test_'",
        variant: "destructive",
      });
      return;
    }

    // Validate live key format if provided
    if (liveKey.trim() && !liveKey.startsWith('sk_live_')) {
      toast({
        title: "Erreur",
        description: "La clé live doit commencer par 'sk_live_'",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-config', {
        body: {
          action: 'save',
          key_test: testKey.trim() || null,
          key_live: liveKey.trim() || null,
          mode: mode,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Succès",
          description: "Configuration Paystack enregistrée de manière sécurisée",
        });
        
        setTestKey('');
        setLiveKey('');
        await loadConfig();
        onOpenChange(false);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
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

          {/* Test key */}
          <div className="space-y-2">
            <Label htmlFor="test-key" className="flex items-center gap-2">
              Clé Test Paystack
              {hasTestKey && <span className="text-xs text-green-600 dark:text-green-400">✓ Configurée</span>}
            </Label>
            <Input
              id="test-key"
              type="password"
              placeholder="sk_test_..."
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour conserver la clé existante
            </p>
          </div>

          {/* Live key */}
          <div className="space-y-2">
            <Label htmlFor="live-key" className="flex items-center gap-2">
              Clé Live Paystack
              {hasLiveKey && <span className="text-xs text-green-600 dark:text-green-400">✓ Configurée</span>}
            </Label>
            <Input
              id="live-key"
              type="password"
              placeholder="sk_live_..."
              value={liveKey}
              onChange={(e) => setLiveKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour conserver la clé existante
            </p>
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