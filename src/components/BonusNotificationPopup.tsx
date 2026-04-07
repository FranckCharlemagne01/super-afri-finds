import { useEffect, useState, useCallback, useRef } from 'react';
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

/* ── tiny confetti canvas ── */
const ConfettiCanvas = ({ active }: { active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const colors = ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444'];
    const pieces: { x: number; y: number; w: number; h: number; color: string; vy: number; vx: number; rot: number; rv: number }[] = [];

    for (let i = 0; i < 60; i++) {
      pieces.push({
        x: Math.random() * canvas.offsetWidth,
        y: -10 - Math.random() * 80,
        w: 4 + Math.random() * 4,
        h: 8 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: 1.5 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 2,
        rot: Math.random() * 360,
        rv: (Math.random() - 0.5) * 8,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      let alive = false;
      for (const p of pieces) {
        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.rv;
        if (p.y < canvas.offsetHeight + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export const BonusNotificationPopup = () => {
  const { userId } = useStableAuth();
  const [bonus, setBonus] = useState<BonusInfo | null>(null);
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (bonus) markBonusSeen(bonus.id);
  }, [bonus]);

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

    const timer = setTimeout(check, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [userId]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(dismiss, 8000);
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
          <motion.div
            key="bonus-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4"
            onClick={dismiss}
          >
            <motion.div
              key="bonus-card"
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Confetti overlay */}
              <ConfettiCanvas active={visible} />

              {/* Gradient header */}
              <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 p-6 text-center text-white relative overflow-hidden">
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

                <button
                  onClick={dismiss}
                  className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors z-20"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-3 relative z-20"
                >
                  <Gift className="w-8 h-8" />
                </motion.div>

                <h2 className="text-xl font-bold mb-1 relative z-20">✨ Bonne nouvelle !</h2>
                <p className="text-sm opacity-90 relative z-20">
                  Vous avez reçu un bonus Djassa 🎁
                </p>
              </div>

              {/* Body */}
              <div className="bg-background p-5 text-center space-y-3 relative z-20">
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