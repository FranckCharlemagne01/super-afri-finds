import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { User, Store, Package, Paperclip, X, ArrowLeft, ShoppingBag, MessageSquare } from 'lucide-react';
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
}

export const ChatDialog = ({ initialMessage, open, onOpenChange, userType }: ChatDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [otherUserInfo, setOtherUserInfo] = useState<{ full_name?: string; email?: string } | null>(null);
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

  // Scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-3xl lg:max-w-4xl h-[100dvh] sm:h-[90vh] flex flex-col p-0 gap-0 rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 bg-gradient-to-r from-primary via-primary to-primary-hover safe-area-inset-top">
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

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/20 to-background overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="px-3 py-3 space-y-0.5 min-h-full flex flex-col justify-end">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-3"></div>
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <p className="text-center text-foreground font-semibold text-sm">Nouvelle conversation</p>
                <p className="text-center text-muted-foreground text-xs mt-1">Envoyez un message pour démarrer</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isMe = message.sender_id === user?.id;
                const showTime = index === messages.length - 1 || 
                  messages[index + 1]?.sender_id !== message.sender_id ||
                  new Date(messages[index + 1]?.created_at).getTime() - new Date(message.created_at).getTime() > 300000;
                const isNewGroup = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                
                // Date separator
                const dateLabel = getDateLabel(message.created_at);
                let showDateSeparator = false;
                if (dateLabel !== lastDateLabel) {
                  lastDateLabel = dateLabel;
                  showDateSeparator = true;
                }

                return (
                  <div key={message.id}>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-3">
                        <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full font-medium">{dateLabel}</span>
                      </div>
                    )}
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isNewGroup ? 'mt-2.5' : 'mt-0.5'}`}>
                      <div className={`flex flex-col max-w-[80%] sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`relative px-3 py-2 ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                              : 'bg-card text-foreground rounded-2xl rounded-bl-sm border border-border/40 shadow-sm'
                          }`}
                        >
                          {message.content === '[PRODUCT_SHARE]' && initialMessage.product ? (
                            <div onClick={() => handleProductClick(initialMessage.product_id || '')} className="cursor-pointer active:opacity-80">
                              <div className="flex items-start gap-2.5 p-2 bg-background/80 rounded-xl border border-border/50 min-w-[180px]">
                                <img 
                                  src={getProductImage(initialMessage.product.images, 0)} 
                                  alt={initialMessage.product.title}
                                  className="w-12 h-12 object-contain rounded-lg flex-shrink-0 bg-muted/20"
                                  onError={handleImageError}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold line-clamp-2 text-foreground">{initialMessage.product.title}</p>
                                  {initialMessage.product.price && (
                                    <p className="text-sm font-bold text-primary mt-0.5">{initialMessage.product.price.toLocaleString('fr-FR')} F</p>
                                  )}
                                </div>
                              </div>
                              <p className="text-[10px] mt-1 opacity-50 flex items-center gap-1">
                                <Package className="h-3 w-3" /> Voir le produit
                              </p>
                            </div>
                          ) : message.content ? (
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                          ) : null}
                          
                          {message.media_url && message.media_type === 'image' && (
                            <div className={message.content && message.content !== '[PRODUCT_SHARE]' ? 'mt-1.5' : ''}>
                              <img 
                                src={message.media_url} alt={message.media_name || 'Image'} 
                                className="max-w-full h-auto rounded-xl cursor-pointer active:opacity-80"
                                onClick={() => window.open(message.media_url, '_blank')}
                              />
                            </div>
                          )}
                          
                          {message.media_url && message.media_type === 'video' && (
                            <div className={message.content && message.content !== '[PRODUCT_SHARE]' ? 'mt-1.5' : ''}>
                              <video controls className="max-w-full h-auto rounded-xl" preload="metadata" playsInline>
                                <source src={message.media_url} type="video/mp4" />
                              </video>
                            </div>
                          )}

                          <div className={`flex items-center justify-end gap-1 mt-1 -mb-0.5 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground/70'}`}>
                            <span className="text-[10px]">{format(new Date(message.created_at), 'HH:mm', { locale: fr })}</span>
                            {isMe && <span className="text-[10px]">✓✓</span>}
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

        {/* Product preview bar */}
        {initialMessage.product && (
          <div className="flex-shrink-0 px-3 py-2 border-t border-border/30 bg-muted/20">
            <div 
              className="flex items-center gap-2.5 p-2 bg-card rounded-lg border border-border/40 cursor-pointer active:bg-muted/50 transition-colors"
              onClick={() => handleProductClick(initialMessage.product_id || '')}
            >
              <img 
                src={getProductImage(initialMessage.product.images, 0)} 
                alt={initialMessage.product.title}
                className="w-9 h-9 object-contain rounded-md bg-muted/20"
                onError={handleImageError}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{initialMessage.product.title}</p>
                {initialMessage.product.price && (
                  <p className="text-xs text-primary font-bold">{initialMessage.product.price.toLocaleString('fr-FR')} F</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); sendProductCard(); }}
                className="text-xs h-8 px-2"
                disabled={sending}
              >
                <ShoppingBag className="h-3 w-3 mr-1" />
                Partager
              </Button>
            </div>
          </div>
        )}

        {/* Input */}
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