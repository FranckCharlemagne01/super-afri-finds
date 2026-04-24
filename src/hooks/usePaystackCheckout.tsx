import { useCallback } from 'react';
import PaystackPop from '@paystack/inline-js';
import { usePaystackPublicKey } from '@/hooks/usePaystackPublicKey';
import { toast } from '@/hooks/use-toast';

interface OrderCheckoutParams {
  orderId: string;
  email: string;
  amountFcfa: number;
  customerName?: string;
  customerPhone?: string;
  onSuccess: (reference: string) => void;
  onCancel?: () => void;
}

/**
 * Lance le widget Paystack inline pour payer une commande.
 * La référence générée respecte le format `order_<orderId>_<timestamp>`
 * pour pouvoir être tracée côté serveur.
 */
export const usePaystackCheckout = () => {
  const { publicKey, loading: keyLoading, error: keyError } = usePaystackPublicKey();

  const payOrder = useCallback(
    async (params: OrderCheckoutParams) => {
      if (keyLoading) {
        toast({
          title: 'Patientez',
          description: 'Préparation du paiement…',
        });
        return;
      }

      if (!publicKey || keyError) {
        toast({
          title: 'Paiement indisponible',
          description: keyError || 'Configuration Paystack manquante. Contactez l’administrateur.',
          variant: 'destructive',
        });
        return;
      }

      const reference = `order_${params.orderId}_${Date.now()}`;

      try {
        const popup = new PaystackPop();
        popup.newTransaction({
          key: publicKey,
          email: params.email,
          amount: Math.round(params.amountFcfa * 100), // kobo/centimes
          currency: 'XOF',
          reference,
          metadata: {
            order_id: params.orderId,
            customer_name: params.customerName,
            customer_phone: params.customerPhone,
            custom_fields: [
              {
                display_name: 'Commande Djassa',
                variable_name: 'order_id',
                value: params.orderId,
              },
            ],
          },
          onSuccess: (transaction: { reference: string }) => {
            params.onSuccess(transaction.reference);
          },
          onCancel: () => {
            toast({
              title: 'Paiement annulé',
              description: 'Vous pouvez relancer le paiement quand vous le souhaitez.',
            });
            params.onCancel?.();
          },
        });
      } catch (err: any) {
        console.error('Paystack popup error:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible d’ouvrir le module de paiement.',
          variant: 'destructive',
        });
      }
    },
    [publicKey, keyLoading, keyError]
  );

  return { payOrder, ready: !!publicKey && !keyLoading };
};
