import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { sendPushNotification } from '@/utils/pushNotifications';
import { createNotification } from '@/utils/notificationPersistence';

export type PaymentMethod = 'ONLINE' | 'COD';

export interface OrderData {
  customerName: string;
  customerPhone: string;
  deliveryLocation: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
  sellerId: string;
  paymentMethod?: PaymentMethod;
}

export interface CreatedOrder {
  success: boolean;
  orderId?: string;
  totalAmount?: number;
  error?: any;
}

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createOrder = async (orderData: OrderData): Promise<CreatedOrder> => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error('Vous devez être connecté pour passer une commande');
      }

      const totalAmount = orderData.productPrice * orderData.quantity;
      const paymentMethod: PaymentMethod = orderData.paymentMethod || 'COD';

      const { data: inserted, error } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          customer_name: orderData.customerName,
          customer_phone: orderData.customerPhone,
          delivery_location: orderData.deliveryLocation,
          product_id: orderData.productId,
          product_title: orderData.productTitle,
          product_price: orderData.productPrice,
          quantity: orderData.quantity,
          total_amount: totalAmount,
          seller_id: orderData.sellerId,
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: 'pending',
        })
        .select('id')
        .single();

      if (error) throw error;

      const orderId = inserted?.id;

      // Notifier le vendeur uniquement si COD (pour le ONLINE on attend confirmation paiement)
      if (paymentMethod === 'COD') {
        await sendPushNotification(supabase, {
          user_id: orderData.sellerId,
          title: '🛒 Nouvelle commande (paiement à la livraison)',
          body: `${orderData.customerName} a commandé ${orderData.productTitle}`,
          url: '/seller-dashboard',
          tag: 'new_order',
        });

        createNotification({
          userId: orderData.sellerId,
          type: 'new_order',
          title: 'Nouvelle commande (COD)',
          message: `${orderData.customerName} a commandé "${orderData.productTitle}" pour ${totalAmount.toLocaleString()} FCFA — paiement à la livraison`,
          link: '/seller',
        });

        createNotification({
          userId: user.id,
          type: 'order_status',
          title: 'Commande envoyée',
          message: `Votre commande "${orderData.productTitle}" a été envoyée. Paiement à la livraison.`,
          link: '/my-orders',
        });

        toast({
          title: '✅ Commande créée !',
          description: 'Le vendeur va vous contacter pour confirmer.',
        });
      }

      return { success: true, orderId, totalAmount };
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande. Veuillez réessayer.',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marque la commande comme payée après vérification Paystack côté serveur.
   * Notifie le vendeur que le paiement est sécurisé.
   */
  const confirmOnlinePayment = async (params: {
    orderId: string;
    paystackReference: string;
    sellerId: string;
    customerName: string;
    productTitle: string;
    totalAmount: number;
  }): Promise<{ success: boolean; error?: any }> => {
    try {
      // Vérification serveur (l'edge function va valider auprès de Paystack)
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'verify_order_payment',
          order_id: params.orderId,
          reference: params.paystackReference,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Vérification du paiement échouée');

      // Notifications vendeur (paiement sécurisé)
      await sendPushNotification(supabase, {
        user_id: params.sellerId,
        title: '💰 Paiement reçu — commande à livrer',
        body: `${params.customerName} a payé ${params.productTitle} en ligne`,
        url: '/seller-dashboard',
        tag: 'order_paid',
      });

      createNotification({
        userId: params.sellerId,
        type: 'new_order',
        title: 'Commande payée en ligne',
        message: `${params.customerName} a réglé "${params.productTitle}" (${params.totalAmount.toLocaleString()} FCFA). Vous pouvez livrer en toute sécurité.`,
        link: '/seller',
      });

      if (user) {
        createNotification({
          userId: user.id,
          type: 'order_status',
          title: 'Paiement confirmé',
          message: `Votre paiement pour "${params.productTitle}" a été confirmé.`,
          link: '/my-orders',
        });
      }

      toast({
        title: '✅ Paiement confirmé !',
        description: 'Le vendeur a été notifié.',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error confirming online payment:', error);
      toast({
        title: 'Vérification échouée',
        description: error?.message || 'Impossible de confirmer le paiement.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  return {
    createOrder,
    confirmOnlinePayment,
    loading,
  };
};
