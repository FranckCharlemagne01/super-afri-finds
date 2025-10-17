import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification de votre compte en cours...');

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Récupérer le hash de l'URL (Supabase l'ajoute automatiquement)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        // Vérifier si c'est bien une vérification d'email
        if (type === 'signup' || type === 'email') {
          if (accessToken) {
            // L'utilisateur est maintenant connecté automatiquement
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) throw error;

            if (user) {
              // Marquer l'email comme vérifié dans la table profiles
              await supabase
                .from('profiles')
                .update({ 
                  email_verified: true,
                  email_verification_token: null,
                  email_verification_expires_at: null
                })
                .eq('user_id', user.id);

              setStatus('success');
              setMessage('✅ Vérification réussie ! Redirection en cours vers votre compte...');

              // Récupérer le rôle de l'utilisateur pour rediriger correctement
              const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .order('role', { ascending: true })
                .limit(1)
                .single();

              // Redirection après 3 secondes
              setTimeout(() => {
                if (roleData?.role === 'seller') {
                  navigate('/seller-dashboard');
                } else if (roleData?.role === 'buyer') {
                  navigate('/buyer-dashboard');
                } else {
                  navigate('/');
                }
              }, 3000);
            }
          } else {
            throw new Error('Token de vérification manquant');
          }
        } else {
          throw new Error('Type de vérification invalide');
        }
      } catch (error) {
        console.error('Erreur de vérification:', error);
        setStatus('error');
        setMessage('⚠️ Le lien de vérification est invalide ou expiré. Veuillez vous reconnecter.');
      }
    };

    handleEmailVerification();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Vérification en cours...'}
            {status === 'success' && 'Compte vérifié ! ✅'}
            {status === 'error' && 'Erreur de vérification'}
          </CardTitle>
          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Redirection automatique dans quelques secondes...
              </p>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full"
              >
                Retour à la connexion
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Si le problème persiste, contactez le support Djassa
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
