import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, LogIn, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getRedirectPathForUser } from '@/utils/roleRedirect';

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
          
          // Vérifier si c'est un utilisateur Google
          const isGoogleUser = session.user.app_metadata?.provider === 'google' ||
            session.user.identities?.some(id => id.provider === 'google') || false;
          
          console.log('[AuthWelcome] Is Google user:', isGoogleUser);

          // Récupérer le profil pour vérifier la complétion
          const { data: profile } = await supabase
            .from('profiles')
            .select('country, city')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
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

          const role = roleData?.role || null;
          const hasCompleteProfile = Boolean(profile?.country && profile?.city && role);

          console.log('[AuthWelcome] Profile completion check:', {
            country: profile?.country,
            city: profile?.city,
            role,
            hasCompleteProfile,
            isGoogleUser
          });

          // Si utilisateur Google avec profil incomplet, rediriger vers complete-profile
          if (isGoogleUser && !hasCompleteProfile) {
            console.log('[AuthWelcome] Google user needs profile completion, redirecting...');
            toast({
              title: "Bienvenue sur Djassa ! 👋",
              description: "Complétez votre profil pour commencer",
              duration: 4000,
            });
            
            setTimeout(() => {
              navigate('/auth/complete-profile', { replace: true });
            }, 1000);
            return;
          }

          // Afficher le toast de bienvenue
          toast({
            title: "Bienvenue à nouveau sur Djassa 👋",
            description: "Nous sommes ravis de vous revoir !",
            duration: 4000,
          });
          
          setUserRole(role || 'buyer');
          setRedirecting(true);

          console.log('[AuthWelcome] Redirecting user with role:', role);

          // Get role-based redirect path from DB
          const redirectPath = await getRedirectPathForUser(session.user.id);
          console.log('[AuthWelcome] Redirect path:', redirectPath);

          // Compte à rebours de 5 secondes
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                navigate(redirectPath, { replace: true });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 p-4 animate-fade-in">
      <Card className="w-full max-w-md border-0 shadow-2xl animate-scale-in">
        <CardHeader className="text-center pb-4">
          {/* Logo Djassa centré */}
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/f5b1043e-2d80-47f4-bc73-a58dfe091db1.png" 
              alt="Djassa Logo" 
              className="h-16 w-auto animate-fade-in"
            />
          </div>
          
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
          <CardTitle className="text-2xl md:text-3xl font-bold animate-fade-in">
            {isAuthenticated === null && 'Vérification...'}
            {isAuthenticated && (
              <span className="gradient-text-primary">🎉 Votre compte a été confirmé avec succès. Bienvenue sur Djassa !</span>
            )}
            {isAuthenticated === false && (
              <span className="gradient-text-primary">Bienvenue sur Djassa 👋</span>
            )}
          </CardTitle>
          <CardDescription className="mt-3 text-base animate-fade-in">
            {isAuthenticated === null && 'Vérification de votre session en cours...'}
            {isAuthenticated && redirecting && (
              <span className="text-foreground font-medium">
                Nous sommes ravis de vous revoir ! Préparation de votre espace personnel...
              </span>
            )}
            {isAuthenticated === false && (
              <span className="text-foreground">
                Veuillez vous connecter pour accéder à votre compte.
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
                onClick={async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  const path = session?.user ? await getRedirectPathForUser(session.user.id) : '/';
                  navigate(path, { replace: true });
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
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full h-12 text-base font-semibold gradient-bg-primary hover:opacity-90 transition-opacity"
                size="lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Se connecter
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Pas encore de compte ? Inscrivez-vous pour commencer à acheter et vendre
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthWelcome;
