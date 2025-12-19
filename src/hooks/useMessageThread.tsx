import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { sendPushNotification } from '@/utils/pushNotifications';

export interface Message {
  id: string;
  thread_id?: string;
  sender_id: string;
  recipient_id: string;
  product_id?: string | null;
  subject?: string | null;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  media_name?: string | null;
  is_read: boolean;
  created_at: string;
}

interface UseMessageThreadProps {
  sellerId: string;
  buyerId: string;
  productId?: string;
  enabled?: boolean;
}

// Generate thread_id matching the database function
export const generateThreadId = (sellerId: string, buyerId: string, productId?: string): string => {
  const id1 = sellerId < buyerId ? sellerId : buyerId;
  const id2 = sellerId < buyerId ? buyerId : sellerId;
  return `${id1}-${id2}-${productId || 'general'}`;
};

export const useMessageThread = ({ sellerId, buyerId, productId, enabled = true }: UseMessageThreadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const threadId = generateThreadId(sellerId, buyerId, productId);

  // Fetch messages for this thread
  const fetchMessages = useCallback(async () => {
    if (!enabled || !user || !sellerId || !buyerId) {
      console.log('📨 Skipping fetch - missing params:', { enabled, user: !!user, sellerId, buyerId });
      return;
    }

    setLoading(true);
    try {
      // Determine the other user in the conversation
      const otherUserId = user.id === sellerId ? buyerId : sellerId;

      console.log('📨 Fetching messages for conversation:', {
        currentUser: user.id,
        otherUser: otherUserId,
        productId,
        threadId,
      });

      // Build the query to get all messages between these two users
      let query = supabase
        .from('messages')
        .select('id, sender_id, recipient_id, product_id, subject, content, media_url, media_type, media_name, is_read, created_at')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`);

      // Filter by product_id if specified
      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('📨 Error fetching messages:', error);
        throw error;
      }

      console.log('📨 Messages loaded:', data?.length || 0, data);

      setMessages(
        (data || []).map((msg) => ({
          ...msg,
          thread_id: threadId,
          media_type: msg.media_type as 'image' | 'video' | null,
        }))
      );

      // Mark unread messages as read
      const unreadMessages = (data || []).filter((msg) => msg.recipient_id === user.id && !msg.is_read);

      if (unreadMessages.length > 0) {
        console.log('📨 Marking', unreadMessages.length, 'messages as read');
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in(
            'id',
            unreadMessages.map((m) => m.id)
          )
          .eq('recipient_id', user.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [threadId, user, enabled, sellerId, buyerId, productId]);

  // Setup realtime subscription with thread_id filter
  useEffect(() => {
    if (!enabled || !user || !threadId) return;

    fetchMessages();

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const otherUserId = user.id === sellerId ? buyerId : sellerId;
    console.log('🔔 Subscribing to realtime for conversation between:', user.id, 'and', otherUserId);

    // Subscribe to messages between these two users
    const channel = supabase
      .channel(`chat-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as any;

          // Check if this message is part of our conversation
          const isOurConversation =
            (newMsg.sender_id === user.id && newMsg.recipient_id === otherUserId) ||
            (newMsg.sender_id === otherUserId && newMsg.recipient_id === user.id);

          // If we have a product_id filter, also check that
          const matchesProduct = !productId || newMsg.product_id === productId;

          if (isOurConversation && matchesProduct) {
            console.log('🔔 New message in conversation:', newMsg.id);

            const formattedMsg: Message = {
              ...newMsg,
              thread_id: threadId,
              media_type: newMsg.media_type as 'image' | 'video' | null,
            };

            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === formattedMsg.id)) return prev;
              return [...prev, formattedMsg];
            });

            // Mark as read if I'm the recipient
            if (newMsg.recipient_id === user.id && !newMsg.is_read) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMsg.id)
                .eq('recipient_id', user.id);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('🔔 Cleaning up subscription for thread:', threadId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [threadId, user, enabled, fetchMessages, sellerId, buyerId, productId]);

  // Send a message with thread_id
  const sendMessage = useCallback(
    async (content: string, mediaUrl?: string, mediaType?: 'image' | 'video', mediaName?: string, subject?: string) => {
      if (!user || (!content.trim() && !mediaUrl)) return false;

      setSending(true);
      try {
        const recipientId = user.id === sellerId ? buyerId : sellerId;

        console.log('📤 Sending message to:', recipientId);

        const messageContent = content.trim() || (mediaName ? `📎 ${mediaName}` : '');

        const { error } = await supabase
          .from('messages')
          .insert([
            {
              sender_id: user.id,
              recipient_id: recipientId,
              product_id: productId || null,
              subject: subject || null,
              content: messageContent,
              media_url: mediaUrl || null,
              media_type: mediaType || null,
              media_name: mediaName || null,
            },
          ]);

        if (error) throw error;

        // 🔔 Push réel côté destinataire (fonctionne même si l'app est fermée)
        await sendPushNotification(supabase, {
          user_id: recipientId,
          title: '💬 Nouveau message',
          body: messageContent.length > 120 ? `${messageContent.slice(0, 117)}...` : messageContent,
          url: '/messages',
          tag: 'new_message',
        });

        console.log('📤 Message sent successfully');
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Erreur',
          description: "Impossible d'envoyer le message",
          variant: 'destructive',
        });
        return false;
      } finally {
        setSending(false);
      }
    },
    [user, sellerId, buyerId, productId, toast]
  );

  return {
    messages,
    loading,
    sending,
    threadId,
    sendMessage,
    refetch: fetchMessages,
  };
};
