import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface OrderData {
  customerName: string;
  customerPhone: string;
  deliveryLocation: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
  sellerId: string;
}

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createOrder = async (orderData: OrderData) => {
    setLoading(true);
    try {
      // Ensure user is authenticated before creating order
      if (!user) {
        throw new Error('Vous devez être connecté pour passer une commande');
      }

      const totalAmount = orderData.productPrice * orderData.quantity;
      
      const { error } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id, // Secure: Use authenticated user's ID
          customer_name: orderData.customerName,
          customer_phone: orderData.customerPhone,
          delivery_location: orderData.deliveryLocation,
          product_id: orderData.productId,
          product_title: orderData.productTitle,
          product_price: orderData.productPrice,
          quantity: orderData.quantity,
          total_amount: totalAmount,
          seller_id: orderData.sellerId,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Commande créée avec succès!",
        description: "Votre commande a été envoyée au vendeur.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Veuillez réessayer.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrder,
    loading
  };
};