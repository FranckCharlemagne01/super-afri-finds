import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { User, Store, Package, Paperclip, X, ArrowLeft, ShoppingBag, MessageSquare, ExternalLink, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChatInput } from '@/components/ChatInput';
import { useNavigate } from 'react-router-dom';
import { useMessageThread, generateThreadId, Message } from '@/hooks/useMessageThread';
import { getProductImage, handleImageError } from '@/utils/productImageHelper';

interface ChatDialogProps {
  initialMessage: {
    id: string;
    sender_id: string;
    recipient_id: string;
    product_id?: string;
    subject?: string;
    content: string;
    product?: {
      title: string;
      images?: string[];
      price?: number;
    };
    sender_profile?: {
      full_name?: string;
      email?: string;
    };
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: 'seller' | 'buyer';
  highlightMessageId?: string;
}

export const ChatDialog = ({ initialMessage, open, onOpenChange, userType, highlightMessageId }: ChatDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [otherUserInfo, setOtherUserInfo] = useState<{ full_name?: string; email?: string } | null>(null);
  const [showProductBanner, setShowProductBanner] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = user?.id || '';
  const otherUserId = initialMessage?.sender_id === currentUserId 
    ? initialMessage?.recipient_id 
    : initialMessage?.sender_id;

  const sellerId = userType === 'seller' ? currentUserId : otherUserId || '';
  const buyerId = userType === 'buyer' ? currentUserId : otherUserId || '';

  const { messages, loading, sending, sendMessage, refetch } = useMessageThread({
    sellerId,
    buyerId,
    productId: initialMessage?.product_id,
    enabled: open && !!initialMessage && !!user && !!otherUserId,
  });

  useEffect(() => {
    if (open && initialMessage && user && otherUserId) {
      refetch();
    }
  }, [open, refetch]);

  useEffect(() => {
    if (!open || !initialMessage || !user) return;
    const fetchOtherUserInfo = async () => {
      const otherId = userType === 'seller' ? initialMessage.sender_id : initialMessage.recipient_id;
      if (!otherId || otherId === user.id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', otherId)
          .single();
        if (error) throw error;
        setOtherUserInfo(data);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    fetchOtherUserInfo();
  }, [open, initialMessage, user, userType]);

  // Track which message to highlight (cleared after a few seconds)
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightedRef = useRef<HTMLDivElement | null>(null);
  const didScrollToHighlightRef = useRef(false);

  // Scroll to bottom by default; if a highlight target is requested, scroll to it instead
  useEffect(() => {
    if (!messages.length) return;

    if (highlightMessageId && !didScrollToHighlightRef.current) {
      const exists = messages.some((m) => m.id === highlightMessageId);
      if (exists) {
        didScrollToHighlightRef.current = true;
        setHighlightedId(highlightMessageId);
        // Defer to next frame to ensure DOM is painted
        requestAnimationFrame(() => {
          highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        // Auto-clear highlight
        const t = setTimeout(() => setHighlightedId(null), 3000);
        return () => clearTimeout(t);
      }
    }

    if (messagesContainerRef.current && !highlightedId) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, highlightMessageId, highlightedId]);

  // Reset highlight tracker when dialog reopens or target changes
  useEffect(() => {
    if (!open) {
      didScrollToHighlightRef.current = false;
      setHighlightedId(null);
    }
  }, [open, highlightMessageId]);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('chat-media').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ title: "Erreur", description: "Impossible d'uploader le fichier", variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (messageText: string, mediaFile?: File) => {
    if ((!messageText.trim() && !mediaFile) || !initialMessage || !user) return;
    let mediaUrl = null;
    let mediaType: 'image' | 'video' | undefined = undefined;
    let mediaName = null;
    if (mediaFile) {
      mediaUrl = await uploadFile(mediaFile);
      if (!mediaUrl) return;
      mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
      mediaName = mediaFile.name;
    }
    const success = await sendMessage(
      messageText.trim() || (mediaFile ? `📎 ${mediaFile.name}` : ''),
      mediaUrl || undefined, mediaType, mediaName || undefined,
      `Re: ${initialMessage.subject || 'Message'}`
    );
    if (success) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendProductCard = async () => {
    if (!initialMessage?.product || !user) return;
    await sendMessage('[PRODUCT_SHARE]', undefined, undefined, undefined, `Re: ${initialMessage.subject || 'Message'}`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({ title: "Type non supporté", description: "Seules les images et vidéos sont acceptées", variant: "destructive" });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: "Fichier trop volumineux", description: "Max 50MB", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendClick = (messageText: string) => {
    if (selectedFile) {
      handleSendMessage(messageText, selectedFile);
    } else {
      handleSendMessage(messageText);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
    onOpenChange(false);
  };

  const otherUserName = initialMessage 
    ? (userType === 'seller' 
        ? (initialMessage.sender_profile?.full_name || initialMessage.sender_profile?.email || 'Client')
        : (otherUserInfo?.full_name || otherUserInfo?.email || 'Vendeur'))
    : '';

  if (!initialMessage) {
    return <Dialog open={false} onOpenChange={onOpenChange}><DialogContent className="hidden" /></Dialog>;
  }

  // Group messages by date
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return "Hier";
    return format(date, 'd MMMM yyyy', { locale: fr });
  };

  let lastDateLabel = '';

  // Render product card bubble (shared or order context)
  const renderProductCardInMessage = (isMe: boolean) => {
    if (!initialMessage.product) return null;
    return (
      <div 
        onClick={() => handleProductClick(initialMessage.product_id || '')} 
        className="cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className={`flex items-start gap-3 p-2.5 rounded-xl border min-w-[220px] ${
          isMe ? 'bg-primary-foreground/10 border-primary-foreground/20' : 'bg-muted/40 border-border/50'
        }`}>
          <img 
            src={getProductImage(initialMessage.product.images, 0)} 
            alt={initialMessage.product.title}
            className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-muted/30"
            onError={handleImageError}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold line-clamp-2 ${isMe ? 'text-primary-foreground' : 'text-foreground'}`}>
              {initialMessage.product.title}
            </p>
            {initialMessage.product.price && (
              <p className={`text-sm font-bold mt-0.5 ${isMe ? 'text-primary-foreground/90' : 'text-primary'}`}>
                {initialMessage.product.price.toLocaleString('fr-FR')} FCFA
              </p>
            )}
            <p className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
              <ExternalLink className="h-3 w-3" /> Voir le produit
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-3xl lg:max-w-4xl h-[100dvh] sm:h-[90vh] flex flex-col p-0 gap-0 rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-primary via-primary to-primary/90 safe-area-inset-top">
          <div className="px-3 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="flex-shrink-0 h-10 w-10 rounded-full hover:bg-white/20 text-primary-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                {userType === 'seller' ? <User className="h-5 w-5 text-primary-foreground" /> : <Store className="h-5 w-5 text-primary-foreground" />}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] truncate text-primary-foreground">{otherUserName}</p>
              <p className="text-xs text-primary-foreground/70 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                En ligne
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Pinned product banner */}
        {initialMessage.product && showProductBanner && (
          <div className="flex-shrink-0 bg-card border-b border-border/30">
            <div 
              className="flex items-center gap-3 px-3 py-2 cursor-pointer active:bg-muted/30 transition-colors"
              onClick={() => handleProductClick(initialMessage.product_id || '')}
            >
              <img 
                src={getProductImage(initialMessage.product.images, 0)} 
                alt={initialMessage.product.title}
                className="w-11 h-11 object-cover rounded-lg bg-muted/20 border border-border/30"
                onError={handleImageError}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate text-foreground">{initialMessage.product.title}</p>
                {initialMessage.product.price && (
                  <p className="text-[13px] text-primary font-bold">{initialMessage.product.price.toLocaleString('fr-FR')} FCFA</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); sendProductCard(); }}
                  disabled={sending}
                  className="h-8 px-2.5 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                  Partager
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); setShowProductBanner(false); }}
                  className="h-7 w-7 rounded-full text-muted-foreground"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed product indicator */}
        {initialMessage.product && !showProductBanner && (
          <button 
            onClick={() => setShowProductBanner(true)}
            className="flex-shrink-0 flex items-center justify-center gap-1.5 py-1.5 bg-primary/5 border-b border-border/20 text-xs text-primary font-medium hover:bg-primary/10 transition-colors"
          >
            <Package className="h-3 w-3" />
            {initialMessage.product.title}
          </button>
        )}

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/10 to-background overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="px-3 py-3 space-y-0.5 min-h-full flex flex-col justify-end">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-3"></div>
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <MessageSquare className="w-7 h-7 text-primary" />
                </div>
                <p className="text-center text-foreground font-semibold text-sm">Nouvelle conversation</p>
                <p className="text-center text-muted-foreground text-xs mt-1 max-w-[250px]">
                  {initialMessage.product 
                    ? `Discussion à propos de "${initialMessage.product.title}"`
                    : 'Envoyez un message pour démarrer'
                  }
                </p>
                {/* Auto product context card for new conversations */}
                {initialMessage.product && (
                  <div 
                    className="mt-4 w-full max-w-[280px] cursor-pointer"
                    onClick={() => handleProductClick(initialMessage.product_id || '')}
                  >
                    <div className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border/50 shadow-sm">
                      <img 
                        src={getProductImage(initialMessage.product.images, 0)} 
                        alt={initialMessage.product.title}
                        className="w-16 h-16 object-cover rounded-xl bg-muted/20"
                        onError={handleImageError}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-2 text-foreground">{initialMessage.product.title}</p>
                        {initialMessage.product.price && (
                          <p className="text-sm font-bold text-primary mt-1">{initialMessage.product.price.toLocaleString('fr-FR')} FCFA</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              messages.map((message, index) => {
                const isMe = message.sender_id === user?.id;
                const isNewGroup = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                
                // Date separator
                const dateLabel = getDateLabel(message.created_at);
                let showDateSeparator = false;
                if (dateLabel !== lastDateLabel) {
                  lastDateLabel = dateLabel;
                  showDateSeparator = true;
                }

                const isProductShare = message.content === '[PRODUCT_SHARE]';

                const isHighlighted = highlightedId === message.id;
                return (
                  <div
                    key={message.id}
                    ref={isHighlighted ? highlightedRef : undefined}
                    className={isHighlighted ? 'rounded-2xl ring-2 ring-primary/70 ring-offset-2 ring-offset-background animate-pulse transition-all' : ''}
                  >
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-3">
                        <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full font-medium">{dateLabel}</span>
                      </div>
                    )}
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isNewGroup ? 'mt-3' : 'mt-0.5'}`}>
                      <div className={`flex flex-col max-w-[82%] sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`relative px-3 py-2 ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm'
                              : 'bg-card text-foreground rounded-2xl rounded-bl-md border border-border/40 shadow-sm'
                          }`}
                        >
                          {isProductShare ? (
                            renderProductCardInMessage(isMe)
                          ) : message.content ? (
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                          ) : null}
                          
                          {message.media_url && message.media_type === 'image' && (
                            <div className={message.content && !isProductShare ? 'mt-1.5' : ''}>
                              <img 
                                src={message.media_url} alt={message.media_name || 'Image'} 
                                className="max-w-full h-auto rounded-xl cursor-pointer active:opacity-80"
                                onClick={() => window.open(message.media_url, '_blank')}
                              />
                            </div>
                          )}
                          
                          {message.media_url && message.media_type === 'video' && (
                            <div className={message.content && !isProductShare ? 'mt-1.5' : ''}>
                              <video controls className="max-w-full h-auto rounded-xl" preload="metadata" playsInline>
                                <source src={message.media_url} type="video/mp4" />
                              </video>
                            </div>
                          )}

                          <div className={`flex items-center justify-end gap-1 mt-1 -mb-0.5 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground/70'}`}>
                            <span className="text-[10px]">{format(new Date(message.created_at), 'HH:mm', { locale: fr })}</span>
                            {isMe && (
                              <span className="text-[10px]">{message.is_read ? '✓✓' : '✓'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 bg-card border-t border-border/30 safe-area-inset-bottom">
          {selectedFile && (
            <div className="px-3 py-2 bg-muted/30 border-b border-border/20">
              <div className="flex items-center gap-2.5 p-2 bg-card rounded-xl border border-border/40">
                <div className="flex-shrink-0">
                  {selectedFile.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <Button variant="ghost" size="icon" onClick={removeSelectedFile} className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          )}

          <div className="p-2.5 flex items-end gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-shrink-0 h-10 w-10 rounded-full bg-muted/40 hover:bg-muted text-muted-foreground"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <ChatInput 
                onSendMessage={handleSendClick}
                disabled={sending || uploading}
                placeholder="Votre message..."
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
