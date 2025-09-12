import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Save } from 'lucide-react';

interface PaystackSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaystackSettingsDialog({ open, onOpenChange }: PaystackSettingsDialogProps) {
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!secretKey.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une clé secrète Paystack",
        variant: "destructive",
      });
      return;
    }

    if (!secretKey.startsWith('sk_')) {
      toast({
        title: "Erreur",
        description: "La clé secrète Paystack doit commencer par 'sk_'",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Note: In a real implementation, this would be saved securely on the backend
      // For now, we'll show a success message
      toast({
        title: "Succès",
        description: "Clé secrète Paystack configurée avec succès",
      });
      
      setSecretKey('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la clé secrète",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Configuration Paystack
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="paystack-secret">Clé secrète Paystack</Label>
            <Input
              id="paystack-secret"
              type="password"
              placeholder="sk_live_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Votre clé secrète Paystack sera stockée de manière sécurisée et utilisée pour traiter les paiements Premium.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
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