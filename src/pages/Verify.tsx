import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Token de vérification manquant');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('verify_email_with_token', {
          _token: token
        });

        if (error) throw error;

        const result = data as { success: boolean; error?: string; message?: string };

        if (result.success) {
          setStatus('success');
          setMessage('Votre email a été vérifié avec succès ! Vous pouvez maintenant vous connecter.');
          
          // Rediriger vers la page de connexion après 3 secondes
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Erreur lors de la vérification');
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage('Une erreur est survenue lors de la vérification');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

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
            {status === 'success' && 'Email vérifié ! ✅'}
            {status === 'error' && 'Erreur de vérification'}
          </CardTitle>
          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Redirection automatique dans quelques secondes...
              </p>
              <Button asChild className="w-full">
                <Link to="/auth">
                  Se connecter maintenant
                </Link>
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link to="/auth">
                  Retour à la connexion
                </Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Si le problème persiste, contactez le support
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Verify;
