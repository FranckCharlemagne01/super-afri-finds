import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfflineIndicatorProps {
  isOffline: boolean;
  onRetry?: () => void;
}

/**
 * Native-style offline indicator for iOS App Store compliance
 * Shows when device loses network connectivity
 */
export const OfflineIndicator = ({ isOffline, onRetry }: OfflineIndicatorProps) => {
  if (!isOffline) return null;

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center justify-center px-8 text-center max-w-sm">
            {/* Offline icon with animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6"
            >
              <WifiOff className="w-12 h-12 text-muted-foreground" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-semibold text-foreground mb-2"
            >
              Pas de connexion
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-8"
            >
              Vérifiez votre connexion internet et réessayez pour accéder à Djassa Marketplace.
            </motion.p>

            {/* Retry button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={onRetry || (() => window.location.reload())}
                className="gap-2"
                size="lg"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </Button>
            </motion.div>

            {/* Subtle branding */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute bottom-8 text-xs text-muted-foreground/50"
            >
              Djassa Marketplace
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
