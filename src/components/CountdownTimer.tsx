import { useEffect, useState } from 'react';
import { Clock, Flame } from 'lucide-react';

interface CountdownTimerProps {
  expiryDate?: string;
  endTime?: Date;
  boostedAt?: string;
  onExpire?: () => void;
  compact?: boolean;
  className?: string;
}

export const CountdownTimer = ({ 
  expiryDate, 
  endTime,
  boostedAt,
  onExpire,
  compact = false, 
  className = ''
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<'high' | 'medium' | 'low'>('low');
  const [expiryDateFormatted, setExpiryDateFormatted] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = expiryDate ? new Date(expiryDate).getTime() : endTime?.getTime();
      
      if (!expiry) {
        return;
      }
      
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft('Offre expirée');
        if (onExpire) onExpire();
        return;
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

      // Format pour HeroSection (avec secondes)
      if (endTime) {
        if (days > 0) {
          setTimeLeft(`${days}j ${hours}h ${minutes}m ${seconds}s`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      } else {
        // Format pour produits boostés
        if (totalHours > 24) {
          // Plus de 24h : afficher la date complète
          const expiryDateObj = new Date(expiry);
          const options: Intl.DateTimeFormatOptions = { 
            day: 'numeric', 
            month: 'long', 
            hour: '2-digit', 
            minute: '2-digit' 
          };
          setExpiryDateFormatted(expiryDateObj.toLocaleDateString('fr-FR', options));
          setTimeLeft('date');
        } else {
          // Moins de 24h : afficher le temps restant
          if (hours > 0) {
            setTimeLeft(`${hours}h ${minutes}min`);
          } else {
            setTimeLeft(`${minutes}min`);
          }
        }
      }
    };

    calculateTimeLeft();
    // Mise à jour toutes les 60 secondes pour les produits boostés, 1s pour les autres
    const interval = setInterval(calculateTimeLeft, endTime ? 1000 : 60000);

    return () => clearInterval(interval);
  }, [expiryDate, endTime, boostedAt, onExpire, compact]);

  if (timeLeft === 'Offre expirée') {
    return null;
  }

  if (!timeLeft) {
    return null;
  }

  // Parse le temps restant pour extraire heures, minutes, secondes
  const parseTime = (timeString: string) => {
    if (timeString === 'date') return null;
    
    const match = timeString.match(/(?:(\d+)j\s*)?(?:(\d+)h\s*)?(?:(\d+)m(?:in)?\s*)?(?:(\d+)s)?/);
    if (!match) return null;
    
    const [, days, hours, minutes, seconds] = match;
    const totalHours = (parseInt(days || '0') * 24) + parseInt(hours || '0');
    
    return {
      hours: totalHours.toString().padStart(2, '0'),
      minutes: (minutes || '00').padStart(2, '0'),
      seconds: (seconds || '00').padStart(2, '0')
    };
  };

  const parsedTime = parseTime(timeLeft);

  // Styles selon l'urgence pour le timer 24h chrono
  const urgencyStyles = {
    high: {
      blockBg: 'bg-gradient-to-br from-red-600 to-red-700 dark:from-red-500 dark:to-red-600',
      text: 'text-white',
      glow: 'shadow-xl shadow-red-500/40',
      pulse: 'animate-pulse'
    },
    medium: {
      blockBg: 'bg-gradient-to-br from-orange-600 to-orange-700 dark:from-orange-500 dark:to-orange-600',
      text: 'text-white',
      glow: 'shadow-lg shadow-orange-500/30',
      pulse: ''
    },
    low: {
      blockBg: 'bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800',
      text: 'text-white',
      glow: 'shadow-lg shadow-gray-500/20',
      pulse: ''
    }
  };

  const style = urgencyStyles[urgencyLevel];
  const IconComponent = urgencyLevel === 'high' ? Flame : Clock;

  // Si pas de format parsable, afficher version date
  if (!parsedTime) {
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 bg-muted/50 backdrop-blur-sm transition-all duration-300 ${className}`}>
        <Clock className="w-5 h-5 text-muted-foreground" />
        <span className="font-semibold text-sm text-muted-foreground">
          {timeLeft === 'date' ? `Expire le ${expiryDateFormatted}` : `Expire dans ${timeLeft}`}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Icône et titre */}
      <div className="flex items-center gap-2">
        <IconComponent className={`w-5 h-5 text-red-600 dark:text-red-400 ${urgencyLevel === 'high' ? 'animate-pulse' : ''}`} />
        <span className="font-bold text-sm text-red-600 dark:text-red-400 uppercase tracking-wide">
          Offre limitée
        </span>
      </div>

      {/* Timer style 24h chrono */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Heures */}
        <div className="flex flex-col items-center">
          <div className={`${style.blockBg} ${style.glow} ${style.pulse} rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[50px] sm:min-w-[70px] transition-all duration-300`}>
            <span className={`${style.text} font-black text-2xl sm:text-4xl leading-none tracking-tight`}>
              {parsedTime.hours}
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground mt-1">h</span>
        </div>

        {/* Séparateur */}
        <span className="font-black text-2xl sm:text-4xl text-foreground/50 pb-4">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className={`${style.blockBg} ${style.glow} ${style.pulse} rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[50px] sm:min-w-[70px] transition-all duration-300`}>
            <span className={`${style.text} font-black text-2xl sm:text-4xl leading-none tracking-tight`}>
              {parsedTime.minutes}
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground mt-1">m</span>
        </div>

        {/* Séparateur */}
        <span className="font-black text-2xl sm:text-4xl text-foreground/50 pb-4">:</span>

        {/* Secondes */}
        <div className="flex flex-col items-center">
          <div className={`${style.blockBg} ${style.glow} ${style.pulse} rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[50px] sm:min-w-[70px] transition-all duration-300`}>
            <span className={`${style.text} font-black text-2xl sm:text-4xl leading-none tracking-tight`}>
              {parsedTime.seconds}
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground mt-1">s</span>
        </div>
      </div>
    </div>
  );
};
