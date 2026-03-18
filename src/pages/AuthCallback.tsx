import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'incomplete'>('loading');
  const [message, setMessage] = useState('Vérification de votre compte en cours...');
  const [pastedUrl, setPastedUrl] = useState('');

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        console.log('[AuthCallback] Processing callback URL:', window.location.href);
        
        // Récupérer les paramètres depuis l'URL (query et hash)
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const code = params.get('code') || hashParams.get('code');
        const type = params.get('type') || hashParams.get('type');
        const errorParam = params.get('error') || hashParams.get('error');
        const errorDescription = params.get('error_description') || hashParams.get('error_description');
        const accessToken = params.get('access_token') || hashParams.get('access_token');

        console.log('[AuthCallback] Parameters found:', { 
          hasCode: !!code, 
          hasAccessToken: !!accessToken,
          type,
          error: errorParam 
        });

        // Si Supabase retourne une erreur dans l'URL
        if (errorParam) {
          console.error('[AuthCallback] Error in URL:', errorParam, errorDescription);
          
          // Si l'erreur dit que l'utilisateur est déjà confirmé, considérer comme succès
          if (errorDescription?.toLowerCase().includes('already') || 
              errorDescription?.toLowerCase().includes('confirmed') ||
              errorDescription?.toLowerCase().includes('verified')) {
            console.log('[AuthCallback] User already verified, redirecting to welcome');
            setStatus('success');
            setMessage('Votre compte est déjà vérifié !');
            setTimeout(() => {
              navigate('/auth/welcome', { replace: true });
            }, 1500);
            return;
          }
          
          throw new Error(errorDescription || errorParam);
        }

        // Cas 1 : Échange de code PKCE (méthode moderne)
        if (code) {
          console.log('[AuthCallback] Exchanging PKCE code for session...');
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[AuthCallback] Exchange error:', error);
            
            // Si l'erreur indique que l'utilisateur est déjà vérifié
            if (error.message?.toLowerCase().includes('already') || 
                error.message?.toLowerCase().includes('verified')) {
              console.log('[AuthCallback] User already verified despite error');
              setStatus('success');
              setMessage('Votre compte est déjà vérifié !');
              setTimeout(() => {
                navigate('/auth/welcome', { replace: true });
              }, 1500);
              return;
            }
            
            throw error;
          }

          if (data?.session?.user) {
            const user = data.session.user;
            console.log('[AuthCallback] Session established successfully for user:', user.id);
            
            // Check if this is a Google user with incomplete profile
            const isGoogleUser = user.app_metadata?.provider === 'google' ||
              user.identities?.some(id => id.provider === 'google');
            
            if (isGoogleUser) {
              console.log('[AuthCallback] Google user detected, checking profile completion...');
              
              const [profileResult, roleResult] = await Promise.all([
                supabase.from('profiles').select('country, city').eq('user_id', user.id).maybeSingle(),
                supabase.from('user_roles').select('role').eq('user_id', user.id).limit(1).maybeSingle(),
              ]);
              
              const hasCountry = Boolean(profileResult.data?.country);
              const hasCity = Boolean(profileResult.data?.city);
              const hasRole = Boolean(roleResult.data?.role);
              
              if (!hasCountry || !hasCity || !hasRole) {
                console.log('[AuthCallback] Google user profile incomplete, redirecting to complete-profile');
                setStatus('success');
                setMessage('Complétez votre profil pour continuer...');
                setTimeout(() => {
                  navigate('/auth/complete-profile', { replace: true });
                }, 800);
                return;
              }
            }
            
            setStatus('success');
            setMessage('Email vérifié avec succès !');

            // Redirection vers la page de bienvenue
            setTimeout(() => {
              navigate('/auth/welcome', { replace: true });
            }, 1500);
            return;
          }
        }
        
        // Cas 2 : Token d'accès direct dans l'URL (ancienne méthode)
        if (accessToken) {
          console.log('[AuthCallback] Direct access token found, verifying session...');
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[AuthCallback] Session error:', error);
            throw error;
          }
          
          if (session?.user) {
            console.log('[AuthCallback] Session active for user:', session.user.id);
            setStatus('success');
            setMessage('Email vérifié avec succès !');
            
            setTimeout(() => {
              navigate('/auth/welcome', { replace: true });
            }, 1500);
            return;
          }
        }
        
        // Vérifier si l'utilisateur a déjà une session active
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!sessionError && session?.user) {
          console.log('[AuthCallback] Active session found, redirecting to welcome');
          setStatus('success');
          setMessage('Votre compte est déjà vérifié !');
          setTimeout(() => {
            navigate('/auth/welcome', { replace: true });
          }, 1500);
          return;
        }
        
        // Si vraiment aucun code ou token n'est trouvé et pas de session
        console.log('[AuthCallback] No verification code found, showing paste field');
        setStatus('incomplete');
        setMessage('Le lien de vérification est incomplet. Collez ici le lien complet reçu par email.');
        
      } catch (error: any) {
        console.error('[AuthCallback] Verification error:', error);
        setStatus('error');
        
        // Messages d'erreur détaillés et contextuels
        let errorMessage = 'Le lien de vérification est invalide ou expiré.';
        
        if (error.message?.toLowerCase().includes('expired')) {
          errorMessage = 'Le lien de vérification a expiré. Veuillez demander un nouveau lien depuis la page de connexion.';
        } else if (error.message?.toLowerCase().includes('invalid')) {
          errorMessage = 'Le lien de vérification est invalide. Assurez-vous d\'utiliser le lien le plus récent envoyé par email.';
        } else if (error.message?.toLowerCase().includes('pkce')) {
          errorMessage = 'Erreur de sécurité lors de la vérification. Veuillez réessayer de vous inscrire.';
        } else if (error.message?.toLowerCase().includes('not authorized') || 
                   error.message?.toLowerCase().includes('domain')) {
          errorMessage = 'Ce domaine n\'est pas autorisé. Contactez le support technique Djassa.';
        } else if (!error.message || error.message === 'Aucun code de vérification trouvé dans l\'URL') {
          errorMessage = 'Lien de vérification incomplet. Veuillez utiliser le lien complet reçu par email.';
        }
        
        setMessage(errorMessage);
      }
    };

    handleEmailVerification();
  }, [navigate]);

  const handlePastedUrl = async () => {
    if (!pastedUrl.trim()) return;

    try {
      setStatus('loading');
      setMessage('Vérification du lien...');

      // Parser l'URL collée pour extraire les paramètres
      const url = new URL(pastedUrl);
      const params = new URLSearchParams(url.search);
      const hashParams = new URLSearchParams(url.hash.substring(1));

      const code = params.get('code') || hashParams.get('code');
      const token = params.get('token') || hashParams.get('token');
      const tokenHash = params.get('token_hash') || hashParams.get('token_hash');
      const type = params.get('type') || hashParams.get('type');

      console.log('[AuthCallback] Parsed pasted URL:', { hasCode: !!code, hasToken: !!token, hasTokenHash: !!tokenHash, type });

      // Si on a un code PKCE, l'échanger
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) throw error;

        if (data?.session?.user) {
          setStatus('success');
          setMessage('Email vérifié avec succès !');
          setTimeout(() => navigate('/auth/welcome', { replace: true }), 1500);
          return;
        }
      }

      // Si on a un token_hash et type, construire l'URL de vérification
      if (tokenHash && type) {
        const verifyUrl = `${window.location.origin}/auth/v1/verify?token=${tokenHash}&type=${type}`;
        window.location.href = verifyUrl;
        return;
      }

      // Si on a juste un token (ancien système)
      if (token) {
        const { data, error } = await supabase.rpc('verify_email_with_token', {
          _token: token
        });

        if (error) throw error;

        const result = data as { success: boolean; error?: string };
        if (result.success) {
          setStatus('success');
          setMessage('Email vérifié avec succès !');
          setTimeout(() => navigate('/auth/welcome', { replace: true }), 1500);
          return;
        }
      }

      throw new Error('Lien invalide ou incomplet');

    } catch (error: any) {
      console.error('[AuthCallback] Pasted URL error:', error);
      setStatus('error');
      setMessage('Le lien fourni est invalide ou a expiré. Veuillez demander un nouveau lien de vérification.');
    }
  };

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
          {status === 'incomplete' && (
            <XCircle className="h-16 w-16 text-amber-500 animate-scale-in" />
          )}
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold">
            {status === 'loading' && 'Vérification en cours...'}
            {status === 'success' && (
              <span className="gradient-text-primary">Vérification réussie !</span>
            )}
            {status === 'error' && 'Erreur de vérification'}
            {status === 'incomplete' && 'Lien incomplet'}
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
          {status === 'incomplete' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="verification-url" className="text-sm font-medium">
                  Collez le lien complet reçu par email
                </Label>
                <Input
                  id="verification-url"
                  type="text"
                  placeholder="https://..."
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button 
                onClick={handlePastedUrl}
                disabled={!pastedUrl.trim()}
                className="w-full h-12 text-base font-semibold gradient-bg-primary hover:opacity-90 transition-opacity"
                size="lg"
              >
                Vérifier le lien
              </Button>
              <Button 
                onClick={() => navigate('/auth')} 
                variant="outline"
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-3 animate-fade-in">
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full h-12 text-base font-semibold gradient-bg-primary hover:opacity-90 transition-opacity"
                size="lg"
              >
                Se reconnecter
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
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
