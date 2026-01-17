import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Share, Plus, MoreVertical, Check, ArrowLeft, Monitor, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstallStandalone } from '@/hooks/usePWAInstall';
import IOSInstallOverlay from '@/components/IOSInstallOverlay';

const InstallApp = () => {
  const navigate = useNavigate();
  const { 
    isInstallable, 
    isInstalled, 
    isStandalone, 
    isIOS, 
    isAndroid, 
    promptInstall,
    showIOSOverlay,
    openIOSOverlay,
    closeIOSOverlay
  } = usePWAInstallStandalone();
  
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const isDesktop = !isIOS && !isAndroid;

  // Check if in standalone mode on mount
  useEffect(() => {
    if (isStandalone) {
      setShowSuccess(true);
    }
  }, [isStandalone]);

  const handleInstallClick = async () => {
    // For iOS, show the overlay with instructions
    if (isIOS) {
      openIOSOverlay();
      return;
    }

    // For Android/Desktop, use the native prompt
    if (!isInstallable) {
      setInstallError("L'installation automatique n'est pas disponible. Utilisez le menu de votre navigateur.");
      return;
    }

    setIsInstalling(true);
    setInstallError(null);
    
    try {
      console.log('[InstallApp] Attempting to install...');
      const result = await promptInstall();
      console.log('[InstallApp] Install result:', result);
      
      if (result) {
        setShowSuccess(true);
      } else {
        setInstallError("L'installation a été annulée. Vous pouvez réessayer.");
      }
    } catch (error) {
      console.error('[InstallApp] Install error:', error);
      setInstallError("Erreur lors de l'installation. Veuillez réessayer.");
    } finally {
      setIsInstalling(false);
    }
  };

  // Success screen
  if (showSuccess || isInstalled || isStandalone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-safe-nav">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <motion.div 
                className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </motion.div>
              <CardTitle className="text-2xl">Application installée ! 🎉</CardTitle>
              <CardDescription className="text-base mt-2">
                Vous utilisez Djassa en mode application. Profitez de l'expérience complète sans barre d'URL !
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => navigate('/')} className="w-full" size="lg">
                Continuer vers Djassa
              </Button>
              <p className="text-xs text-muted-foreground">
                L'icône Djassa est maintenant sur votre écran d'accueil
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-safe-nav">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b safe-area-top">
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
          <motion.div 
            className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-primary/10 flex items-center justify-center shadow-lg overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img 
              src="/favicon.png" 
              alt="Djassa" 
              className="w-16 h-16 rounded-2xl object-cover" 
            />
          </motion.div>
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
            { icon: Smartphone, text: "Accès rapide depuis l'écran d'accueil", color: "text-blue-500" },
            { icon: Download, text: "Fonctionne même hors connexion", color: "text-green-500" },
            { icon: Check, text: "Expérience plein écran native", color: "text-purple-500" },
            { icon: RefreshCw, text: "Mises à jour automatiques", color: "text-orange-500" }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {installError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{installError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Install Button - Always show for Android/Desktop if installable, or for iOS */}
        {(isInstallable || isIOS) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6"
          >
            <Button 
              onClick={handleInstallClick} 
              className="w-full h-14 text-lg font-semibold shadow-lg"
              size="lg"
              disabled={isInstalling}
            >
              {isInstalling ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Installation en cours...
                </>
              ) : isIOS ? (
                <>
                  <Share className="mr-2 h-5 w-5" />
                  Comment installer sur iPhone
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Installer l'application
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {isIOS ? "Suivez les instructions simples" : "Installation rapide, moins de 1 Mo"}
            </p>
          </motion.div>
        )}

        {/* iOS Instructions - Only show inline if button not shown */}
        {isIOS && !isInstallable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  Installation sur iPhone/iPad
                </CardTitle>
                <CardDescription>
                  Suivez ces 3 étapes simples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={openIOSOverlay} 
                  className="w-full"
                  size="lg"
                >
                  <Share className="mr-2 h-5 w-5" />
                  Voir les instructions
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Android Instructions (fallback when no prompt) */}
        {isAndroid && !isInstallable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  Installation sur Android
                </CardTitle>
                <CardDescription>
                  Utilisez Chrome pour une meilleure expérience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <motion.div 
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Ouvrez le menu du navigateur</p>
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-muted rounded-lg">
                      <MoreVertical className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">Les 3 points en haut à droite</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Appuyez sur</p>
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-muted rounded-lg">
                      <Download className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">"Installer l'application"</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Confirmez l'installation</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      L'icône Djassa apparaîtra sur votre écran d'accueil
                    </p>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Desktop Instructions */}
        {isDesktop && !isInstallable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-white" />
                  </div>
                  Installation sur Ordinateur
                </CardTitle>
                <CardDescription>
                  Chrome, Edge ou navigateur compatible
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Cliquez sur l'icône d'installation</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dans la barre d'adresse (icône +) ou menu ⋮ → "Installer Djassa"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Confirmez l'installation</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      L'application s'ouvrira dans sa propre fenêtre
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Continue without installing */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground">
            Continuer sur le site web
          </Button>
        </motion.div>
      </main>

      {/* iOS Install Overlay */}
      <IOSInstallOverlay isOpen={showIOSOverlay} onClose={closeIOSOverlay} />
    </div>
  );
};

export default InstallApp;
