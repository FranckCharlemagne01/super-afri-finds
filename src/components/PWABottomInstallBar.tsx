import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstallStandalone } from '@/hooks/usePWAInstall';
import IOSInstallOverlay from './IOSInstallOverlay';

/**
 * Barre d'installation PWA discrète en bas de l'écran
 * - Android : déclenche beforeinstallprompt
 * - iOS : affiche l'overlay d'instructions
 * - Disparaît si l'app est installée ou si l'utilisateur ferme
 */
const PWABottomInstallBar = () => {
  const { 
    isInstallable, 
    isInstalled, 
    isStandalone, 
    isIOS,
    promptInstall,
    showIOSOverlay,
    openIOSOverlay,
    closeIOSOverlay
  } = usePWAInstallStandalone();
  
  const [showBar, setShowBar] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a fermé la barre récemment (7 jours)
    const dismissedAt = localStorage.getItem('pwa-bottom-bar-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
        return;
      }
    }

    // Afficher après 3 secondes de navigation
    const timer = setTimeout(() => {
      const shouldShow = (isInstallable || isIOS) && !isInstalled && !isStandalone && !dismissed;
      if (shouldShow) {
        setShowBar(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isStandalone, dismissed, isIOS]);

  const handleInstall = async () => {
    if (isIOS) {
      openIOSOverlay();
      return;
    }

    setIsInstalling(true);
    const success = await promptInstall();
    setIsInstalling(false);
    
    if (success) {
      setShowBar(false);
    }
  };

  const handleDismiss = () => {
    setShowBar(false);
    setDismissed(true);
    localStorage.setItem('pwa-bottom-bar-dismissed', Date.now().toString());
  };

  // Ne pas afficher si déjà installé ou fermé
  if (isInstalled || isStandalone || dismissed) {
    return <IOSInstallOverlay isOpen={showIOSOverlay} onClose={closeIOSOverlay} />;
  }

  // Ne pas afficher si ni installable ni iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 left-0 right-0 z-40 px-3 md:bottom-4"
          >
            <div className="mx-auto max-w-lg">
              <div className="bg-card border shadow-xl rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
                {/* Gradient décoratif */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-orange-500 to-primary" />
                
                {/* Icône app */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <img 
                    src="/favicon.png" 
                    alt="Djassa" 
                    className="w-7 h-7 rounded-lg"
                  />
                </div>

                {/* Texte */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    Installer Djassa
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Accès rapide depuis l'écran d'accueil
                  </p>
                </div>

                {/* Bouton installer */}
                <Button
                  onClick={handleInstall}
                  size="sm"
                  disabled={isInstalling}
                  className="h-8 px-3 shrink-0"
                >
                  {isInstalling ? (
                    <span className="animate-pulse text-xs">...</span>
                  ) : isIOS ? (
                    <>
                      <Share className="w-3.5 h-3.5 mr-1" />
                      <span className="text-xs">Installer</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 mr-1" />
                      <span className="text-xs">Installer</span>
                    </>
                  )}
                </Button>

                {/* Bouton fermer */}
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors shrink-0"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Install Overlay */}
      <IOSInstallOverlay isOpen={showIOSOverlay} onClose={closeIOSOverlay} />
    </>
  );
};

export default PWABottomInstallBar;
