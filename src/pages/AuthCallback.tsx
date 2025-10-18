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
        // Récupérer le code depuis les paramètres de l'URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (!code) {
          throw new Error('Code de vérification manquant');
        }

        // Échanger le code contre une session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) throw error;

        if (data.session) {
          setStatus('success');
          setMessage('✅ Vérification réussie ! Redirection en cours...');

          // Redirection vers la page de bienvenue après 1 seconde
          setTimeout(() => {
            navigate('/auth/welcome');
          }, 1000);
        } else {
          throw new Error('Session invalide');
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
