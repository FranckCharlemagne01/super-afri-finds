import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';

/**
 * Hook to trigger push notifications on important events
 * Listens to realtime changes and sends notifications via edge function
 */
export const useNotificationTriggers = () => {
  const { userId } = useStableAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!userId) return;

    mountedRef.current = true;

    // Listen for new orders (for sellers)
    const ordersChannel = supabase
      .channel('notification-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${userId}`
        },
        async (payload) => {
          if (!mountedRef.current) return;
          
          const order = payload.new as any;
          console.log('[Notifications] New order received:', order.id);
          
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                user_id: userId,
                title: '🛒 Nouvelle commande !',
                body: `${order.customer_name} a commandé ${order.product_title}`,
                url: '/seller',
                tag: 'new-order'
              }
            });
          } catch (error) {
            console.error('[Notifications] Failed to send order notification:', error);
          }
        }
      )
      .subscribe();

    // Listen for order status changes (for buyers)
    const orderStatusChannel = supabase
      .channel('notification-order-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${userId}`
        },
        async (payload) => {
          if (!mountedRef.current) return;
          
          const order = payload.new as any;
          const oldOrder = payload.old as any;
          
          // Only notify on status change
          if (order.status === oldOrder.status) return;
          
          console.log('[Notifications] Order status changed:', order.id, order.status);
          
          const statusMessages: Record<string, string> = {
            confirmed: '✅ Votre commande a été confirmée',
            shipped: '🚚 Votre commande a été expédiée',
            delivered: '📦 Votre commande a été livrée',
            cancelled: '❌ Votre commande a été annulée'
          };
          
          const message = statusMessages[order.status];
          if (!message) return;
          
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                user_id: userId,
                title: 'Mise à jour de commande',
                body: `${message} - ${order.product_title}`,
                url: '/my-orders',
                tag: 'order-status'
              }
            });
          } catch (error) {
            console.error('[Notifications] Failed to send status notification:', error);
          }
        }
      )
      .subscribe();

    // Listen for new messages
    const messagesChannel = supabase
      .channel('notification-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        async (payload) => {
          if (!mountedRef.current) return;
          
          const message = payload.new as any;
          console.log('[Notifications] New message received:', message.id);
          
          // Don't notify for own messages
          if (message.sender_id === userId) return;
          
          try {
            // Get sender info
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', message.sender_id)
              .single();
            
            const senderName = senderProfile?.full_name || 'Quelqu\'un';
            
            await supabase.functions.invoke('send-push-notification', {
              body: {
                user_id: userId,
                title: '💬 Nouveau message',
                body: `${senderName}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
                url: '/messages',
                tag: 'new-message'
              }
            });
          } catch (error) {
            console.error('[Notifications] Failed to send message notification:', error);
          }
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(orderStatusChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [userId]);
};
