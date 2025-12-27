import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, User, MessageCircle, Package, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChatDialog } from './ChatDialog';
import { getProductImage, handleImageError } from '@/utils/productImageHelper';
import { motion } from 'framer-motion';

interface MessageThread {
  thread_id: string;
  product_id: string | null;
  buyer_id: string;
  product?: {
    title: string;
    images?: string[];
    price?: number;
  } | null;
  buyer_profile?: {
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

export const SellerMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchThreads();
    }
  }, [user]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('seller-messages-realtime')
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
            console.log('🔔 Seller: New message detected, refreshing threads...');
            fetchThreads();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchThreads = async () => {
    if (!user) return;

    try {
      // Get all messages involving the current user as seller (recipient or sender)
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
          const buyerId = latestMessage.sender_id === user.id
            ? latestMessage.recipient_id 
            : latestMessage.sender_id;

          // Fetch buyer profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', buyerId)
            .single();

          // Count unread messages (messages received by seller that are unread)
          const unreadCount = messages.filter(m => 
            m.recipient_id === user.id && !m.is_read
          ).length;

          return {
            thread_id: threadId,
            product_id: latestMessage.product_id,
            buyer_id: buyerId,
            product: latestMessage.product,
            buyer_profile: profileData,
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

  const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0);

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
        {totalUnread > 0 && (
          <Badge variant="destructive">
            🔔 {totalUnread} nouveau{totalUnread > 1 ? 'x' : ''}
          </Badge>
        )}
      </div>

      {threads.length === 0 ? (
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
        <div className="space-y-2">
          {threads.map((thread, index) => {
            const productImageUrl = thread.product?.images 
              ? getProductImage(thread.product.images, 0)
              : null;
            
            return (
              <motion.div
                key={thread.thread_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleThreadClick(thread)}
                className={`bg-card rounded-2xl border overflow-hidden cursor-pointer active:scale-[0.98] transition-all ${
                  thread.unread_count > 0
                    ? 'border-primary/40 ring-1 ring-primary/20 shadow-sm' 
                    : 'border-border/50 hover:border-border'
                }`}
              >
                <div className="p-3 flex gap-3">
                  {/* Product Image or User Avatar */}
                  <div className="relative flex-shrink-0">
                    {productImageUrl ? (
                      <img 
                        src={productImageUrl}
                        alt={thread.product?.title || 'Produit'}
                        className="w-14 h-14 rounded-xl object-cover border border-border/30"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        thread.unread_count > 0 ? 'bg-primary/15' : 'bg-muted'
                      }`}>
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {thread.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px] font-bold">
                        {thread.unread_count}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {thread.buyer_profile?.full_name || thread.buyer_profile?.email || 'Client'}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {format(new Date(thread.latest_message.created_at), 'dd MMM · HH:mm', { locale: fr })}
                      </span>
                    </div>
                    
                    {thread.product && (
                      <div className="flex items-center gap-1 text-[11px] text-primary font-medium mb-1">
                        <Package className="h-3 w-3" />
                        <span className="truncate">{thread.product.title}</span>
                      </div>
                    )}

                    <p className={`text-xs line-clamp-1 ${
                      thread.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}>
                      {thread.latest_message.content === '[PRODUCT_SHARE]' 
                        ? '📦 Carte produit partagée' 
                        : thread.latest_message.content}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="self-center flex-shrink-0">
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {selectedThread && (
        <ChatDialog
          initialMessage={{
            id: selectedThread.latest_message.id,
            sender_id: selectedThread.buyer_id,
            recipient_id: user?.id || '',
            product_id: selectedThread.product_id || undefined,
            subject: selectedThread.latest_message.subject,
            content: selectedThread.latest_message.content,
            product: selectedThread.product ? {
              title: selectedThread.product.title,
              images: selectedThread.product.images,
              price: selectedThread.product.price,
            } : undefined,
            sender_profile: selectedThread.buyer_profile ? {
              full_name: selectedThread.buyer_profile.full_name || undefined,
              email: selectedThread.buyer_profile.email || undefined,
            } : undefined,
          }}
          open={chatOpen}
          onOpenChange={handleChatClose}
          userType="seller"
        />
      )}
    </div>
  );
};
