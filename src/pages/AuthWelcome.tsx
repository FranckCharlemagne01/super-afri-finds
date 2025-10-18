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
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          setIsAuthenticated(true);
          
          // Récupérer le rôle de l'utilisateur
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .order('role', { ascending: true })
            .limit(1)
            .single();

          setUserRole(roleData?.role || null);
          setRedirecting(true);

          // Redirection automatique après 3 secondes
          setTimeout(() => {
            if (roleData?.role === 'seller') {
              navigate('/seller-dashboard');
            } else if (roleData?.role === 'buyer') {
              navigate('/buyer-dashboard');
            } else {
              navigate('/');
            }
          }, 3000);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la session:', error);
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
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            🎉 Bienvenue sur Djassa !
          </CardTitle>
          <CardDescription className="text-base space-y-2">
            {isAuthenticated === true ? (
              <p className="text-foreground/80 font-medium">
                Votre compte est maintenant vérifié.
              </p>
            ) : (
              <p className="text-foreground/80">
                ✅ Votre adresse email est bien confirmée.
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
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg p-5 text-center space-y-3">
                <p className="text-base font-semibold text-foreground">
                  🎊 Félicitations !
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirection automatique vers votre tableau de bord dans quelques secondes...
                </p>
              </div>

              <Button
                onClick={() => {
                  if (userRole === 'seller') {
                    navigate('/seller-dashboard');
                  } else if (userRole === 'buyer') {
                    navigate('/buyer-dashboard');
                  } else {
                    navigate('/');
                  }
                }}
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                Accéder à mon tableau de bord
              </Button>

              {redirecting && (
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Redirection en cours...</span>
                </div>
              )}
            </div>
          )}

          {isAuthenticated === false && (
            <div className="space-y-4 py-4 animate-in fade-in-50 duration-500">
              <div className="bg-muted/50 border rounded-lg p-5 text-center space-y-2">
                <p className="text-sm text-foreground/80">
                  Veuillez vous reconnecter pour accéder à votre compte.
                </p>
              </div>

              <Button
                onClick={() => navigate('/auth')}
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Se connecter maintenant
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Besoin d'aide ? Contactez le support Djassa.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthWelcome;
