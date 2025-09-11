import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Store, Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

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

  const sendReply = async () => {
    if (!selectedThread || !replyContent.trim()) return;

    setReplying(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user?.id,
          recipient_id: selectedThread.seller_id,
          product_id: selectedThread.product_id || null,
          subject: `Re: ${selectedThread.latest_message.subject || 'Message'}`,
          content: replyContent,
        }]);

      if (error) throw error;

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé au vendeur",
      });

      setReplyContent('');
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setReplying(false);
    }
  };

  const handleThreadClick = (thread: MessageThread) => {
    setSelectedThread(thread);
    
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Mes Conversations</h2>
        <Badge variant="secondary">
          {threads.length} conversation{threads.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune conversation.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contactez les vendeurs depuis les fiches produits pour commencer une conversation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversations List */}
          <div className="space-y-4">
            {threads.map((thread) => {
              const unreadCount = getUnreadCount(thread);
              return (
                <Card
                  key={`${thread.product_id}-${thread.seller_id}`}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedThread?.product_id === thread.product_id && 
                    selectedThread?.seller_id === thread.seller_id ? 'ring-2 ring-primary' : ''
                  } ${unreadCount > 0 ? 'border-primary' : ''}`}
                  onClick={() => handleThreadClick(thread)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        <span className="font-medium">
                          {thread.seller_profile?.full_name || 
                           thread.seller_profile?.email || 
                           'Vendeur'}
                        </span>
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(thread.latest_message.created_at), 'dd MMM', { locale: fr })}
                      </span>
                    </div>
                    {thread.product && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-3 w-3" />
                        <span className="truncate">{thread.product.title}</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {thread.latest_message.content}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Conversation Detail */}
          {selectedThread && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {selectedThread.seller_profile?.full_name || 
                   selectedThread.seller_profile?.email || 
                   'Vendeur'}
                </CardTitle>
                {selectedThread.product && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    {selectedThread.product.images?.[0] && (
                      <img
                        src={selectedThread.product.images[0]}
                        alt={selectedThread.product.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {selectedThread.product.title}
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Messages */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedThread.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground ml-8'
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}>
                        {format(new Date(message.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                <div className="space-y-2 border-t pt-4">
                  <label className="text-sm font-medium">Votre message:</label>
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Tapez votre message..."
                    rows={3}
                  />
                  <Button
                    onClick={sendReply}
                    disabled={!replyContent.trim() || replying}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {replying ? 'Envoi...' : 'Envoyer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};