import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Send, User, Store, Package, Paperclip, Image as ImageIcon, Video, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  product_id?: string;
  subject?: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  media_name?: string;
  is_read: boolean;
  created_at: string;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [otherUserInfo, setOtherUserInfo] = useState<{ full_name?: string; email?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && initialMessage) {
      fetchConversation();
      fetchOtherUserInfo();
    }
  }, [open, initialMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!open || !initialMessage) return;

    // Real-time subscription for new messages
    const channel = supabase
      .channel(`chat-${initialMessage.product_id || 'general'}-${initialMessage.sender_id}-${initialMessage.recipient_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user?.id},recipient_id.eq.${getOtherUserId()}),and(sender_id.eq.${getOtherUserId()},recipient_id.eq.${user?.id}))`
        },
        (payload) => {
          const newMsg = {
            ...payload.new,
            media_type: payload.new.media_type as 'image' | 'video' | undefined
          } as Message;
          setMessages(prev => [...prev, newMsg]);
          
          // Mark as read if I'm the recipient
          if (newMsg.recipient_id === user?.id) {
            markAsRead(newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, initialMessage, user]);

  const getOtherUserId = () => {
    if (!initialMessage || !user) return '';
    return initialMessage.sender_id === user.id ? initialMessage.recipient_id : initialMessage.sender_id;
  };

  const fetchConversation = async () => {
    if (!initialMessage || !user) return;

    try {
      const otherUserId = getOtherUserId();
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .eq('product_id', initialMessage.product_id || null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        media_type: msg.media_type as 'image' | 'video' | undefined
      })));

      // Mark unread messages as read
      const unreadMessages = data?.filter(msg => 
        msg.recipient_id === user.id && !msg.is_read
      ) || [];
      
      for (const msg of unreadMessages) {
        await markAsRead(msg.id);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const fetchOtherUserInfo = async () => {
    const otherUserId = getOtherUserId();
    if (!otherUserId) return;

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

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user?.id);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
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

  const sendMessage = async (mediaFile?: File) => {
    if ((!newMessage.trim() && !mediaFile) || !initialMessage || !user) return;

    setSending(true);
    try {
      let mediaUrl = null;
      let mediaType = null;
      let mediaName = null;

      if (mediaFile) {
        mediaUrl = await uploadFile(mediaFile);
        if (!mediaUrl) {
          setSending(false);
          return;
        }
        mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
        mediaName = mediaFile.name;
      }

      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: getOtherUserId(),
          product_id: initialMessage.product_id || null,
          subject: `Re: ${initialMessage.subject || 'Message'}`,
          content: newMessage.trim() || (mediaFile ? `📎 ${mediaFile.name}` : ''),
          media_url: mediaUrl,
          media_type: mediaType,
          media_name: mediaName,
        }]);

      if (error) throw error;

      setNewMessage('');
      setSelectedFile(null);
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type et la taille du fichier
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

      if (file.size > 50 * 1024 * 1024) { // 50MB max
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

  const handleSendClick = () => {
    if (selectedFile) {
      sendMessage(selectedFile);
    } else {
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  if (!initialMessage) return null;

  const otherUserName = userType === 'seller' 
    ? (initialMessage.sender_profile?.full_name || initialMessage.sender_profile?.email || 'Client')
    : (otherUserInfo?.full_name || otherUserInfo?.email || 'Vendeur');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-2xl h-[80vh] flex flex-col mx-4">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            {userType === 'seller' ? (
              <>
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Chat avec {otherUserName}
              </>
            ) : (
              <>
                <Store className="h-4 w-4 sm:h-5 sm:w-5" />
                Chat avec {otherUserName}
              </>
            )}
          </DialogTitle>
          
          {initialMessage.product && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs sm:text-sm">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Produit: {initialMessage.product.title}</span>
            </div>
          )}
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-muted/20 rounded">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border'
                }`}
              >
                {/* Message content */}
                {message.content && (
                  <p className="whitespace-pre-wrap break-words mb-2">
                    {message.content}
                  </p>
                )}
                
                {/* Media content */}
                {message.media_url && message.media_type === 'image' && (
                  <div className="mt-2">
                    <img 
                      src={message.media_url} 
                      alt={message.media_name || 'Image'} 
                      className="max-w-full h-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(message.media_url, '_blank')}
                    />
                    {message.media_name && (
                      <p className="text-xs mt-1 opacity-70">{message.media_name}</p>
                    )}
                  </div>
                )}
                
                {message.media_url && message.media_type === 'video' && (
                  <div className="mt-2">
                    <video 
                      controls 
                      className="max-w-full h-auto rounded border"
                      preload="metadata"
                    >
                      <source src={message.media_url} type="video/mp4" />
                      Votre navigateur ne supporte pas la lecture vidéo.
                    </video>
                    {message.media_name && (
                      <p className="text-xs mt-1 opacity-70">{message.media_name}</p>
                    )}
                  </div>
                )}
                
                <p className={`text-xs mt-2 ${
                  message.sender_id === user?.id
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                }`}>
                  {format(new Date(message.created_at), 'dd MMM à HH:mm', { locale: fr })}
                  {message.sender_id === user?.id && !message.is_read && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Envoyé
                    </Badge>
                  )}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="flex-shrink-0 space-y-2 border-t pt-4">
          {/* File preview */}
          {selectedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded border">
              {selectedFile.type.startsWith('image/') ? (
                <ImageIcon className="h-4 w-4 text-blue-500" />
              ) : (
                <Video className="h-4 w-4 text-purple-500" />
              )}
              <span className="text-sm font-medium flex-1 truncate">
                {selectedFile.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeSelectedFile}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message... (Entrée pour envoyer)"
            rows={3}
            className="resize-none"
          />
          
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
                className="text-xs"
              >
                <Paperclip className="h-3 w-3 mr-1" />
                Média
              </Button>
              <p className="text-xs text-muted-foreground">
                Entrée pour envoyer
              </p>
            </div>
            <Button
              onClick={handleSendClick}
              disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Envoi...' : uploading ? 'Upload...' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};