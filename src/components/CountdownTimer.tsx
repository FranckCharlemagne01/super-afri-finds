import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

interface CountdownTimerProps {
  expiryDate?: string;
  endTime?: Date;
  boostedAt?: string;
  onExpire?: () => void;
  compact?: boolean;
  className?: string;
  showProgressBar?: boolean;
}

export const CountdownTimer = ({ 
  expiryDate, 
  endTime,
  boostedAt,
  onExpire,
  compact = false, 
  className = '',
  showProgressBar = false
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<'high' | 'medium' | 'low'>('low');
  const [progressPercentage, setProgressPercentage] = useState<number>(100);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = expiryDate ? new Date(expiryDate).getTime() : endTime?.getTime();
      
      if (!expiry) {
        return;
      }
      
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft('Expiré');
        setProgressPercentage(0);
        if (onExpire) onExpire();
        return;
      }

      // Calculer le pourcentage de progression
      if (boostedAt && showProgressBar) {
        const startTime = new Date(boostedAt).getTime();
        const totalDuration = expiry - startTime;
        const elapsed = now - startTime;
        const percentage = Math.max(0, Math.min(100, ((totalDuration - elapsed) / totalDuration) * 100));
        setProgressPercentage(percentage);
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Déterminer le niveau d'urgence
      const totalHours = difference / (1000 * 60 * 60);
      if (totalHours <= 6) {
        setUrgencyLevel('high');
      } else if (totalHours <= 24) {
        setUrgencyLevel('medium');
      } else {
        setUrgencyLevel('low');
      }

      // Pour le format endTime (HeroSection), afficher les secondes
      if (endTime) {
        if (days > 0) {
          setTimeLeft(`${days}j ${hours}h ${minutes}m ${seconds}s`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      } else {
        // Pour le format expiryDate (boost), afficher un format lisible
        if (days > 0) {
          setTimeLeft(`${days}j ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiryDate, endTime, boostedAt, onExpire, compact, showProgressBar]);

  if (timeLeft === 'Expiré') {
    return null;
  }

  if (!timeLeft) {
    return null;
  }

  // Couleurs selon l'urgence
  const urgencyColors = {
    high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800',
    medium: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800',
    low: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800'
  };

  const progressColors = {
    high: 'bg-red-500 dark:bg-red-600',
    medium: 'bg-orange-500 dark:bg-orange-600',
    low: 'bg-green-500 dark:bg-green-600'
  };

  const iconAnimation = urgencyLevel === 'high' ? 'animate-pulse' : '';

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-all duration-300 ${urgencyColors[urgencyLevel]}`}>
        <Flame className={`w-4 h-4 ${iconAnimation}`} />
        <span className="font-bold text-xs whitespace-nowrap">
          {endTime ? timeLeft : `Expire dans ${timeLeft}`}
        </span>
      </div>
      
      {showProgressBar && (
        <div className="w-full px-1">
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-linear ${progressColors[urgencyLevel]}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className={`text-xs font-semibold text-center mt-0.5 ${urgencyLevel === 'high' ? 'text-red-600 dark:text-red-400' : urgencyLevel === 'medium' ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
            {Math.round(progressPercentage)}%
          </div>
        </div>
      )}
    </div>
  );
};
