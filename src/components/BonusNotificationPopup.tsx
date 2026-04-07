import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';
import { Gift, X, Rocket, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BonusInfo {
  id: string;
  expires_at: string;
  max_products: number;
}

const SEEN_KEY = 'djassa_seen_bonuses';

const getSeenBonuses = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
};

const markBonusSeen = (id: string) => {
  const seen = getSeenBonuses();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  }
};

export const BonusNotificationPopup = () => {
  const { userId } = useStableAuth();
  const [bonus, setBonus] = useState<BonusInfo | null>(null);
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (bonus) markBonusSeen(bonus.id);
  }, [bonus]);

  // Check for unseen bonuses on mount / when userId changes
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const check = async () => {
      const { data, error } = await supabase
        .from('publication_bonus')
        .select('id, expires_at, max_products')
        .eq('seller_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !data || cancelled) return;

      const seen = getSeenBonuses();
      const unseen = data.find((b) => !seen.includes(b.id));

      if (unseen && !cancelled) {
        setBonus(unseen as BonusInfo);
        setVisible(true);
      }
    };

    // Small delay so the app finishes rendering first
    const timer = setTimeout(check, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [userId]);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(dismiss, 6000);
    return () => clearTimeout(t);
  }, [visible, dismiss]);

  const formattedDate = bonus
    ? new Date(bonus.expires_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  return (
    <AnimatePresence>
      {visible && bonus && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bonus-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4"
            onClick={dismiss}
          >
            {/* Card */}
            <motion.div
              key="bonus-card"
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Gradient header */}
              <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 p-6 text-center text-white relative overflow-hidden">
                {/* Floating sparkle decorations */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-4 -right-4 opacity-20"
                >
                  <Sparkles className="w-20 h-20" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute -bottom-4 -left-4 opacity-20"
                >
                  <Sparkles className="w-16 h-16" />
                </motion.div>

                {/* Close button */}
                <button
                  onClick={dismiss}
                  className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Bouncing gift icon */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-3"
                >
                  <Gift className="w-8 h-8" />
                </motion.div>

                <h2 className="text-xl font-bold mb-1">✨ Bonne nouvelle !</h2>
                <p className="text-sm opacity-90">
                  Vous avez reçu un bonus Djassa 🎁
                </p>
              </div>

              {/* Body */}
              <div className="bg-background p-5 text-center space-y-3">
                <p className="text-sm text-foreground font-medium flex items-center justify-center gap-2">
                  <Rocket className="w-4 h-4 text-orange-500" />
                  Publiez vos produits gratuitement dès maintenant
                </p>

                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 dark:bg-orange-950/30 px-4 py-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
                  ⏳ Valable jusqu'au {formattedDate}
                </div>

                <p className="text-xs text-muted-foreground">
                  {bonus.max_products} publication{bonus.max_products > 1 ? 's' : ''} offerte{bonus.max_products > 1 ? 's' : ''}
                </p>

                <button
                  onClick={dismiss}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-shadow"
                >
                  🎉 Super, merci !
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
