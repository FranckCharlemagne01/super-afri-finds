import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiryDate?: string;
  endTime?: Date;
  onExpire?: () => void;
  compact?: boolean;
  className?: string;
}

export const CountdownTimer = ({ 
  expiryDate, 
  endTime, 
  onExpire,
  compact = false, 
  className = '' 
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = expiryDate ? new Date(expiryDate).getTime() : endTime?.getTime();
      
      if (!expiry) return;
      
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft('Expiré');
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

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
        // Pour le format expiryDate (boost), ne pas afficher les secondes
        if (days > 0) {
          setTimeLeft(compact ? `${days}j ${hours}h` : `${days} jour${days > 1 ? 's' : ''} ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(compact ? `${hours}h ${minutes}m` : `${hours}h ${minutes}m`);
        } else {
          setTimeLeft(compact ? `${minutes}m` : `${minutes} minute${minutes > 1 ? 's' : ''}`);
        }
      }
    };

    calculateTimeLeft();
    // Update every second for real-time countdown
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiryDate, endTime, onExpire, compact]);

  if (!timeLeft || timeLeft === 'Expiré') {
    return null;
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{endTime ? timeLeft : `Expire dans ${timeLeft}`}</span>
    </div>
  );
};
