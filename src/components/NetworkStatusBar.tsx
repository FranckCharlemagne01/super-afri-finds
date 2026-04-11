import { useDeviceContext } from '@/hooks/useDeviceContext';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Unified network status indicator
 * Shows offline/slow connection banners across all platforms
 */
export const NetworkStatusBar = () => {
  const { isOnline, networkQuality } = useDeviceContext();

  const showBanner = !isOnline || networkQuality === 'slow';

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`text-center text-xs font-medium py-1.5 px-3 ${
            !isOnline
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-yellow-500/90 text-white'
          }`}
        >
          {!isOnline ? (
            <span className="flex items-center justify-center gap-1.5">
              <WifiOff className="h-3 w-3" />
              Hors connexion — mode hors-ligne activé
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <Signal className="h-3 w-3" />
              Connexion lente — certaines données sont en cache
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
