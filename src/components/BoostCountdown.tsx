import { useEffect, useState, useMemo } from 'react';
import { Flame, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BoostCountdownProps {
  boostedUntil: string;
  onExpire?: () => void;
  compact?: boolean;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export const BoostCountdown = ({ 
  boostedUntil, 
  onExpire,
  compact = false,
  className = ''
}: BoostCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(boostedUntil).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        if (onExpire) onExpire();
        return;
      }

      const totalSeconds = Math.floor(difference / 1000);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, totalSeconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [boostedUntil, onExpire]);

  // Déterminer le niveau d'urgence basé sur le temps restant
  const urgencyLevel = useMemo(() => {
    if (!timeLeft) return 'expired';
    const totalHours = timeLeft.totalSeconds / 3600;
    if (totalHours <= 1) return 'critical'; // Dernière heure
    if (totalHours <= 6) return 'high';
    if (totalHours <= 24) return 'medium';
    return 'low';
  }, [timeLeft]);

  // Si expiré, ne rien afficher
  if (isExpired || !timeLeft) {
    return null;
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  // Version compacte pour les cartes produits
  if (compact) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-1.5 ${className}`}
      >
        <div className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
          ${urgencyLevel === 'critical' 
            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
            : urgencyLevel === 'high'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
              : 'bg-gradient-to-r from-amber-500/90 to-yellow-500/90 text-white'
          }
          shadow-md
        `}>
          <motion.div
            animate={urgencyLevel === 'critical' ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {urgencyLevel === 'critical' || urgencyLevel === 'high' ? (
              <Flame className="w-3.5 h-3.5" />
            ) : (
              <Timer className="w-3.5 h-3.5" />
            )}
          </motion.div>
          
          {/* Chrono digital style avec jours */}
          <div className="flex items-center font-mono text-xs font-bold tracking-tight">
            {timeLeft.days > 0 && (
              <>
                <span>{formatNumber(timeLeft.days)}j</span>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="mx-0.5"
                >:</motion.span>
              </>
            )}
            <span>{formatNumber(timeLeft.hours)}h</span>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mx-0.5"
            >:</motion.span>
            <span>{formatNumber(timeLeft.minutes)}m</span>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mx-0.5"
            >:</motion.span>
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {formatNumber(timeLeft.seconds)}s
            </motion.span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Version complète pour la page détail produit
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-3 ${className}`}
    >
      {/* Label avec icône */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={urgencyLevel === 'critical' ? { 
            scale: [1, 1.15, 1],
            rotate: [0, -5, 5, 0]
          } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <Flame className={`w-5 h-5 ${
            urgencyLevel === 'critical' 
              ? 'text-red-500' 
              : urgencyLevel === 'high'
                ? 'text-orange-500'
                : 'text-amber-500'
          }`} />
        </motion.div>
        <span className={`text-sm font-bold uppercase tracking-wide ${
          urgencyLevel === 'critical' 
            ? 'text-red-600 dark:text-red-400' 
            : urgencyLevel === 'high'
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-amber-600 dark:text-amber-400'
        }`}>
          {urgencyLevel === 'critical' ? 'Derniers instants !' : 'Offre limitée'}
        </span>
      </div>

      {/* Timer 24h Chrono Style avec jours */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <AnimatePresence mode="popLayout">
          {/* Jours - uniquement si > 0 */}
          {timeLeft.days > 0 && (
            <>
              <TimeBlock 
                value={formatNumber(timeLeft.days)} 
                label="j" 
                urgency={urgencyLevel}
              />
              <TimeSeparator urgency={urgencyLevel} />
            </>
          )}
          
          {/* Heures */}
          <TimeBlock 
            value={formatNumber(timeLeft.hours)} 
            label="h" 
            urgency={urgencyLevel}
          />
          
          <TimeSeparator urgency={urgencyLevel} />
          
          {/* Minutes */}
          <TimeBlock 
            value={formatNumber(timeLeft.minutes)} 
            label="m" 
            urgency={urgencyLevel}
          />
          
          <TimeSeparator urgency={urgencyLevel} />
          
          {/* Secondes avec animation pulse */}
          <TimeBlock 
            value={formatNumber(timeLeft.seconds)} 
            label="s" 
            urgency={urgencyLevel}
            pulse={urgencyLevel === 'critical' || urgencyLevel === 'high'}
          />
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Composant bloc de temps style 24h Chrono
const TimeBlock = ({ 
  value, 
  label, 
  urgency,
  pulse = false
}: { 
  value: string; 
  label: string; 
  urgency: string;
  pulse?: boolean;
}) => {
  const bgClass = urgency === 'critical' 
    ? 'bg-gradient-to-br from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 shadow-lg shadow-red-500/30'
    : urgency === 'high'
      ? 'bg-gradient-to-br from-orange-600 to-orange-700 dark:from-orange-500 dark:to-orange-600 shadow-lg shadow-orange-500/25'
      : urgency === 'medium'
        ? 'bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-500 dark:to-amber-600 shadow-lg shadow-amber-500/20'
        : 'bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 shadow-lg shadow-gray-500/15';

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className={`${bgClass} rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[48px] sm:min-w-[60px] flex items-center justify-center`}
        animate={pulse ? { 
          boxShadow: [
            '0 4px 15px rgba(239, 68, 68, 0.3)',
            '0 4px 25px rgba(239, 68, 68, 0.5)',
            '0 4px 15px rgba(239, 68, 68, 0.3)'
          ]
        } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <span className="text-white font-black text-xl sm:text-3xl font-mono leading-none tracking-tight">
          {value}
        </span>
      </motion.div>
      <span className="text-xs font-medium text-muted-foreground mt-1">{label}</span>
    </div>
  );
};

// Séparateur animé
const TimeSeparator = ({ urgency }: { urgency: string }) => (
  <motion.span 
    className={`font-black text-xl sm:text-3xl pb-5 ${
      urgency === 'critical' 
        ? 'text-red-500 dark:text-red-400' 
        : urgency === 'high'
          ? 'text-orange-500 dark:text-orange-400'
          : urgency === 'medium'
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-foreground/40'
    }`}
    animate={{ opacity: [1, 0.3, 1] }}
    transition={{ duration: 1, repeat: Infinity }}
  >
    :
  </motion.span>
);
