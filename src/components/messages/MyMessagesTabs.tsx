import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, ShoppingCart, Store, Package, User, Mail, MailOpen } from 'lucide-react';
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
  type: 'buyer' | 'seller';
}

interface MyMessagesTabsProps {
  initialTab?: 'purchases' | 'sales';
  autoOpenConversation?: string | null;
}

type UnreadFilter = 'all' | 'unread';

export const MyMessagesTabs = ({ initialTab = 'purchases', autoOpenConversation }: MyMessagesTabsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [unreadFilter, setUnreadFilter] = useState<UnreadFilter>('all');
  const [autoOpenDone, setAutoOpenDone] = useState(false);

  useEffect(() => {
    if (user) fetchThreads();
  }, [user]);

  // Auto-open conversation from URL param
  useEffect(() => {
    if (!autoOpenConversation || autoOpenDone || loading || threads.length === 0) return;
    
    const matchingThread = threads.find(t => t.other_user_id === autoOpenConversation);
    if (matchingThread) {
      // Switch to the correct tab
      setActiveTab(matchingThread.type === 'buyer' ? 'purchases' : 'sales');
      setSelectedThread(matchingThread);
      setChatOpen(true);
      setAutoOpenDone(true);
    } else {
      // No matching thread found, mark as done to avoid loops
      setAutoOpenDone(true);
    }
  }, [autoOpenConversation, autoOpenDone, loading, threads]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('unified-messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as any;
        if (newMessage.sender_id === user.id || newMessage.recipient_id === user.id) {
          fetchThreads();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchThreads = async () => {
    if (!user) return;
    try {
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`*, product:products(title, images, price, seller_id, shop:seller_shops(shop_name, shop_slug))`)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const threadMap = new Map<string, any[]>();
      (allMessages || []).forEach(message => {
        const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
        const threadId = `${message.product_id || 'general'}-${otherUserId}`;
        if (!threadMap.has(threadId)) threadMap.set(threadId, []);
        threadMap.get(threadId)!.push(message);
      });

      const threadsData = await Promise.all(
        Array.from(threadMap.entries()).map(async ([threadId, messages]) => {
          const latestMessage = messages[0];
          const otherUserId = latestMessage.sender_id === user.id ? latestMessage.recipient_id : latestMessage.sender_id;
          const { data: profileData } = await supabase.from('profiles').select('full_name, email').eq('user_id', otherUserId).single();
          const productSellerId = latestMessage.product?.seller_id;
          const type: 'buyer' | 'seller' = productSellerId === user.id ? 'seller' : 'buyer';
          const unreadCount = messages.filter(m => m.recipient_id === user.id && !m.is_read).length;

          return {
            thread_id: threadId,
            product_id: latestMessage.product_id,
            other_user_id: otherUserId,
            product: latestMessage.product ? { title: latestMessage.product.title, images: latestMessage.product.images, price: latestMessage.product.price, seller_id: latestMessage.product.seller_id } : null,
            shop: latestMessage.product?.shop ? { shop_name: latestMessage.product.shop.shop_name, shop_slug: latestMessage.product.shop.shop_slug } : null,
            other_user_profile: profileData,
            latest_message: { id: latestMessage.id, content: latestMessage.content, created_at: latestMessage.created_at, sender_id: latestMessage.sender_id, recipient_id: latestMessage.recipient_id, is_read: latestMessage.is_read, subject: latestMessage.subject },
            unread_count: unreadCount,
            type,
          } as MessageThread;
        })
      );

      setThreads(threadsData.sort((a, b) => new Date(b.latest_message.created_at).getTime() - new Date(a.latest_message.created_at).getTime()));
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast({ title: "Erreur", description: "Impossible de charger les messages", variant: "destructive" });
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
    if (!open) fetchThreads();
  };

  const purchaseThreads = threads.filter(t => t.type === 'buyer');
  const salesThreads = threads.filter(t => t.type === 'seller');

  const filterByUnread = (list: MessageThread[]) => {
    if (unreadFilter === 'unread') return list.filter(t => t.unread_count > 0);
    return list;
  };

  const filteredPurchaseThreads = filterByUnread(purchaseThreads);
  const filteredSalesThreads = filterByUnread(salesThreads);

  const purchaseUnread = purchaseThreads.reduce((sum, t) => sum + t.unread_count, 0);
  const salesUnread = salesThreads.reduce((sum, t) => sum + t.unread_count, 0);

  const renderThread = (thread: MessageThread) => {
    const timeAgo = (() => {
      const diff = Date.now() - new Date(thread.latest_message.created_at).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "À l'instant";
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h`;
      return format(new Date(thread.latest_message.created_at), 'dd MMM', { locale: fr });
    })();

    return (
      <motion.button
        key={thread.thread_id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-muted/50 active:bg-muted transition-all text-left ${
          thread.unread_count > 0
            ? 'bg-primary/5 border border-primary/30 shadow-sm'
            : 'bg-card border border-border/50'
        }`}
        onClick={() => handleThreadClick(thread)}
      >
        {/* Avatar with product image */}
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
          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
            thread.type === 'buyer' ? 'bg-primary' : 'bg-accent-foreground'
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
            <span className="font-bold text-sm truncate text-foreground">
              {thread.type === 'buyer'
                ? (thread.shop?.shop_name || thread.other_user_profile?.full_name || 'Vendeur')
                : (thread.other_user_profile?.full_name || thread.other_user_profile?.email?.split('@')[0] || 'Client')
              }
            </span>
            <span className={`text-[11px] flex-shrink-0 ${thread.unread_count > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
              {timeAgo}
            </span>
          </div>

          {thread.product && (
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="text-[11px] text-primary font-semibold truncate">{thread.product.title}</span>
              {thread.product.price && (
                <span className="text-[10px] font-bold text-muted-foreground flex-shrink-0">
                  {thread.product.price.toLocaleString()} F
                </span>
              )}
            </div>
          )}

          <p className={`text-[13px] line-clamp-1 ${thread.unread_count > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
            {thread.latest_message.sender_id === user?.id && (
              <span className="text-muted-foreground font-normal">Vous : </span>
            )}
            {thread.latest_message.content === '[PRODUCT_SHARE]'
              ? '📦 Carte produit partagée'
              : thread.latest_message.content}
          </p>
        </div>
      </motion.button>
    );
  };

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
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'purchases' | 'sales'); setUnreadFilter('all'); }}>
        <TabsList className="grid grid-cols-2 w-full bg-muted/50 p-1 rounded-xl h-auto">
          <TabsTrigger
            value="purchases"
            className="relative gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg py-3 text-sm font-bold transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            Achats
            {purchaseUnread > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary text-primary-foreground border-0 animate-pulse">
                {purchaseUnread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="sales"
            className="relative gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg py-3 text-sm font-bold transition-all"
          >
            <Store className="h-4 w-4" />
            Ventes
            {salesUnread > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary text-primary-foreground border-0 animate-pulse">
                {salesUnread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Unread filter */}
        <div className="flex gap-1.5 pt-1">
          <Button
            variant={unreadFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUnreadFilter('all')}
            className="rounded-full text-xs h-8 px-3 font-semibold"
          >
            <MailOpen className="w-3 h-3 mr-1" />
            Tous
          </Button>
          <Button
            variant={unreadFilter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUnreadFilter('unread')}
            className="rounded-full text-xs h-8 px-3 font-semibold"
          >
            <Mail className="w-3 h-3 mr-1" />
            Non lus
            {(activeTab === 'purchases' ? purchaseUnread : salesUnread) > 0 && (
              <Badge className="ml-1 h-4 px-1 text-[9px] bg-primary/20 text-primary border-0">
                {activeTab === 'purchases' ? purchaseUnread : salesUnread}
              </Badge>
            )}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <TabsContent value="purchases" className="mt-3">
            <motion.div
              key={`purchases-${unreadFilter}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {filteredPurchaseThreads.length === 0
                ? (unreadFilter === 'unread'
                  ? <p className="text-center text-sm text-muted-foreground py-8">Aucun message non lu</p>
                  : renderEmptyState('purchases'))
                : filteredPurchaseThreads.map(renderThread)
              }
            </motion.div>
          </TabsContent>

          <TabsContent value="sales" className="mt-3">
            <motion.div
              key={`sales-${unreadFilter}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {filteredSalesThreads.length === 0
                ? (unreadFilter === 'unread'
                  ? <p className="text-center text-sm text-muted-foreground py-8">Aucun message non lu</p>
                  : renderEmptyState('sales'))
                : filteredSalesThreads.map(renderThread)
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
            product: selectedThread.product ? { title: selectedThread.product.title, images: selectedThread.product.images, price: selectedThread.product.price } : undefined,
            sender_profile: selectedThread.other_user_profile ? { full_name: selectedThread.other_user_profile.full_name || undefined, email: selectedThread.other_user_profile.email || undefined } : undefined,
          }}
          open={chatOpen}
          onOpenChange={handleChatClose}
          userType={selectedThread.type === 'buyer' ? 'buyer' : 'seller'}
        />
      )}
    </div>
  );
};
