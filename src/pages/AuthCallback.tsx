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
        console.log('[AuthCallback] Processing callback URL:', window.location.href);
        
        // Récupérer les paramètres depuis l'URL (query params et hash)
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const code = params.get('code') || hashParams.get('code');
        const accessToken = params.get('access_token') || hashParams.get('access_token');
        const type = params.get('type') || hashParams.get('type');
        const errorParam = params.get('error') || hashParams.get('error');
        const errorDescription = params.get('error_description') || hashParams.get('error_description');

        console.log('[AuthCallback] Parameters found:', { 
          hasCode: !!code, 
          hasAccessToken: !!accessToken, 
          type,
          error: errorParam 
        });

        // Si Supabase retourne une erreur dans l'URL
        if (errorParam) {
          console.error('[AuthCallback] Error in URL:', errorParam, errorDescription);
          throw new Error(errorDescription || errorParam);
        }

        // Si on a un code ou un access_token, on échange contre une session
        if (code || accessToken) {
          console.log('[AuthCallback] Exchanging code for session...');
          
          // Échanger le code contre une session active
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            code ? code : window.location.href
          );

          if (error) {
            console.error('[AuthCallback] Exchange error:', error);
            throw error;
          }

          if (data?.session?.user) {
            console.log('[AuthCallback] Session established successfully for user:', data.session.user.id);
            setStatus('success');
            setMessage('✅ Compte vérifié avec succès ! Redirection...');

            // Redirection immédiate vers la page de bienvenue
            setTimeout(() => {
              navigate('/auth/welcome', { replace: true });
            }, 500);
          } else {
            throw new Error('Aucune session retournée après l\'échange du token');
          }
        } else {
          throw new Error('Aucun code de vérification trouvé dans l\'URL');
        }
      } catch (error: any) {
        console.error('[AuthCallback] Verification error:', error);
        setStatus('error');
        
        // Messages d'erreur détaillés selon le type
        let errorMessage = '⚠️ Le lien de vérification est invalide ou expiré.';
        
        if (error.message?.toLowerCase().includes('expired')) {
          errorMessage = '⏱️ Le lien de vérification a expiré. Veuillez demander un nouveau lien depuis la page de connexion.';
        } else if (error.message?.toLowerCase().includes('invalid')) {
          errorMessage = '❌ Le lien de vérification est invalide. Assurez-vous d\'utiliser le lien le plus récent envoyé par email.';
        } else if (error.message?.toLowerCase().includes('already') || error.message?.toLowerCase().includes('used')) {
          errorMessage = '✅ Ce lien a déjà été utilisé. Votre compte est déjà vérifié. Connectez-vous directement.';
        } else if (error.message?.toLowerCase().includes('not authorized') || error.message?.toLowerCase().includes('domain')) {
          errorMessage = '🚫 Ce domaine n\'est pas autorisé. Contactez le support technique Djassa.';
        }
        
        setMessage(errorMessage);
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
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full h-11 font-semibold"
                size="lg"
              >
                Retour à la connexion
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Besoin d'aide ? Contactez le support Djassa
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
