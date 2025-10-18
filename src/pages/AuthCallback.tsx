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
        
        // Récupérer les paramètres depuis l'URL
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const code = params.get('code') || hashParams.get('code');
        const type = params.get('type') || hashParams.get('type');
        const errorParam = params.get('error') || hashParams.get('error');
        const errorDescription = params.get('error_description') || hashParams.get('error_description');

        console.log('[AuthCallback] Parameters found:', { 
          hasCode: !!code, 
          type,
          error: errorParam 
        });

        // Si Supabase retourne une erreur dans l'URL
        if (errorParam) {
          console.error('[AuthCallback] Error in URL:', errorParam, errorDescription);
          throw new Error(errorDescription || errorParam);
        }

        // Vérifier si on a un code de vérification
        if (code) {
          console.log('[AuthCallback] Exchanging code for session...');
          
          // Échanger le code contre une session active
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[AuthCallback] Exchange error:', error);
            throw error;
          }

          if (data?.session?.user) {
            console.log('[AuthCallback] Session established successfully for user:', data.session.user.id);
            setStatus('success');
            setMessage('Email vérifié avec succès !');

            // Redirection vers la page de bienvenue après un court délai
            setTimeout(() => {
              navigate('/auth/welcome', { replace: true });
            }, 1000);
          } else {
            throw new Error('Aucune session retournée après l\'échange du token');
          }
        } else {
          throw new Error('Aucun code de vérification trouvé dans l\'URL');
        }
      } catch (error: any) {
        console.error('[AuthCallback] Verification error:', error);
        setStatus('error');
        
        // Messages d'erreur détaillés
        let errorMessage = 'Le lien de vérification est invalide ou expiré.';
        
        if (error.message?.toLowerCase().includes('expired')) {
          errorMessage = 'Le lien de vérification a expiré. Veuillez demander un nouveau lien depuis la page de connexion.';
        } else if (error.message?.toLowerCase().includes('invalid')) {
          errorMessage = 'Le lien de vérification est invalide. Assurez-vous d\'utiliser le lien le plus récent envoyé par email.';
        } else if (error.message?.toLowerCase().includes('already') || error.message?.toLowerCase().includes('used')) {
          errorMessage = 'Ce lien a déjà été utilisé. Votre compte est déjà vérifié. Connectez-vous directement.';
        } else if (error.message?.toLowerCase().includes('not authorized') || error.message?.toLowerCase().includes('domain')) {
          errorMessage = 'Ce domaine n\'est pas autorisé. Contactez le support technique Djassa.';
        }
        
        setMessage(errorMessage);
      }
    };

    handleEmailVerification();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            {status === 'loading' && (
              <div className="relative">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <div className="absolute inset-0 h-16 w-16 rounded-full bg-primary/10 animate-pulse" />
              </div>
            )}
            {status === 'success' && (
              <div className="relative animate-scale-in">
                <div className="absolute inset-0 h-20 w-20 rounded-full bg-success/20 animate-pulse" />
                <CheckCircle2 className="h-20 w-20 text-success relative z-10" />
              </div>
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-destructive animate-scale-in" />
            )}
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold">
            {status === 'loading' && 'Vérification en cours...'}
            {status === 'success' && (
              <span className="gradient-text-primary">Vérification réussie !</span>
            )}
            {status === 'error' && 'Erreur de vérification'}
          </CardTitle>
          <CardDescription className="mt-3 text-base">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {status === 'success' && (
            <div className="text-center space-y-3 animate-fade-in">
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <p className="text-sm text-foreground font-medium">
                  🎉 Bienvenue sur Djassa !
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Votre compte est maintenant actif
                </p>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-3 animate-fade-in">
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full h-12 text-base font-semibold gradient-bg-primary hover:opacity-90 transition-opacity"
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
