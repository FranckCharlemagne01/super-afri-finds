import { useState, useEffect, useMemo } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useStableAuth } from '@/hooks/useStableAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const isIosSafari = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS && isSafari;
};

const isStandalonePwa = () => {
  // iOS standalone
  // @ts-expect-error - iOS Safari only
  if (typeof window !== 'undefined' && window.navigator?.standalone) return true;
  // Modern browsers
  return window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;
};

export const PushNotificationPrompt = () => {
  const { userId } = useStableAuth();
  const { isSupported, isLoading, subscribe, shouldShowPrompt, dismissPrompt, permission } = usePushNotifications();

  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const iosSafariNeedsInstall = useMemo(() => {
    return userId && isIosSafari() && !isStandalonePwa();
  }, [userId]);

  // 1) Marquer la première interaction utilisateur (clic / scroll) — requis par certains navigateurs
  useEffect(() => {
    const onFirstInteraction = () => setHasUserInteracted(true);

    window.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true });
    window.addEventListener('scroll', onFirstInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
    };
  }, []);

  // 2) iOS Safari: fallback clair (push web uniquement si app ajoutée à l'écran d'accueil)
  useEffect(() => {
    if (!iosSafariNeedsInstall) return;

    toast({
      title: 'Notifications iPhone',
      description: "Sur iPhone Safari, les notifications push nécessitent d'ajouter Djassa à l'écran d'accueil (Partager → Ajouter à l’écran d’accueil).",
      duration: 6000,
    });
  }, [iosSafariNeedsInstall]);

  // 3) Afficher le prompt dès qu'on peut le faire (au lancement OU après interaction)
  useEffect(() => {
    if (!userId) return;
    if (isLoading) return;
    if (!shouldShowPrompt()) return;

    // On attend une interaction si l'utilisateur est sur mobile / certains navigateurs stricts
    // (ceci évite les prompts bloqués et respecte la règle du "user gesture")
    if (!hasUserInteracted) return;

    setIsVisible(true);
  }, [userId, isLoading, shouldShowPrompt, hasUserInteracted]);

  const handleEnable = async () => {
    setIsSubscribing(true);
    const success = await subscribe();
    setIsSubscribing(false);
    if (success) {
      setIsVisible(false);
    } else if (permission === 'denied') {
      toast({
        title: 'Notifications désactivées',
        description: 'Vous pouvez les réactiver dans les réglages de votre navigateur.',
        duration: 5000,
      });
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    setIsVisible(false);
  };

  // iOS Safari (non installée) => on ne montre pas le prompt (pas supporté), mais on a déjà affiché un message clair.
  if (!userId) return null;
  if (iosSafariNeedsInstall) return null;
  if (!isSupported) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:w-96"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header gradient */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

            <div className="p-5">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Icon */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Restez informé</h3>
                  <p className="text-sm text-muted-foreground">Activez les notifications</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-5">
                Recevez des alertes instantanées pour vos commandes, messages et opportunités importantes.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleDismiss} disabled={isSubscribing}>
                  Plus tard
                </Button>
                <Button className="flex-1" onClick={handleEnable} disabled={isSubscribing}>
                  {isSubscribing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Activation...
                    </span>
                  ) : (
                    'Activer'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
