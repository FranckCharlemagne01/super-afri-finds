import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, User } from 'lucide-react';
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
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

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

  const sendReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    setReplying(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user?.id,
          recipient_id: selectedMessage.sender_id,
          product_id: selectedMessage.product_id,
          subject: `Re: ${selectedMessage.subject || 'Message'}`,
          content: replyContent,
        }]);

      if (error) throw error;

      toast({
        title: "Réponse envoyée",
        description: "Votre réponse a été envoyée avec succès",
      });

      setReplyContent('');
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la réponse",
        variant: "destructive",
      });
    } finally {
      setReplying(false);
    }
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
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
            {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Messages List */}
          <div className="space-y-4">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedMessage?.id === message.id ? 'ring-2 ring-primary' : ''
                } ${!message.is_read ? 'border-primary' : ''}`}
                onClick={() => handleMessageClick(message)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {message.sender_profile?.full_name || message.sender_profile?.email || 'Client'}
                      </span>
                      {!message.is_read && (
                        <Badge variant="destructive" className="text-xs">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  {message.subject && (
                    <h4 className="text-sm font-medium">{message.subject}</h4>
                  )}
                  {message.product && (
                    <p className="text-xs text-muted-foreground">
                      Produit: {message.product.title}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Message Detail & Reply */}
          {selectedMessage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedMessage.subject || 'Message'}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>
                    {selectedMessage.sender_profile?.full_name || 
                     selectedMessage.sender_profile?.email || 
                     'Client'}
                  </span>
                  <span>•</span>
                  <span>
                    {format(new Date(selectedMessage.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </span>
                </div>
                {selectedMessage.product && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    {selectedMessage.product.images?.[0] && (
                      <img
                        src={selectedMessage.product.images[0]}
                        alt={selectedMessage.product.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {selectedMessage.product.title}
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Répondre au client:</label>
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Tapez votre réponse..."
                    rows={4}
                  />
                  <Button
                    onClick={sendReply}
                    disabled={!replyContent.trim() || replying}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {replying ? 'Envoi...' : 'Envoyer la réponse'}
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