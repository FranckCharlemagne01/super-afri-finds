import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Store, Package, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChatDialog } from './ChatDialog';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  product_id?: string;
  subject?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  product?: {
    title: string;
    images?: string[];
  };
  seller_profile?: {
    full_name?: string;
    email?: string;
  };
}

interface MessageThread {
  product_id: string;
  seller_id: string;
  product?: {
    title: string;
    images?: string[];
  };
  seller_profile?: {
    full_name?: string;
    email?: string;
  };
  messages: Message[];
  latest_message: Message;
}

export const BuyerMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      // Fetch all messages for the current user (both sent and received)
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`
          *,
          product:products(title, images)
        `)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by product_id and seller_id
      const messageMap = new Map<string, Message[]>();
      
      (allMessages || []).forEach(message => {
        const sellerId = message.sender_id === user?.id ? message.recipient_id : message.sender_id;
        const key = `${message.product_id || 'no-product'}-${sellerId}`;
        
        if (!messageMap.has(key)) {
          messageMap.set(key, []);
        }
        messageMap.get(key)!.push(message);
      });

      // Create threads with seller profiles
      const threadsData = await Promise.all(
        Array.from(messageMap.entries()).map(async ([key, messages]) => {
          const latestMessage = messages[0];
          const sellerId = latestMessage.sender_id === user?.id ? latestMessage.recipient_id : latestMessage.sender_id;
          
          // Fetch seller profile
          const { data: sellerProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', sellerId)
            .single();

          return {
            product_id: latestMessage.product_id || '',
            seller_id: sellerId,
            product: latestMessage.product,
            seller_profile: sellerProfile,
            messages: messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
            latest_message: latestMessage
          };
        })
      );

      setThreads(threadsData.sort((a, b) => 
        new Date(b.latest_message.created_at).getTime() - new Date(a.latest_message.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleThreadClick = (thread: MessageThread) => {
    // Create a message object compatible with ChatDialog
    const messageForChat = {
      id: thread.latest_message.id,
      sender_id: thread.latest_message.sender_id,
      recipient_id: thread.latest_message.recipient_id,
      product_id: thread.product_id,
      subject: thread.latest_message.subject,
      content: thread.latest_message.content,
      product: thread.product,
      sender_profile: thread.seller_profile
    };
    
    setSelectedMessage(messageForChat);
    setChatOpen(true);
    
    // Mark unread messages as read
    thread.messages
      .filter(msg => msg.recipient_id === user?.id && !msg.is_read)
      .forEach(msg => markAsRead(msg.id));
  };


  const getUnreadCount = (thread: MessageThread) => {
    return thread.messages.filter(msg => 
      msg.recipient_id === user?.id && !msg.is_read
    ).length;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">Mes Conversations</h2>
        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
          {threads.length}
        </Badge>
      </div>

      {threads.length === 0 ? (
        <Card className="native-card">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">Aucune conversation</p>
            <p className="text-sm text-muted-foreground">
              Contactez les vendeurs depuis les fiches produits
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => {
            const unreadCount = getUnreadCount(thread);
            return (
              <Card
                key={`${thread.product_id}-${thread.seller_id}`}
                className={`native-card cursor-pointer active:scale-[0.99] transition-all ${
                  unreadCount > 0 ? 'border-primary/50 bg-primary/5' : ''
                }`}
                onClick={() => handleThreadClick(thread)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground truncate">
                          {thread.seller_profile?.full_name || 
                           thread.seller_profile?.email || 
                           'Vendeur'}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground text-xs rounded-full px-2 h-5">
                              {unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(thread.latest_message.created_at), 'dd MMM', { locale: fr })}
                          </span>
                        </div>
                      </div>
                      
                      {thread.product && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                          <Package className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{thread.product.title}</span>
                        </div>
                      )}
                      
                      <p className={`text-sm line-clamp-1 ${
                        unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}>
                        {thread.latest_message.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      <ChatDialog
        initialMessage={selectedMessage}
        open={chatOpen}
        onOpenChange={setChatOpen}
        userType="buyer"
      />
    </div>
  );
};