import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Send, User, Store, Package, Paperclip, X, ArrowLeft, ShoppingBag, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChatInput } from '@/components/ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { useMessageThread, generateThreadId, Message } from '@/hooks/useMessageThread';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine seller and buyer IDs
  const sellerId = userType === 'seller' ? user?.id || '' : initialMessage?.recipient_id || '';
  const buyerId = userType === 'buyer' ? user?.id || '' : initialMessage?.sender_id || '';

  // Use the message thread hook
  const { messages, loading, sending, sendMessage } = useMessageThread({
    sellerId,
    buyerId,
    productId: initialMessage?.product_id,
    enabled: open && !!initialMessage && !!user,
  });

  // Fetch other user info
  useEffect(() => {
    if (!open || !initialMessage || !user) return;
    
    const fetchOtherUserInfo = async () => {
      const otherUserId = userType === 'seller' ? initialMessage.sender_id : initialMessage.recipient_id;
      if (!otherUserId || otherUserId === user.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', otherUserId)
          .single();

        if (error) throw error;
        setOtherUserInfo(data);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchOtherUserInfo();
  }, [open, initialMessage, user, userType]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader le fichier",
        variant: "destructive",
      });
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
      mediaUrl || undefined,
      mediaType,
      mediaName || undefined,
      `Re: ${initialMessage.subject || 'Message'}`
    );

    if (success) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const sendProductCard = async () => {
    if (!initialMessage?.product || !user) return;
    await sendMessage('[PRODUCT_SHARE]', undefined, undefined, undefined, `Re: ${initialMessage.subject || 'Message'}`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast({
          title: "Type de fichier non supporté",
          description: "Seules les images et vidéos sont acceptées",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 50MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  if (!initialMessage) return null;

  const otherUserName = userType === 'seller' 
    ? (initialMessage.sender_profile?.full_name || initialMessage.sender_profile?.email || 'Client')
    : (otherUserInfo?.full_name || otherUserInfo?.email || 'Vendeur');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-3xl lg:max-w-4xl h-[100dvh] sm:h-[90vh] flex flex-col p-0 gap-0 rounded-none sm:rounded-2xl overflow-hidden">
        {/* Header - Fixed - Style Native Messenger */}
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
              <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                {userType === 'seller' ? (
                  <User className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <Store className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-primary rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base truncate text-primary-foreground">{otherUserName}</p>
              <p className="text-xs text-primary-foreground/80 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                En ligne
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Messages Area - Style Native Messenger */}
        <ScrollArea className="flex-1 bg-gradient-to-b from-muted/30 to-muted/10">
          <div className="px-3 py-4 space-y-0.5 min-h-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mb-4"></div>
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 border border-border/50">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <p className="text-center text-foreground font-semibold mb-1">
                  Nouvelle conversation
                </p>
                <p className="text-center text-muted-foreground text-sm">
                  Envoyez un message pour démarrer !
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isMe = message.sender_id === user?.id;
                const showTime = index === messages.length - 1 || 
                  messages[index + 1]?.sender_id !== message.sender_id ||
                  new Date(messages[index + 1]?.created_at).getTime() - new Date(message.created_at).getTime() > 300000;
                
                const isNewGroup = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isNewGroup ? 'mt-3' : 'mt-0.5'}`}
                  >
                    <div className={`flex flex-col max-w-[82%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Message Bubble - Native Style */}
                      <div
                        className={`relative px-3.5 py-2.5 ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm'
                            : 'bg-card text-foreground rounded-2xl rounded-bl-md border border-border/50 shadow-sm'
                        }`}
                      >
                        {/* Product Share Card */}
                        {message.content === '[PRODUCT_SHARE]' && initialMessage.product ? (
                          <div 
                            onClick={() => handleProductClick(initialMessage.product_id || '')}
                            className="cursor-pointer active:opacity-80 transition-opacity"
                          >
                            <div className="flex items-start gap-2.5 p-2 bg-background/80 rounded-xl border border-border/50 min-w-[200px] max-w-[260px]">
                              <img 
                                src={initialMessage.product.images?.[0] || '/placeholder.svg'} 
                                alt={initialMessage.product.title}
                                className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                                onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold line-clamp-2 text-foreground">
                                  {initialMessage.product.title}
                                </p>
                                {initialMessage.product.price && (
                                  <p className="text-sm font-bold text-primary mt-0.5">
                                    {initialMessage.product.price.toLocaleString('fr-FR')} FCFA
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] mt-1.5 opacity-60 flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Appuyez pour voir le produit
                            </p>
                          </div>
                        ) : message.content ? (
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        ) : null}
                        
                        {/* Media content */}
                        {message.media_url && message.media_type === 'image' && (
                          <div className={message.content && message.content !== '[PRODUCT_SHARE]' ? 'mt-2' : ''}>
                            <img 
                              src={message.media_url} 
                              alt={message.media_name || 'Image'} 
                              className="max-w-full h-auto rounded-xl cursor-pointer active:opacity-80 transition-opacity"
                              onClick={() => window.open(message.media_url, '_blank')}
                            />
                          </div>
                        )}
                        
                        {message.media_url && message.media_type === 'video' && (
                          <div className={message.content && message.content !== '[PRODUCT_SHARE]' ? 'mt-2' : ''}>
                            <video 
                              controls 
                              className="max-w-full h-auto rounded-xl"
                              preload="metadata"
                              playsInline
                            >
                              <source src={message.media_url} type="video/mp4" />
                            </video>
                          </div>
                        )}

                        {/* Time inside bubble */}
                        <div className={`flex items-center justify-end gap-1.5 mt-1.5 -mb-0.5 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          <span className="text-[10px]">
                            {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                          </span>
                          {isMe && (
                            <span className="text-[10px]">✓✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </ScrollArea>

        {/* Product card preview */}
        {initialMessage.product && (
          <div className="flex-shrink-0 px-4 py-2 border-t bg-muted/30">
            <div 
              className="flex items-center gap-3 p-2 bg-card rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleProductClick(initialMessage.product_id || '')}
            >
              <img 
                src={initialMessage.product.images?.[0] || '/placeholder.svg'} 
                alt={initialMessage.product.title}
                className="w-10 h-10 object-cover rounded-md"
                onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{initialMessage.product.title}</p>
                {initialMessage.product.price && (
                  <p className="text-xs text-primary font-bold">
                    {initialMessage.product.price.toLocaleString('fr-FR')} FCFA
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  sendProductCard();
                }}
                className="text-xs"
                disabled={sending}
              >
                <ShoppingBag className="h-3 w-3 mr-1" />
                Partager
              </Button>
            </div>
          </div>
        )}

        {/* Input Area - Style Native Messenger */}
        <div className="flex-shrink-0 bg-card border-t border-border/50 safe-area-inset-bottom">
          {/* Selected file preview */}
          {selectedFile && (
            <div className="px-3 py-2 bg-card border-b border-border/30">
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-xl">
                <div className="flex-shrink-0">
                  {selectedFile.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Preview" 
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
                      <Paperclip className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeSelectedFile}
                  className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          )}

          <div className="p-2.5 flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-shrink-0 h-11 w-11 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground"
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
