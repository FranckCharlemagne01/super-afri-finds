import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';

interface NotificationCounts {
  unreadMessages: number;
  newOrders: number;
  cartItems: number;
  favoriteItems: number;
}

export const useRealtimeNotifications = () => {
  const { userId } = useStableAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    newOrders: 0,
    cartItems: 0,
    favoriteItems: 0
  });

  const fetchCounts = useCallback(async () => {
    if (!userId) return;

    try {
      // Messages non lus
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id')
        .eq('recipient_id', userId)
        .eq('is_read', false);

      // Nouvelles commandes pour les vendeurs
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id')
        .eq('seller_id', userId)
        .eq('status', 'pending');

      // Items dans le panier
      const { data: cartData } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', userId);

      // Items favoris
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId);

      const cartTotal = cartData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      setCounts({
        unreadMessages: messagesData?.length || 0,
        newOrders: ordersData?.length || 0,
        cartItems: cartTotal,
        favoriteItems: favoritesData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchCounts();

    // Configuration des abonnements temps réel
    const messageChannel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        () => fetchCounts()
      )
      .subscribe();

    const orderChannel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${userId}`
        },
        () => fetchCounts()
      )
      .subscribe();

    const cartChannel = supabase
      .channel('realtime-cart')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${userId}`
        },
        () => fetchCounts()
      )
      .subscribe();

    const favoritesChannel = supabase
      .channel('realtime-favorites')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${userId}`
        },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(cartChannel);
      supabase.removeChannel(favoritesChannel);
    };
  }, [userId, fetchCounts]);

  return {
    ...counts,
    refreshCounts: fetchCounts
  };
};