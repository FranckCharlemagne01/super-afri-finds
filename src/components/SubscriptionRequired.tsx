import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, CreditCard, CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionRequiredProps {
  userEmail: string;
  userId: string;
  onSubscriptionSuccess?: () => void;
}

export const SubscriptionRequired = ({ 
  userEmail, 
  userId, 
  onSubscriptionSuccess 
}: SubscriptionRequiredProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
        // Redirect to Paystack checkout
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

  const features = [
    "Publier des produits illimités",
    "Gérer vos commandes et messages",
    "Accès au tableau de bord vendeur",
    "Statistiques et analyses",
    "Support prioritaire",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"
            >
              <Lock className="h-8 w-8 text-primary" />
            </motion.div>
            
            <CardTitle className="text-2xl font-bold">
              Votre essai gratuit est terminé
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Activez votre abonnement pour continuer à vendre sur Djassa
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Price section */}
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Abonnement mensuel</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-primary">5 000</span>
                <span className="text-lg text-muted-foreground">XOF</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">par mois</p>
            </div>

            {/* Features list */}
            <div className="space-y-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Payment button */}
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-14 text-lg font-semibold rounded-xl"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Activer mon abonnement
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            {/* Security note */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Paiement sécurisé via Paystack. Votre abonnement sera renouvelé automatiquement chaque mois.
              </p>
            </div>

            {/* Contact support */}
            <p className="text-center text-xs text-muted-foreground">
              Besoin d'aide ? Contactez-nous à{' '}
              <a href="mailto:support@djassa.tech" className="text-primary hover:underline">
                support@djassa.tech
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
