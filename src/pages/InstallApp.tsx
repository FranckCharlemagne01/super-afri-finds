import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Share, Plus, MoreVertical, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallApp = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);
    setIsInstalled(isInStandaloneMode);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Application installée !</CardTitle>
              <CardDescription>
                Vous utilisez Djassa en mode application. Profitez de l'expérience complète !
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Continuer vers Djassa
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-3 font-semibold">Installer Djassa</h1>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-lg mx-auto">
        {/* App Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-primary/10 flex items-center justify-center shadow-lg">
            <img src="/favicon.png" alt="Djassa" className="w-16 h-16 rounded-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Djassa Marketplace</h2>
          <p className="text-muted-foreground">
            Installez l'application pour une expérience optimale
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid gap-3 mb-8"
        >
          {[
            { icon: Smartphone, text: "Accès rapide depuis l'écran d'accueil" },
            { icon: Download, text: "Fonctionne hors connexion" },
            { icon: Check, text: "Expérience plein écran sans barre URL" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Install Button (Android/Desktop) */}
        {deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Button 
              onClick={handleInstallClick} 
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Installer l'application
            </Button>
          </motion.div>
        )}

        {/* iOS Instructions */}
        {isIOS && !deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Installation sur iPhone/iPad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Appuyez sur le bouton Partager</p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                      <Share className="w-4 h-4" />
                      <span>En bas de Safari</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Faites défiler et appuyez sur</p>
                    <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-muted rounded-lg text-sm">
                      <Plus className="w-4 h-4" />
                      <span>Sur l'écran d'accueil</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Confirmez avec "Ajouter"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      L'icône Djassa apparaîtra sur votre écran d'accueil
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Android Instructions (fallback) */}
        {isAndroid && !deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Installation sur Android
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Ouvrez le menu du navigateur</p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                      <MoreVertical className="w-4 h-4" />
                      <span>Les 3 points en haut à droite</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Appuyez sur</p>
                    <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-muted rounded-lg text-sm">
                      <Download className="w-4 h-4" />
                      <span>"Installer l'application" ou "Ajouter à l'écran d'accueil"</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Confirmez l'installation</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      L'icône Djassa apparaîtra sur votre écran d'accueil
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Continue without installing */}
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate('/')}>
            Continuer sur le site web
          </Button>
        </div>
      </main>
    </div>
  );
};

export default InstallApp;
