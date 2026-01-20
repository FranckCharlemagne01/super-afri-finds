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
      // Batch all queries for efficiency + use count/head to minimize payload
      const [messagesResult, ordersResult, cartResult, favoritesResult] = await Promise.all([
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .eq('is_read', false),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', userId)
          .eq('status', 'pending'),
        supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', userId),
        supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
      ]);

      const cartTotal = cartResult.data?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      setCounts({
        unreadMessages: messagesResult.count || 0,
        newOrders: ordersResult.count || 0,
        cartItems: cartTotal,
        favoriteItems: favoritesResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchCounts();

    // Configuration des abonnements temps réel
    // 🔹 Messages: INSERT (nouveau) + UPDATE (lecture)
    const messageChannel = supabase
      .channel(`realtime-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        () => fetchCounts()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          const updated = payload.new as { is_read?: boolean };
          if (updated.is_read === true) {
            fetchCounts();
          }
        }
      )
      .subscribe();

    // 🔹 Orders: INSERT (nouvelle commande) + UPDATE (statut change -> plus "pending")
    const orderChannel = supabase
      .channel(`realtime-orders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${userId}`
        },
        () => fetchCounts()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${userId}`
        },
        () => fetchCounts()
      )
      .subscribe();

    const cartChannel = supabase
      .channel(`realtime-cart-${userId}`)
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
      .channel(`realtime-favorites-${userId}`)
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