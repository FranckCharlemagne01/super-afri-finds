import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, ShoppingCart, Store, Package, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChatDialog } from '@/components/ChatDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductImage, handleImageError } from '@/utils/productImageHelper';

interface MessageThread {
  thread_id: string;
  product_id: string | null;
  other_user_id: string;
  product?: {
    title: string;
    images?: string[];
    price?: number;
    seller_id?: string;
  } | null;
  shop?: {
    shop_name?: string;
    shop_slug?: string;
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
  type: 'buyer' | 'seller'; // buyer = user is buying, seller = user is selling
}

interface MyMessagesTabsProps {
  initialTab?: 'purchases' | 'sales';
}

export const MyMessagesTabs = ({ initialTab = 'purchases' }: MyMessagesTabsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (user) {
      fetchThreads();
    }
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('unified-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as any;
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
  }, [user?.id]);

  const fetchThreads = async () => {
    if (!user) return;

    try {
      // Get all messages involving the current user with product and shop info
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`
          *,
          product:products(
            title, 
            images, 
            price, 
            seller_id,
            shop:seller_shops(shop_name, shop_slug)
          )
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by product_id + other_user_id
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

      // Create thread objects with type determination
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

          // Determine type: if product.seller_id === user.id, this is a SALE (user is seller)
          // Otherwise it's a PURCHASE (user is buyer)
          const productSellerId = latestMessage.product?.seller_id;
          const type: 'buyer' | 'seller' = productSellerId === user.id ? 'seller' : 'buyer';

          // Count unread messages
          const unreadCount = messages.filter(m => 
            m.recipient_id === user.id && !m.is_read
          ).length;

          return {
            thread_id: threadId,
            product_id: latestMessage.product_id,
            other_user_id: otherUserId,
            product: latestMessage.product ? {
              title: latestMessage.product.title,
              images: latestMessage.product.images,
              price: latestMessage.product.price,
              seller_id: latestMessage.product.seller_id,
            } : null,
            shop: latestMessage.product?.shop ? {
              shop_name: latestMessage.product.shop.shop_name,
              shop_slug: latestMessage.product.shop.shop_slug,
            } : null,
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
            type,
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
      fetchThreads();
    }
  };

  // Filter threads by type
  const purchaseThreads = threads.filter(t => t.type === 'buyer');
  const salesThreads = threads.filter(t => t.type === 'seller');

  const purchaseUnread = purchaseThreads.reduce((sum, t) => sum + t.unread_count, 0);
  const salesUnread = salesThreads.reduce((sum, t) => sum + t.unread_count, 0);

  const renderThread = (thread: MessageThread) => (
    <motion.button
      key={thread.thread_id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 active:bg-muted transition-all text-left bg-card border ${
        thread.unread_count > 0 ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border/50'
      }`}
      onClick={() => handleThreadClick(thread)}
    >
      {/* Product Image Avatar */}
      <div className="relative flex-shrink-0">
        <img 
          src={getProductImage(thread.product?.images, 0)} 
          alt=""
          className="w-14 h-14 rounded-xl object-cover border border-border/50"
          onError={(e) => handleImageError(e)}
        />
        {thread.unread_count > 0 && (
          <div className="absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-primary rounded-full flex items-center justify-center px-1.5 shadow-lg">
            <span className="text-[10px] font-bold text-primary-foreground">
              {thread.unread_count > 9 ? '9+' : thread.unread_count}
            </span>
          </div>
        )}
        {/* Online indicator for type */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
          thread.type === 'buyer' ? 'bg-primary' : 'bg-muted-foreground'
        }`}>
          {thread.type === 'buyer' ? (
            <Store className="h-2.5 w-2.5 text-primary-foreground" />
          ) : (
            <User className="h-2.5 w-2.5 text-background" />
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`font-bold text-sm truncate ${thread.unread_count > 0 ? 'text-foreground' : 'text-foreground'}`}>
            {thread.type === 'buyer' 
              ? (thread.shop?.shop_name || thread.other_user_profile?.full_name || 'Vendeur')
              : (thread.other_user_profile?.full_name || thread.other_user_profile?.email?.split('@')[0] || 'Client')
            }
          </span>
          <span className={`text-[11px] flex-shrink-0 ${thread.unread_count > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
            {format(new Date(thread.latest_message.created_at), 'dd MMM', { locale: fr })}
          </span>
        </div>
        
        {thread.product && (
          <div className="flex items-center gap-1.5 mb-1">
            <Package className="h-3 w-3 text-primary flex-shrink-0" />
            <span className="text-[11px] text-primary font-semibold truncate">{thread.product.title}</span>
          </div>
        )}
        
        <p className={`text-[13px] line-clamp-1 ${
          thread.unread_count > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'
        }`}>
          {thread.latest_message.sender_id !== user?.id && thread.unread_count > 0 && (
            <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full mr-1.5 align-middle animate-pulse" />
          )}
          {thread.latest_message.content === '[PRODUCT_SHARE]' 
            ? '📦 Carte produit partagée' 
            : thread.latest_message.content}
        </p>
      </div>
    </motion.button>
  );

  const renderEmptyState = (type: 'purchases' | 'sales') => (
    <div className="bg-card rounded-2xl border border-border/50 p-8 text-center">
      <div className="w-16 h-16 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="font-semibold text-foreground mb-1">Aucune conversation</p>
      <p className="text-sm text-muted-foreground">
        {type === 'purchases' 
          ? "Contactez les vendeurs depuis les fiches produits"
          : "Les clients vous contacteront depuis vos produits"
        }
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'purchases' | 'sales')}>
        <TabsList className="grid grid-cols-2 w-full bg-muted/50 p-1 rounded-xl h-auto">
          <TabsTrigger 
            value="purchases"
            className="relative gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg py-3 text-sm font-medium transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            Mes Achats
            {purchaseUnread > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px] animate-pulse">
                {purchaseUnread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="sales"
            className="relative gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg py-3 text-sm font-medium transition-all"
          >
            <Store className="h-4 w-4" />
            Mes Ventes
            {salesUnread > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px] animate-pulse">
                {salesUnread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="purchases" className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {purchaseThreads.length === 0 
                ? renderEmptyState('purchases')
                : purchaseThreads.map(renderThread)
              }
            </motion.div>
          </TabsContent>

          <TabsContent value="sales" className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {salesThreads.length === 0 
                ? renderEmptyState('sales')
                : salesThreads.map(renderThread)
              }
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

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
          userType={selectedThread.type === 'buyer' ? 'buyer' : 'seller'}
        />
      )}
    </div>
  );
};
