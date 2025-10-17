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

  // Couleurs selon l'urgence
  const urgencyColors = {
    high: 'text-red-600 dark:text-red-400',
    medium: 'text-orange-600 dark:text-orange-400',
    low: 'text-green-600 dark:text-green-400'
  };

  // Icône selon l'urgence
  const IconComponent = urgencyLevel === 'low' ? Clock : Flame;
  const iconAnimation = urgencyLevel === 'high' ? 'animate-pulse' : '';

  return (
    <div className={`flex items-center gap-1.5 py-2 ${className}`}>
      <IconComponent className={`w-4 h-4 ${urgencyColors[urgencyLevel]} ${iconAnimation}`} />
      <span className={`font-semibold text-xs ${urgencyColors[urgencyLevel]}`}>
        {endTime 
          ? timeLeft 
          : timeLeft === 'date' 
            ? `Expire le ${expiryDateFormatted}`
            : `Expire dans ${timeLeft}`
        }
      </span>
    </div>
  );
};
