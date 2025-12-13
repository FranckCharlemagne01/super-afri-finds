import { useEffect, useState, useMemo } from 'react';
import { Clock } from 'lucide-react';
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
      // Convert everything to hours (no days limit)
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, totalSeconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [boostedUntil, onExpire]);

  // Urgency level based on remaining time
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center ${className}`}
      >
        <div className={`
          flex items-center gap-1.5 px-2 py-1 rounded-lg
          ${urgencyLevel === 'critical' 
            ? 'bg-destructive text-destructive-foreground' 
            : urgencyLevel === 'high'
              ? 'bg-orange-500 text-white'
              : 'bg-primary text-primary-foreground'
          }
          shadow-md backdrop-blur-sm
        `}>
          <Clock className="w-3 h-3" />
          <div className="flex items-center font-mono text-xs font-bold tabular-nums">
            <span>{pad(timeLeft.hours)}</span>
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >:</motion.span>
            <span>{pad(timeLeft.minutes)}</span>
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >:</motion.span>
            <motion.span
              animate={urgencyLevel === 'critical' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {pad(timeLeft.seconds)}
            </motion.span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Full version for product detail page
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-2 ${className}`}
    >
      {/* Label */}
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 ${
          urgencyLevel === 'critical' 
            ? 'text-destructive' 
            : urgencyLevel === 'high'
              ? 'text-orange-500'
              : 'text-primary'
        }`} />
        <span className={`text-sm font-semibold ${
          urgencyLevel === 'critical' 
            ? 'text-destructive' 
            : urgencyLevel === 'high'
              ? 'text-orange-500'
              : 'text-primary'
        }`}>
          {urgencyLevel === 'critical' ? 'Derniers instants !' : 'Offre limitée'}
        </span>
      </div>

      {/* 24h Chrono Timer - HH:MM:SS only */}
      <div className="flex items-center gap-1">
        <TimeBlock value={pad(timeLeft.hours)} urgency={urgencyLevel} />
        <TimeSeparator urgency={urgencyLevel} />
        <TimeBlock value={pad(timeLeft.minutes)} urgency={urgencyLevel} />
        <TimeSeparator urgency={urgencyLevel} />
        <TimeBlock value={pad(timeLeft.seconds)} urgency={urgencyLevel} pulse={urgencyLevel === 'critical'} />
      </div>
    </motion.div>
  );
};

// Time block component - 24h Chrono style
const TimeBlock = ({ 
  value, 
  urgency,
  pulse = false
}: { 
  value: string; 
  urgency: string;
  pulse?: boolean;
}) => {
  const bgClass = urgency === 'critical' 
    ? 'bg-destructive text-destructive-foreground shadow-destructive/30'
    : urgency === 'high'
      ? 'bg-orange-500 text-white shadow-orange-500/25'
      : 'bg-primary text-primary-foreground shadow-primary/20';

  return (
    <motion.div 
      className={`${bgClass} rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-[40px] sm:min-w-[48px] flex items-center justify-center shadow-lg`}
      animate={pulse ? { 
        scale: [1, 1.02, 1],
      } : {}}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <span className="font-mono font-bold text-lg sm:text-xl tabular-nums">
        {value}
      </span>
    </motion.div>
  );
};

// Animated separator
const TimeSeparator = ({ urgency }: { urgency: string }) => (
  <motion.span 
    className={`font-bold text-lg sm:text-xl ${
      urgency === 'critical' 
        ? 'text-destructive' 
        : urgency === 'high'
          ? 'text-orange-500'
          : 'text-primary'
    }`}
    animate={{ opacity: [1, 0.3, 1] }}
    transition={{ duration: 1, repeat: Infinity }}
  >
    :
  </motion.span>
);
