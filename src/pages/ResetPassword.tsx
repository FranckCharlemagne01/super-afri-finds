import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleTokenExchange = async () => {
      // Vérifier le type de flow utilisé par Supabase
      const code = searchParams.get('code');
      const error_code = searchParams.get('error_code');
      const error_description = searchParams.get('error_description');
      
      // Si erreur dans l'URL
      if (error_code || error_description) {
        toast({
          variant: "destructive",
          title: "❌ Erreur",
          description: error_description || "Le lien de réinitialisation est invalide.",
        });
        navigate('/auth');
        return;
      }
      
      // Si code PKCE présent, l'échanger contre une session
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Token exchange error:', error);
          toast({
            variant: "destructive",
            title: "❌ Lien invalide ou expiré",
            description: "Ce lien de réinitialisation n'est plus valide. Veuillez demander un nouveau lien.",
          });
          navigate('/auth');
        }
        // Si succès, l'utilisateur reste sur la page pour changer son mot de passe
      } else {
        // Aucun code trouvé
        toast({
          variant: "destructive",
          title: "❌ Lien invalide",
          description: "Ce lien de réinitialisation est invalide. Veuillez utiliser le lien complet reçu par email.",
        });
        navigate('/auth');
      }
    };

    handleTokenExchange();
  }, [searchParams, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas. Veuillez vérifier.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        console.error('Update password error:', updateError);
        setError('Une erreur est survenue lors de la mise à jour. Veuillez réessayer.');
      } else {
        toast({
          title: "✅ Mot de passe mis à jour",
          description: "Votre mot de passe a été mis à jour avec succès ! Vous pouvez maintenant vous connecter.",
          duration: 5000,
        });
        
        // Déconnecter l'utilisateur et rediriger vers la page de connexion
        await supabase.auth.signOut();
        setTimeout(() => {
          navigate('/auth');
        }, 1000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Réinitialiser votre mot de passe</CardTitle>
          <CardDescription>
            Entrez votre nouveau mot de passe ci-dessous
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Entrez votre nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez votre nouveau mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Mise à jour...' : 'Réinitialiser mon mot de passe'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/auth')}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Retour à la connexion
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
