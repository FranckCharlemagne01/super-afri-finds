import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CreditCard, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionExpiredBannerProps {
  userEmail: string;
  userId: string;
  onSubscriptionSuccess?: () => void;
  dismissable?: boolean;
}

export const SubscriptionExpiredBanner = ({ 
  userEmail, 
  userId, 
  onSubscriptionSuccess,
  dismissable = false,
  isInTrial = false
}: SubscriptionExpiredBannerProps & { isInTrial?: boolean }) => {
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  // Ne pas afficher pendant la période d'essai
  if (dismissed || isInTrial) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('subscription-payment', {
        body: {
          action: 'initialize',
          user_id: userId,
          email: userEmail,
        }
      });

      if (error) throw error;

      if (data?.success && data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data?.error || 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4 shadow-md"
    >
      {dismissable && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm md:text-base">
              Votre abonnement a expiré
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5 leading-relaxed">
              Vous pouvez consulter votre tableau de bord, mais la publication et la modification de produits sont temporairement désactivées.
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleSubscribe}
          disabled={loading}
          size="sm"
          className="w-full sm:w-auto gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg flex-shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Renouveler
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};