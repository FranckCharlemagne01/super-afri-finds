import { Clock, Gift, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrialBannerProps {
  daysLeft: number;
  trialEndDate: Date | null;
}

export const TrialBanner = ({ daysLeft, trialEndDate }: TrialBannerProps) => {
  const isUrgent = daysLeft <= 7;
  const isCritical = daysLeft <= 3;

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full rounded-xl p-4 mb-4 ${
        isCritical 
          ? 'bg-destructive/10 border border-destructive/30' 
          : isUrgent 
            ? 'bg-orange-500/10 border border-orange-500/30'
            : 'bg-primary/10 border border-primary/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isCritical 
            ? 'bg-destructive/20' 
            : isUrgent 
              ? 'bg-orange-500/20'
              : 'bg-primary/20'
        }`}>
          {isCritical ? (
            <AlertTriangle className={`h-5 w-5 text-destructive`} />
          ) : isUrgent ? (
            <Clock className={`h-5 w-5 text-orange-500`} />
          ) : (
            <Gift className={`h-5 w-5 text-primary`} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${
            isCritical 
              ? 'text-destructive' 
              : isUrgent 
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-primary'
          }`}>
            {isCritical 
              ? `⚠️ Plus que ${daysLeft} jour${daysLeft > 1 ? 's' : ''} d'essai !`
              : isUrgent 
                ? `${daysLeft} jours d'essai restants`
                : `🎁 ${daysLeft} jours d'essai gratuit`
            }
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {trialEndDate && `Expire le ${formatDate(trialEndDate)}`}
          </p>
        </div>

        {daysLeft > 0 && (
          <div className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
            isCritical 
              ? 'bg-destructive text-destructive-foreground' 
              : isUrgent 
                ? 'bg-orange-500 text-white'
                : 'bg-primary text-primary-foreground'
          }`}>
            {daysLeft}J
          </div>
        )}
      </div>
    </motion.div>
  );
};
