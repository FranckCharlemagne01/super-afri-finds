import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, LogIn, Sparkles } from 'lucide-react';

const AuthWelcome = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('[AuthWelcome] Checking session...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthWelcome] Session error:', error);
          throw error;
        }

        if (session?.user) {
          console.log('[AuthWelcome] Valid session found for user:', session.user.id);
          setIsAuthenticated(true);
          
          // Récupérer le rôle de l'utilisateur
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .order('role', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (roleError) {
            console.error('[AuthWelcome] Role fetch error:', roleError);
          }

          const role = roleData?.role || 'buyer';
          setUserRole(role);
          setRedirecting(true);

          console.log('[AuthWelcome] Redirecting user with role:', role);

          // Redirection automatique après 2 secondes
          setTimeout(() => {
            if (role === 'seller' || role === 'admin' || role === 'superadmin') {
              navigate('/seller-dashboard', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          }, 2000);
        } else {
          console.log('[AuthWelcome] No active session found');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AuthWelcome] Error checking session:', error);
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center mb-2">
            {isAuthenticated === null ? (
              <div className="relative">
                <Loader2 className="h-20 w-20 text-primary animate-spin" />
                <Sparkles className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            ) : (
              <div className="relative">
                <CheckCircle2 className="h-20 w-20 text-green-600 animate-in zoom-in-50 duration-300" />
                <div className="absolute inset-0 bg-green-600/20 rounded-full blur-2xl animate-pulse" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Bienvenue sur Djassa 👋
          </CardTitle>
          <CardDescription className="text-base md:text-lg space-y-2">
            {isAuthenticated === true ? (
              <p className="text-foreground/90 font-medium">
                ✅ Votre compte a été vérifié avec succès !
              </p>
            ) : (
              <p className="text-foreground/80">
                Votre adresse email a été confirmée.
              </p>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {isAuthenticated === null && (
            <div className="flex flex-col items-center space-y-4 py-6">
              <p className="text-sm text-muted-foreground animate-pulse">
                Vérification de votre session...
              </p>
            </div>
          )}

          {isAuthenticated === true && (
            <div className="space-y-4 py-4 animate-in fade-in-50 duration-500">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-xl p-6 text-center space-y-3">
                <p className="text-lg font-bold text-foreground">
                  🎉 Félicitations !
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vous allez être redirigé vers votre espace personnel dans quelques instants...
                </p>
              </div>

              <Button
                onClick={() => {
                  if (userRole === 'seller' || userRole === 'admin' || userRole === 'superadmin') {
                    navigate('/seller-dashboard', { replace: true });
                  } else {
                    navigate('/', { replace: true });
                  }
                }}
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                Accéder à mon espace maintenant
              </Button>

              {redirecting && (
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Redirection en cours...</span>
                </div>
              )}
            </div>
          )}

          {isAuthenticated === false && (
            <div className="space-y-4 py-4 animate-in fade-in-50 duration-500">
              <div className="bg-muted/30 border border-muted rounded-xl p-6 text-center space-y-3">
                <p className="text-base font-medium text-foreground">
                  📧 Votre email est confirmé
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connectez-vous maintenant pour accéder à votre compte et commencer à utiliser Djassa.
                </p>
              </div>

              <Button
                onClick={() => navigate('/auth')}
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Se connecter
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Besoin d'assistance ? Contactez le support Djassa
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthWelcome;
