import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IOSInstallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const IOSInstallOverlay = ({ isOpen, onClose }: IOSInstallOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-card rounded-t-3xl shadow-2xl pb-safe"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted rounded-full" />
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="px-6 pb-8 pt-2">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/favicon.png" 
                    alt="Djassa" 
                    className="w-12 h-12 rounded-xl object-cover" 
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Installer Djassa</h2>
                  <p className="text-sm text-muted-foreground">Sur votre écran d'accueil</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4 mb-6">
                <motion.div 
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Appuyez sur le bouton Partager</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Share className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">En bas de l'écran Safari</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Sélectionnez</p>
                    <div className="flex items-center gap-2 mt-1 px-3 py-1.5 bg-background rounded-lg inline-flex">
                      <Plus className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">"Sur l'écran d'accueil"</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Appuyez sur "Ajouter"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      L'icône apparaîtra sur votre écran d'accueil
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Action */}
              <Button 
                onClick={onClose} 
                variant="outline" 
                className="w-full h-12"
              >
                J'ai compris
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IOSInstallOverlay;
