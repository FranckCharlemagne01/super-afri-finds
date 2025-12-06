import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Store, Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChatDialog } from './ChatDialog';

interface MessageThread {
  thread_id: string;
  product_id: string | null;
  other_user_id: string;
  product?: {
    title: string;
    images?: string[];
    price?: number;
  } | null;
  other_user_profile?: {
    full_name?: string;
    email?: string;
  } | null;
  latest_message: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    recipient_id: string;
    is_read: boolean;
    subject?: string;
  };
  unread_count: number;
}

export const BuyerMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchThreads();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('buyer-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as any;
          // Only refresh if this message involves the current user
          if (newMessage.sender_id === user.id || newMessage.recipient_id === user.id) {
            console.log('🔔 New message detected, refreshing threads...');
            fetchThreads();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchThreads = async () => {
    if (!user) return;

    try {
      // Get all messages involving the current user, grouped by thread_id
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('*, product:products(title, images, price)')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by product_id + other_user_id (create virtual thread_id)
      const threadMap = new Map<string, any[]>();
      (allMessages || []).forEach(message => {
        const otherUserId = message.sender_id === user.id 
          ? message.recipient_id 
          : message.sender_id;
        const threadId = `${message.product_id || 'general'}-${otherUserId}`;
        
        if (!threadMap.has(threadId)) {
          threadMap.set(threadId, []);
        }
        threadMap.get(threadId)!.push(message);
      });

      // Create thread objects
      const threadsData = await Promise.all(
        Array.from(threadMap.entries()).map(async ([threadId, messages]) => {
          const latestMessage = messages[0];
          const otherUserId = latestMessage.sender_id === user.id
            ? latestMessage.recipient_id 
            : latestMessage.sender_id;

          // Fetch other user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', otherUserId)
            .single();

          // Count unread messages
          const unreadCount = messages.filter(m => 
            m.recipient_id === user.id && !m.is_read
          ).length;

          return {
            thread_id: threadId,
            product_id: latestMessage.product_id,
            other_user_id: otherUserId,
            product: latestMessage.product,
            other_user_profile: profileData,
            latest_message: {
              id: latestMessage.id,
              content: latestMessage.content,
              created_at: latestMessage.created_at,
              sender_id: latestMessage.sender_id,
              recipient_id: latestMessage.recipient_id,
              is_read: latestMessage.is_read,
              subject: latestMessage.subject,
            },
            unread_count: unreadCount,
          } as MessageThread;
        })
      );

      // Sort by latest message date
      setThreads(threadsData.sort((a, b) => 
        new Date(b.latest_message.created_at).getTime() - 
        new Date(a.latest_message.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThreadClick = (thread: MessageThread) => {
    setSelectedThread(thread);
    setChatOpen(true);
  };

  const handleChatClose = (open: boolean) => {
    setChatOpen(open);
    if (!open) {
      // Refresh threads when closing to update read status
      fetchThreads();
    }
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
    <div className="space-y-3">
      {threads.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/50 p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground mb-1">Aucune conversation</p>
          <p className="text-sm text-muted-foreground">
            Contactez les vendeurs depuis les fiches produits
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
          {threads.map((thread) => (
            <button
              key={thread.thread_id}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 active:bg-muted transition-colors text-left ${
                thread.unread_count > 0 ? 'bg-primary/5' : ''
              }`}
              onClick={() => handleThreadClick(thread)}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/50">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                {thread.unread_count > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground">
                      {thread.unread_count > 9 ? '9+' : thread.unread_count}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`font-semibold text-sm truncate ${thread.unread_count > 0 ? 'text-foreground' : 'text-foreground'}`}>
                    {thread.other_user_profile?.full_name || 
                     thread.other_user_profile?.email || 
                     'Vendeur'}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">
                    {format(new Date(thread.latest_message.created_at), 'dd MMM', { locale: fr })}
                  </span>
                </div>
                
                {thread.product && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                    <Package className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{thread.product.title}</span>
                  </div>
                )}
                
                <p className={`text-sm line-clamp-1 ${
                  thread.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}>
                  {thread.latest_message.content === '[PRODUCT_SHARE]' 
                    ? '📦 Carte produit partagée' 
                    : thread.latest_message.content}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {selectedThread && (
        <ChatDialog
          initialMessage={{
            id: selectedThread.latest_message.id,
            sender_id: selectedThread.other_user_id,
            recipient_id: user?.id || '',
            product_id: selectedThread.product_id || undefined,
            subject: selectedThread.latest_message.subject,
            content: selectedThread.latest_message.content,
            product: selectedThread.product ? {
              title: selectedThread.product.title,
              images: selectedThread.product.images,
              price: selectedThread.product.price,
            } : undefined,
            sender_profile: selectedThread.other_user_profile ? {
              full_name: selectedThread.other_user_profile.full_name || undefined,
              email: selectedThread.other_user_profile.email || undefined,
            } : undefined,
          }}
          open={chatOpen}
          onOpenChange={handleChatClose}
          userType="buyer"
        />
      )}
    </div>
  );
};
