import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Rediriger immédiatement vers la page de bienvenue principale
    navigate('/auth/welcome', { replace: true });
  }, [navigate]);

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
            Redirection...
          </CardTitle>
          <CardDescription className="mt-2">
            Préparation de votre espace Djassa
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

export default Welcome;
