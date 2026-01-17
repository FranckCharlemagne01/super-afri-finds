import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstallStandalone } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';
import IOSInstallOverlay from './IOSInstallOverlay';

const PWAInstallPrompt = () => {
  const navigate = useNavigate();
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
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if user dismissed the prompt recently (within 24 hours)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
        return;
      }
    }

    // Show prompt after delay if installable (or iOS) and not dismissed
    const timer = setTimeout(() => {
      // Show for Android/Desktop if installable, or for iOS (since iOS can always "install" via Safari)
      const shouldShow = (isInstallable || isIOS) && !isInstalled && !isStandalone && !dismissed;
      if (shouldShow) {
        setShowPrompt(true);
      }
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isStandalone, dismissed, isIOS]);

  const handleInstall = async () => {
    // For iOS, show the overlay
    if (isIOS) {
      openIOSOverlay();
      setShowPrompt(false);
      return;
    }

    // For Android/Desktop
    setIsInstalling(true);
    const success = await promptInstall();
    setIsInstalling(false);
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleLearnMore = () => {
    setShowPrompt(false);
    navigate('/install');
  };

  // Don't show if already installed or dismissed (but DO show for iOS even if not "installable")
  if (isInstalled || isStandalone || dismissed) {
    return null;
  }

  // Don't show if neither installable nor iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
          >
            <div className="bg-card border shadow-2xl rounded-2xl p-4 relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-orange-500 to-primary" />
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="flex items-start gap-4">
                {/* App icon */}
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <img 
                    src="/favicon.png" 
                    alt="Djassa" 
                    className="w-10 h-10 rounded-xl"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-semibold text-foreground mb-1">
                    Installer Djassa
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Accédez rapidement depuis votre écran d'accueil
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleInstall}
                      size="sm"
                      disabled={isInstalling}
                      className="h-9"
                    >
                      {isInstalling ? (
                        <span className="animate-pulse">Installation...</span>
                      ) : isIOS ? (
                        <>
                          <Share className="w-4 h-4 mr-1.5" />
                          Comment installer
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-1.5" />
                          Installer
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleLearnMore}
                      variant="ghost"
                      size="sm"
                      className="h-9 text-muted-foreground"
                    >
                      En savoir plus
                    </Button>
                  </div>
                </div>
              </div>

              {/* Benefits mini list */}
              <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Plein écran
                </span>
                <span>•</span>
                <span>Hors-ligne</span>
                <span>•</span>
                <span>Gratuit</span>
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

export default PWAInstallPrompt;
