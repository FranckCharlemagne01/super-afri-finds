import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        // Rediriger vers la page de bienvenue même sans token
        navigate('/auth/welcome', { replace: true });
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
          // Rediriger vers la page de bienvenue après vérification réussie
          setTimeout(() => {
            navigate('/auth/welcome', { replace: true });
          }, 1000);
        } else {
          setStatus('error');
          // Même en cas d'erreur, rediriger vers la page de bienvenue
          setTimeout(() => {
            navigate('/auth/welcome', { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        // Rediriger vers la page de bienvenue même en cas d'erreur
        setTimeout(() => {
          navigate('/auth/welcome', { replace: true });
        }, 2000);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="absolute inset-0 h-16 w-16 rounded-full bg-primary/10 animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-2xl gradient-text-primary">
            Vérification en cours...
          </CardTitle>
          <CardDescription className="mt-2">
            {status === 'loading' && 'Validation de votre adresse email...'}
            {status === 'success' && 'Email vérifié ! Redirection...'}
            {status === 'error' && 'Préparation de votre espace...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="w-16 h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verify;
