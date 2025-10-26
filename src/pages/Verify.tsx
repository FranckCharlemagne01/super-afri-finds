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
      try {
        console.log('[Verify] Processing verification URL:', window.location.href);
        
        // Récupérer les paramètres depuis l'URL
        const tokenHash = searchParams.get('token_hash') || searchParams.get('token');
        const type = searchParams.get('type') || 'email';
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('[Verify] Parameters:', { 
          hasTokenHash: !!tokenHash, 
          hasCode: !!code,
          type,
          error: errorParam 
        });

        // Si erreur dans l'URL
        if (errorParam) {
          console.error('[Verify] Error in URL:', errorParam, errorDescription);
          
          // Si l'utilisateur est déjà vérifié, rediriger vers login
          if (errorDescription?.toLowerCase().includes('already') || 
              errorDescription?.toLowerCase().includes('confirmed') ||
              errorDescription?.toLowerCase().includes('verified')) {
            setStatus('success');
            setTimeout(() => {
              navigate('/auth?verified=already', { replace: true });
            }, 1500);
            return;
          }
          
          throw new Error(errorDescription || errorParam);
        }

        // Cas 1 : Code PKCE (méthode moderne)
        if (code) {
          console.log('[Verify] Exchanging PKCE code...');
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[Verify] Exchange error:', error);
            
            // Si déjà vérifié malgré l'erreur
            if (error.message?.toLowerCase().includes('already')) {
              setStatus('success');
              setTimeout(() => {
                navigate('/auth?verified=already', { replace: true });
              }, 1500);
              return;
            }
            
            throw error;
          }

          if (data?.session) {
            console.log('[Verify] Session established for user:', data.session.user.id);
            setStatus('success');
            setTimeout(() => {
              navigate('/auth/welcome', { replace: true });
            }, 1500);
            return;
          }
        }

        // Cas 2 : Token hash OTP (lien magique)
        if (tokenHash) {
          console.log('[Verify] Verifying OTP token...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });

          if (error) {
            console.error('[Verify] OTP verification error:', error);
            
            // Si déjà vérifié
            if (error.message?.toLowerCase().includes('already')) {
              setStatus('success');
              setTimeout(() => {
                navigate('/auth?verified=already', { replace: true });
              }, 1500);
              return;
            }
            
            throw error;
          }

          if (data?.session) {
            console.log('[Verify] OTP verified, session created');
            setStatus('success');
            setTimeout(() => {
              navigate('/auth/welcome', { replace: true });
            }, 1500);
            return;
          }
        }

        // Si aucun paramètre de vérification
        throw new Error('Aucun code de vérification trouvé');
        
      } catch (error: any) {
        console.error('[Verify] Verification error:', error);
        setStatus('error');
        
        // Rediriger vers auth avec message d'erreur après 2 secondes
        setTimeout(() => {
          navigate('/auth?error=verification_failed', { replace: true });
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
            {status === 'success' && '✅ Votre compte a été vérifié avec succès !'}
            {status === 'error' && 'Erreur lors de la vérification. Redirection...'}
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
