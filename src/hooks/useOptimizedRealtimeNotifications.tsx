import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';
import { debounce } from '@/utils/performance';

interface NotificationCounts {
  unreadMessages: number;
  newOrders: number;
  cartItems: number;
  favoriteItems: number;
}

/**
 * Optimized realtime notifications hook with debouncing and efficient updates
 * Prevents excessive re-renders and API calls
 */
export const useOptimizedRealtimeNotifications = () => {
  const { userId } = useStableAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    newOrders: 0,
    cartItems: 0,
    favoriteItems: 0
  });
  
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Debounced fetch to prevent excessive API calls
  const fetchCounts = useCallback(async () => {
    if (!userId || isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    
    try {
      // Batch all queries together for efficiency
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

      if (!mountedRef.current) return;

      const cartTotal = cartResult.data?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      setCounts({
        unreadMessages: messagesResult.count || 0,
        newOrders: ordersResult.count || 0,
        cartItems: cartTotal,
        favoriteItems: favoritesResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [userId]);

  // Debounced version - prevents rapid consecutive calls
  const debouncedFetchCounts = useCallback(
    debounce(fetchCounts, 300),
    [fetchCounts]
  );

  useEffect(() => {
    mountedRef.current = true;
    
    if (!userId) {
      setCounts({
        unreadMessages: 0,
        newOrders: 0,
        cartItems: 0,
        favoriteItems: 0
      });
      return;
    }

    // Initial fetch
    fetchCounts();

    // Setup realtime subscriptions with debounced handlers
    const messageChannel = supabase
      .channel(`realtime-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        () => debouncedFetchCounts()
      )
      .subscribe();

    const orderChannel = supabase
      .channel(`realtime-orders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${userId}`
        },
        () => debouncedFetchCounts()
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
        () => debouncedFetchCounts()
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
        () => debouncedFetchCounts()
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(cartChannel);
      supabase.removeChannel(favoritesChannel);
    };
  }, [userId, fetchCounts, debouncedFetchCounts]);

  return {
    ...counts,
    refreshCounts: fetchCounts
  };
};
