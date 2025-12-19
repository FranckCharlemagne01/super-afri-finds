import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';

/**
 * Hook to trigger push + in-app notifications on important events
 * Listens to realtime changes and creates notifications
 */
export const useNotificationTriggers = () => {
  const { userId } = useStableAuth();
  const mountedRef = useRef(true);

  // Helper to create in-app notification
  const createInAppNotification = async (
    targetUserId: string,
    type: string,
    title: string,
    message: string,
    link?: string
  ) => {
    try {
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        type,
        title,
        message,
        link,
        is_read: false
      });
    } catch (error) {
      console.error('[Notifications] Failed to create in-app notification:', error);
    }
  };

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
          
          const title = 'Nouvelle commande !';
          const body = `${order.customer_name} a commandé ${order.product_title}`;
          
          // Create in-app notification
          await createInAppNotification(
            userId,
            'new_order',
            title,
            body,
            '/seller-dashboard'
          );
          
          // Send push notification
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                user_id: userId,
                title: `🛒 ${title}`,
                body,
                url: '/seller-dashboard',
                tag: 'new-order'
              }
            });
          } catch (error) {
            console.error('[Notifications] Failed to send order push:', error);
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
          
          const statusConfig: Record<string, { title: string; emoji: string; type: string }> = {
            confirmed: { title: 'Commande confirmée', emoji: '✅', type: 'order_status' },
            shipped: { title: 'Commande expédiée', emoji: '🚚', type: 'order_shipped' },
            delivered: { title: 'Commande livrée', emoji: '📦', type: 'order_delivered' },
            cancelled: { title: 'Commande annulée', emoji: '❌', type: 'order_status' }
          };
          
          const config = statusConfig[order.status];
          if (!config) return;
          
          const message = `${order.product_title} - ${config.title}`;
          
          // Create in-app notification
          await createInAppNotification(
            userId,
            config.type,
            config.title,
            message,
            '/my-orders'
          );
          
          // Send push notification
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                user_id: userId,
                title: `${config.emoji} ${config.title}`,
                body: message,
                url: '/my-orders',
                tag: 'order-status'
              }
            });
          } catch (error) {
            console.error('[Notifications] Failed to send status push:', error);
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
            const title = 'Nouveau message';
            const body = `${senderName}: ${message.content.substring(0, 80)}${message.content.length > 80 ? '...' : ''}`;
            
            // Create in-app notification
            await createInAppNotification(
              userId,
              'new_message',
              title,
              body,
              '/messages'
            );
            
            // Send push notification
            await supabase.functions.invoke('send-push-notification', {
              body: {
                user_id: userId,
                title: `💬 ${title}`,
                body,
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
