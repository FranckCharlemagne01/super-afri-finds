import { useEffect, useState, useMemo } from 'react';
import { Timer } from 'lucide-react';
import { motion } from 'framer-motion';

interface BoostCountdownProps {
  boostedUntil: string;
  onExpire?: () => void;
  compact?: boolean;
  className?: string;
}

interface TimeLeft {
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
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, totalSeconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [boostedUntil, onExpire]);

  const urgencyLevel = useMemo(() => {
    if (!timeLeft) return 'expired';
    const totalHours = timeLeft.totalSeconds / 3600;
    if (totalHours <= 1) return 'critical';
    if (totalHours <= 6) return 'high';
    return 'normal';
  }, [timeLeft]);

  if (isExpired || !timeLeft) {
    return null;
  }

  const pad = (num: number) => num.toString().padStart(2, '0');

  // Compact version for product cards
  if (compact) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center ${className}`}
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground/95 backdrop-blur-sm shadow-lg">
          <Timer className="w-3.5 h-3.5 text-background" />
          <div className="flex items-center gap-0.5 font-mono text-xs font-bold text-background tabular-nums tracking-wide">
            <span>{pad(timeLeft.hours)}h</span>
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mx-0.5"
            >:</motion.span>
            <span>{pad(timeLeft.minutes)}m</span>
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mx-0.5"
            >:</motion.span>
            <motion.span
              animate={urgencyLevel === 'critical' ? { 
                scale: [1, 1.05, 1],
                opacity: [1, 0.8, 1]
              } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {pad(timeLeft.seconds)}s
            </motion.span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Full version for product detail page - Premium 24h Chrono style
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-3 ${className}`}
    >
      {/* Header with icon */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [1, 0.8, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="p-1.5 rounded-full bg-foreground/10"
        >
          <Timer className="w-4 h-4 text-foreground" />
        </motion.div>
        <span className="text-sm font-semibold text-foreground tracking-wide uppercase">
          {urgencyLevel === 'critical' ? '⚡ Derniers instants' : 'Offre limitée'}
        </span>
      </div>

      {/* 24h Chrono Timer - Premium Black Style */}
      <div className="flex items-center gap-2 sm:gap-3">
        <TimeUnit value={pad(timeLeft.hours)} unit="h" urgency={urgencyLevel} />
        <TimeDivider />
        <TimeUnit value={pad(timeLeft.minutes)} unit="m" urgency={urgencyLevel} />
        <TimeDivider />
        <TimeUnit value={pad(timeLeft.seconds)} unit="s" urgency={urgencyLevel} pulse />
      </div>
    </motion.div>
  );
};

// Premium time unit block
const TimeUnit = ({ 
  value, 
  unit,
  urgency,
  pulse = false
}: { 
  value: string; 
  unit: string;
  urgency: string;
  pulse?: boolean;
}) => {
  return (
    <motion.div 
      className="relative flex items-baseline gap-0.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-foreground shadow-xl"
      animate={pulse ? { 
        boxShadow: [
          '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          '0 15px 35px -5px rgba(0, 0, 0, 0.4)',
          '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
        ]
      } : {}}
      transition={{ duration: 1, repeat: Infinity }}
    >
      {/* Glossy effect overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      
      <motion.span 
        className="font-mono font-black text-xl sm:text-2xl text-background tabular-nums tracking-tight"
        animate={pulse ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        {value}
      </motion.span>
      <span className="font-semibold text-sm sm:text-base text-background/80">
        {unit}
      </span>
    </motion.div>
  );
};

// Animated divider
const TimeDivider = () => (
  <motion.span 
    className="font-black text-xl sm:text-2xl text-foreground"
    animate={{ opacity: [1, 0.3, 1] }}
    transition={{ duration: 1, repeat: Infinity }}
  >
    :
  </motion.span>
);
