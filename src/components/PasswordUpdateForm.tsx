import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export const PasswordUpdateForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    // Security: Enforce strong password requirements (min 12 characters, mixed case, numbers, special chars)
    const PASSWORD_MIN_LENGTH = 12;
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    
    if (passwords.newPassword.length < PASSWORD_MIN_LENGTH) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 12 caractères",
        variant: "destructive",
      });
      return;
    }
    
    if (!PASSWORD_REGEX.test(passwords.newPassword)) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 12 caractères, incluant majuscules, minuscules, chiffres et caractères spéciaux (@$!%*?&)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) throw error;

      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès",
      });

      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le mot de passe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof passwords, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5 bg-card/50 rounded-xl border-2 shadow-sm max-w-md">
      <div className="space-y-2">
        <Label htmlFor="currentPassword" className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Mot de passe actuel
        </Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            value={passwords.currentPassword}
            onChange={(e) => handleChange('currentPassword', e.target.value)}
            placeholder="Votre mot de passe actuel"
            required
            className="pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 hover:bg-transparent"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            value={passwords.newPassword}
            onChange={(e) => handleChange('newPassword', e.target.value)}
            placeholder="Votre nouveau mot de passe"
            required
            minLength={12}
            className="pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground space-y-1.5 mt-2 bg-muted/50 p-3 rounded-lg">
          <p className="font-semibold">Le mot de passe doit contenir :</p>
          <ul className="list-disc list-inside space-y-0.5 ml-1">
            <li>Au moins 12 caractères</li>
            <li>Majuscules, minuscules, chiffres</li>
            <li>Caractères spéciaux (@$!%*?&)</li>
          </ul>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={passwords.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            placeholder="Confirmez votre nouveau mot de passe"
            required
            minLength={12}
            className="pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full min-h-[48px] rounded-xl font-semibold shadow-md transition-all hover:scale-[1.02]"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Modifier le mot de passe
      </Button>
    </form>
  );
};