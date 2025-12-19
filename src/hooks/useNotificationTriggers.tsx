import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';

/**
 * Hook to trigger push notifications when new in-app notifications are created
 * Listens to realtime changes on the notifications table and sends push notifications
 */
export const useNotificationTriggers = () => {
  const { userId } = useStableAuth();
  const mountedRef = useRef(true);
  const processedIds = useRef<Set<string>>(new Set());

  // Send push notification via edge function
  const sendPushNotification = async (
    targetUserId: string,
    title: string,
    body: string,
    url?: string,
    type?: string,
    notificationId?: string
  ) => {
    try {
      console.log('[NotificationTriggers] Sending push notification:', { title, targetUserId });
      
      const response = await supabase.functions.invoke('notification-push-sender', {
        body: {
          notification_id: notificationId,
          user_id: targetUserId,
          title,
          body,
          url,
          type
        }
      });

      if (response.error) {
        console.error('[NotificationTriggers] Push notification error:', response.error);
      } else {
        console.log('[NotificationTriggers] Push notification sent:', response.data);
      }
    } catch (error) {
      console.error('[NotificationTriggers] Failed to send push notification:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    mountedRef.current = true;
    processedIds.current.clear();

    console.log('[NotificationTriggers] Setting up realtime listener for user:', userId);

    // Listen for new notifications created for this user
    const notificationsChannel = supabase
      .channel('push-notifications-trigger')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          if (!mountedRef.current) return;
          
          const notification = payload.new as {
            id: string;
            user_id: string;
            title: string;
            message: string;
            link?: string;
            type: string;
          };

          // Prevent duplicate processing
          if (processedIds.current.has(notification.id)) {
            console.log('[NotificationTriggers] Skipping duplicate notification:', notification.id);
            return;
          }
          processedIds.current.add(notification.id);

          console.log('[NotificationTriggers] New notification received:', notification.id, notification.title);
          
          // Add emoji based on notification type
          const emojiMap: Record<string, string> = {
            'new_order': '🛒',
            'order_status': '📦',
            'new_message': '💬',
            'default': '🔔'
          };
          
          const emoji = emojiMap[notification.type] || emojiMap['default'];
          const pushTitle = `${emoji} ${notification.title}`;
          
          // Send push notification
          await sendPushNotification(
            notification.user_id,
            pushTitle,
            notification.message,
            notification.link,
            notification.type,
            notification.id
          );
        }
      )
      .subscribe((status) => {
        console.log('[NotificationTriggers] Subscription status:', status);
      });

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(notificationsChannel);
    };
  }, [userId]);
};
