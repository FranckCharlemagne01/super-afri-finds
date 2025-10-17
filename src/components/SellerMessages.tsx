import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, User, MessageCircle } from 'lucide-react';
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
  sender_profile?: {
    full_name?: string;
    email?: string;
  };
}

export const SellerMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  // 🔥 Temps réel: Écouter les nouveaux messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('seller-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Realtime message change:', payload);
          // Rafraîchir la liste des messages
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          product:products(title, images)
        `)
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch sender profiles separately
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (message) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', message.sender_id)
            .single();
          
          return {
            ...message,
            sender_profile: profile
          };
        })
      );
      
      setMessages(messagesWithProfiles);
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
        .eq('id', messageId);

      if (error) throw error;
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setChatOpen(true);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };


  const unreadCount = messages.filter(m => !m.is_read).length;

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
        <h2 className="text-xl font-semibold">Messages Clients</h2>
        {unreadCount > 0 && (
          <Badge variant="destructive">
            🔔 {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
          </Badge>
        )}
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun message reçu.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Les clients pourront vous contacter depuis vos produits.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer transition-all duration-200 border hover:shadow-md hover:border-primary/30 ${
                !message.is_read 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border/50 hover:bg-muted/30'
              }`}
              onClick={() => handleMessageClick(message)}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      !message.is_read ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm break-words">
                        {message.sender_profile?.full_name || message.sender_profile?.email || 'Client'}
                      </span>
                      {!message.is_read && (
                        <Badge variant="destructive" className="text-xs ml-2 animate-pulse">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(message.created_at), 'dd MMM', { locale: fr })}
                  </span>
                </div>
                {message.subject && (
                  <h4 className="text-sm font-medium mt-2 line-clamp-1">{message.subject}</h4>
                )}
                {message.product && (
                  <p className="text-xs text-primary font-medium mt-1 bg-primary/10 px-2 py-1 rounded">
                    📦 {message.product.title}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                  {message.content}
                </p>
                <Button 
                  variant={!message.is_read ? "default" : "outline"} 
                  size="sm" 
                  className={`w-full transition-all duration-200 ${
                    !message.is_read 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm' 
                      : 'hover:bg-primary/10 hover:border-primary/30'
                  }`}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {!message.is_read ? 'Répondre maintenant' : 'Ouvrir le chat'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <ChatDialog
        initialMessage={selectedMessage}
        open={chatOpen}
        onOpenChange={setChatOpen}
        userType="seller"
      />
    </div>
  );
};