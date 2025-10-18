import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, LogIn } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-lg shadow-xl animate-fade-in">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <CheckCircle2 className="h-20 w-20 text-green-600 animate-scale-in" />
              <div className="absolute inset-0 bg-green-600/20 rounded-full blur-xl animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            🎉 Bienvenue sur Djassa !
          </CardTitle>
          <CardDescription className="text-base space-y-2">
            <p className="text-foreground/80">
              Votre adresse e-mail a bien été confirmée.
            </p>
            <p className="text-foreground/70">
              Nous sommes ravis de vous accueillir dans la communauté Djassa.
            </p>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isAuthenticated === null && (
            <div className="flex flex-col items-center space-y-4 py-6">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Vérification de votre session...
              </p>
            </div>
          )}

          {isAuthenticated === true && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Vous êtes déjà connecté
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Redirection vers votre espace personnel dans quelques secondes...
                    </p>
                  </div>
                </div>
              </div>

              {redirecting && (
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Redirection en cours...</span>
                </div>
              )}
            </div>
          )}

          {isAuthenticated === false && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <LogIn className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      🔐 Veuillez vous reconnecter
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Pour accéder à votre compte, veuillez vous connecter.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => navigate('/auth')}
                className="w-full"
                size="lg"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Se connecter maintenant
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Vous serez redirigé vers la page de connexion
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthWelcome;
