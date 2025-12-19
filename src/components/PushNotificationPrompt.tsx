import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useStableAuth } from '@/hooks/useStableAuth';
import { motion, AnimatePresence } from 'framer-motion';

export const PushNotificationPrompt = () => {
  const { userId } = useStableAuth();
  const { 
    isSupported, 
    isLoading, 
    subscribe, 
    shouldShowPrompt, 
    dismissPrompt 
  } = usePushNotifications();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Only show after user is logged in and after a short delay
    if (userId && shouldShowPrompt() && !isLoading) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000); // Wait 3 seconds before showing
      return () => clearTimeout(timer);
    }
  }, [userId, shouldShowPrompt, isLoading]);

  const handleEnable = async () => {
    setIsSubscribing(true);
    const success = await subscribe();
    setIsSubscribing(false);
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    setIsVisible(false);
  };

  if (!isSupported || !userId) return null;

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
                  <h3 className="font-semibold text-foreground text-lg">
                    Restez informé
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Activez les notifications
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-5">
                Recevez des alertes instantanées pour vos commandes, messages et opportunités importantes.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDismiss}
                  disabled={isSubscribing}
                >
                  Plus tard
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleEnable}
                  disabled={isSubscribing}
                >
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
