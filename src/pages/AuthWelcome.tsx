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
  const [countdown, setCountdown] = useState(5);

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

          // Compte à rebours de 5 secondes
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                if (role === 'seller' || role === 'admin' || role === 'superadmin') {
                  navigate('/seller-dashboard', { replace: true });
                } else {
                  navigate('/', { replace: true });
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            {isAuthenticated === null ? (
              <div className="relative">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <div className="absolute inset-0 h-16 w-16 rounded-full bg-primary/10 animate-pulse" />
              </div>
            ) : isAuthenticated ? (
              <div className="relative animate-scale-in">
                <div className="absolute inset-0 h-20 w-20 rounded-full bg-success/20 animate-pulse" />
                <CheckCircle2 className="h-20 w-20 text-success relative z-10" />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 h-20 w-20 rounded-full bg-primary/10 animate-pulse" />
                <Sparkles className="h-20 w-20 text-primary relative z-10" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold">
            {isAuthenticated === null && 'Vérification...'}
            {isAuthenticated && (
              <span className="gradient-text-primary">Bienvenue sur Djassa ! 🎉</span>
            )}
            {isAuthenticated === false && (
              <span className="gradient-text-primary">Email vérifié ! ✅</span>
            )}
          </CardTitle>
          <CardDescription className="mt-3 text-base">
            {isAuthenticated === null && 'Vérification de votre session en cours...'}
            {isAuthenticated && redirecting && (
              <span className="text-foreground font-medium">
                Nous sommes ravis de vous revoir !
              </span>
            )}
            {isAuthenticated === false && (
              <span className="text-foreground">
                Votre adresse e-mail a été vérifiée avec succès ! Vous pouvez maintenant vous connecter à votre compte Djassa.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {isAuthenticated && redirecting && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <p className="text-sm text-foreground font-semibold">
                    Redirection automatique dans {countdown}s
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Préparation de votre espace personnel...
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
                className="w-full h-12 text-base font-semibold gradient-bg-primary hover:opacity-90 transition-opacity"
                size="lg"
              >
                Accéder maintenant
              </Button>
            </div>
          )}
          {isAuthenticated === false && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-success/10 rounded-lg border border-success/20 mb-4">
                <p className="text-sm text-center text-foreground font-medium">
                  ✅ Votre compte est maintenant actif
                </p>
              </div>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full h-12 text-base font-semibold gradient-bg-primary hover:opacity-90 transition-opacity"
                size="lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Se connecter
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Nouveau sur Djassa ? Créez un compte pour commencer à acheter et vendre
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthWelcome;
