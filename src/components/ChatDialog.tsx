import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Send, User, Store, Package, Paperclip, X, ArrowLeft, ShoppingBag } from 'lucide-react';
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
      <DialogContent className="max-w-full sm:max-w-3xl lg:max-w-4xl h-[100vh] sm:h-[90vh] flex flex-col p-0 gap-0">
        {/* Header - Fixed */}
        <DialogHeader className="flex-shrink-0 border-b bg-background">
          <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-primary/5 to-accent/5 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="flex-shrink-0 h-10 w-10 rounded-full hover:bg-background/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                {userType === 'seller' ? (
                  <User className="h-5 w-5 text-primary" />
                ) : (
                  <Store className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base sm:text-lg truncate">{otherUserName}</p>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                En ligne
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-3 sm:px-4 bg-gradient-to-b from-muted/5 to-muted/20">
          <div className="space-y-3 py-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Démarrez la conversation !</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isMe = message.sender_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id;
                const showTime = index === messages.length - 1 || 
                  messages[index + 1]?.sender_id !== message.sender_id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    {!isMe && showAvatar && (
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-sm border border-border/50">
                        <Store className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    {!isMe && !showAvatar && <div className="w-9 flex-shrink-0" />}
                    
                    <div className={`flex flex-col max-w-[80%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-4 py-2.5 shadow-sm transition-all duration-200 ${
                          isMe
                            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-md'
                            : 'bg-card border border-border/50 rounded-2xl rounded-bl-md'
                        }`}
                      >
                        {/* Product Share Card */}
                        {message.content === '[PRODUCT_SHARE]' && initialMessage.product ? (
                          <div 
                            onClick={() => handleProductClick(initialMessage.product_id || '')}
                            className="cursor-pointer hover:opacity-90 transition-opacity"
                          >
                            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border-2 border-primary/20 min-w-[240px] max-w-[280px]">
                              {initialMessage.product.images?.[0] && (
                                <img 
                                  src={initialMessage.product.images[0]} 
                                  alt={initialMessage.product.title}
                                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold line-clamp-2 mb-1">
                                  {initialMessage.product.title}
                                </p>
                                {initialMessage.product.price && (
                                  <p className="text-base font-bold text-primary">
                                    {initialMessage.product.price.toLocaleString('fr-FR')} FCFA
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-xs mt-1 opacity-70 flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Cliquez pour voir le produit
                            </p>
                          </div>
                        ) : message.content ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        ) : null}
                        
                        {/* Media content */}
                        {message.media_url && message.media_type === 'image' && (
                          <div className={message.content && message.content !== '[PRODUCT_SHARE]' ? 'mt-2' : ''}>
                            <img 
                              src={message.media_url} 
                              alt={message.media_name || 'Image'} 
                              className="max-w-full h-auto rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(message.media_url, '_blank')}
                            />
                          </div>
                        )}
                        
                        {message.media_url && message.media_type === 'video' && (
                          <div className={message.content && message.content !== '[PRODUCT_SHARE]' ? 'mt-2' : ''}>
                            <video 
                              controls 
                              className="max-w-full h-auto rounded-lg border"
                              preload="metadata"
                            >
                              <source src={message.media_url} type="video/mp4" />
                            </video>
                          </div>
                        )}
                      </div>
                      
                      {/* Time */}
                      {showTime && (
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {isMe && showAvatar && (
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    {isMe && !showAvatar && <div className="w-9 flex-shrink-0" />}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Product card preview */}
        {initialMessage.product && (
          <div className="flex-shrink-0 px-4 py-2 border-t bg-muted/30">
            <div 
              className="flex items-center gap-3 p-2 bg-card rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleProductClick(initialMessage.product_id || '')}
            >
              {initialMessage.product.images?.[0] && (
                <img 
                  src={initialMessage.product.images[0]} 
                  alt={initialMessage.product.title}
                  className="w-10 h-10 object-cover rounded-md"
                />
              )}
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

        {/* Input Area */}
        <div className="flex-shrink-0 border-t bg-background">
          {/* Selected file preview */}
          {selectedFile && (
            <div className="px-4 py-2 border-b bg-muted/30">
              <div className="flex items-center gap-2 p-2 bg-card rounded-lg border">
                <div className="flex-shrink-0">
                  {selectedFile.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Preview" 
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeSelectedFile}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="p-4 flex items-end gap-2">
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
              className="flex-shrink-0 h-10 w-10 rounded-full"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <div className="flex-1">
              <ChatInput 
                onSendMessage={handleSendClick}
                disabled={sending || uploading}
                placeholder="Écrivez votre message..."
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
