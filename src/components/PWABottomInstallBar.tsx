import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstallStandalone } from '@/hooks/usePWAInstall';
import IOSInstallOverlay from './IOSInstallOverlay';

/**
 * Barre d'installation PWA discrète en bas de l'écran
 * - Android : déclenche beforeinstallprompt automatiquement
 * - iOS : affiche l'overlay d'instructions
 * - Disparaît si l'app est installée
 * - Réapparaît à chaque session si l'utilisateur ferme (pas de blocage 7 jours)
 */
const PWABottomInstallBar = () => {
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
  
  const [showBar, setShowBar] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Réinitialiser dismissed à chaque nouvelle session (pour reproposer)
  useEffect(() => {
    // Pour Android: on ne persiste PAS le dismiss entre sessions
    // L'utilisateur verra le prompt à chaque visite jusqu'à installation
    const sessionDismissed = sessionStorage.getItem('pwa-bar-dismissed-session');
    if (sessionDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  // Afficher automatiquement après un court délai
  useEffect(() => {
    // Ne pas afficher si déjà installé ou en standalone
    if (isInstalled || isStandalone) {
      console.log('[PWA Bar] Already installed or standalone, hiding bar');
      return;
    }

    // Attendre que le prompt soit disponible (Android) ou détecter iOS
    const checkAndShow = () => {
      const shouldShow = (isInstallable || isIOS) && !dismissed;
      console.log('[PWA Bar] Check:', { isInstallable, isIOS, isAndroid, dismissed, shouldShow });
      
      if (shouldShow) {
        setShowBar(true);
        console.log('[PWA Bar] Showing install bar');
      }
    };

    // Délai court pour Android (2s), plus long pour iOS (3s)
    const delay = isAndroid ? 2000 : 3000;
    const timer = setTimeout(checkAndShow, delay);

    // Écouter si le prompt devient disponible après le premier check
    const handlePromptAvailable = () => {
      console.log('[PWA Bar] Prompt became available');
      if (!dismissed && !isInstalled && !isStandalone) {
        setShowBar(true);
      }
    };

    window.addEventListener('pwa-install-available', handlePromptAvailable);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pwa-install-available', handlePromptAvailable);
    };
  }, [isInstallable, isInstalled, isStandalone, dismissed, isIOS, isAndroid]);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      openIOSOverlay();
      return;
    }

    setIsInstalling(true);
    console.log('[PWA Bar] User clicked install button');
    
    const success = await promptInstall();
    setIsInstalling(false);
    
    if (success) {
      console.log('[PWA Bar] Installation successful');
      setShowBar(false);
      setDismissed(true);
    } else {
      console.log('[PWA Bar] User dismissed or installation failed');
      // Ne pas cacher la barre si l'utilisateur refuse, mais pour cette session
    }
  }, [isIOS, openIOSOverlay, promptInstall]);

  const handleDismiss = useCallback(() => {
    setShowBar(false);
    setDismissed(true);
    // Sauvegarder seulement pour cette session (pas 7 jours)
    // Le prompt réapparaîtra à la prochaine visite
    sessionStorage.setItem('pwa-bar-dismissed-session', 'true');
    console.log('[PWA Bar] User dismissed for this session');
  }, []);

  // Ne pas afficher si déjà installé ou en mode standalone
  if (isInstalled || isStandalone) {
    return <IOSInstallOverlay isOpen={showIOSOverlay} onClose={closeIOSOverlay} />;
  }

  // Sur Android, toujours afficher même si isInstallable est false au début
  // (le prompt peut arriver plus tard)
  if (!isInstallable && !isIOS && !isAndroid) {
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
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary" />
                
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
                  disabled={isInstalling || (!isInstallable && !isIOS)}
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
