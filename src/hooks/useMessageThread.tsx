import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
    if (!enabled || !user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${sellerId === user.id ? buyerId : sellerId}),and(sender_id.eq.${sellerId === user.id ? buyerId : sellerId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter by product_id if specified
      const filteredData = productId 
        ? (data || []).filter(msg => msg.product_id === productId)
        : data || [];

      setMessages(filteredData.map(msg => ({
        ...msg,
        thread_id: threadId,
        media_type: msg.media_type as 'image' | 'video' | null
      })));

      // Mark unread messages as read
      const unreadMessages = filteredData.filter(msg => 
        msg.recipient_id === user.id && !msg.is_read
      );
      
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(m => m.id))
          .eq('recipient_id', user.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [threadId, user, enabled, sellerId, buyerId, productId]);

  // Setup realtime subscription
  useEffect(() => {
    if (!enabled || !user || !threadId) return;

    fetchMessages();

    const otherUserId = sellerId === user.id ? buyerId : sellerId;

    // Subscribe to new messages between these users
    const channel = supabase
      .channel(`thread-${threadId}`)
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
            console.log('🔔 New message in thread:', newMsg);
            
            const formattedMsg: Message = {
              ...newMsg,
              thread_id: threadId,
              media_type: newMsg.media_type as 'image' | 'video' | null
            };
            
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === formattedMsg.id)) return prev;
              return [...prev, formattedMsg];
            });

            // Mark as read if I'm the recipient
            if (newMsg.recipient_id === user.id) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMsg.id)
                .eq('recipient_id', user.id);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [threadId, user, enabled, fetchMessages, sellerId, buyerId, productId]);

  // Send a message
  const sendMessage = useCallback(async (
    content: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    mediaName?: string,
    subject?: string
  ) => {
    if (!user || (!content.trim() && !mediaUrl)) return false;

    setSending(true);
    try {
      const otherUserId = user.id === sellerId ? buyerId : sellerId;

      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: otherUserId,
          product_id: productId || null,
          subject: subject || null,
          content: content.trim() || (mediaName ? `📎 ${mediaName}` : ''),
          media_url: mediaUrl || null,
          media_type: mediaType || null,
          media_name: mediaName || null,
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
      return false;
    } finally {
      setSending(false);
    }
  }, [user, sellerId, buyerId, productId, toast]);

  return {
    messages,
    loading,
    sending,
    threadId,
    sendMessage,
    refetch: fetchMessages,
  };
};
