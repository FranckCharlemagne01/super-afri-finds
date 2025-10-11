import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send } from 'lucide-react';
import { ChatInput } from '@/components/ChatInput';
import { ChatDialog } from '@/components/ChatDialog';

interface ContactSellerButtonProps {
  productId: string;
  sellerId: string;
  productTitle: string;
  iconOnly?: boolean;
}

export const ContactSellerButton = ({ productId, sellerId, productTitle, iconOnly = false }: ContactSellerButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [sentMessage, setSentMessage] = useState<any>(null);

  // Pré-remplir les champs quand le dialogue s'ouvre
  useEffect(() => {
    if (open) {
      const defaultSubject = `Question sur le produit : ${productTitle}`;
      const defaultMessage = `Bonjour,

Je suis intéressé(e) par votre article "${productTitle}".
Pourriez-vous me dire s'il est toujours disponible ?
J'aimerais aussi avoir plus d'informations à son sujet.

Merci d'avance pour votre réponse.`;
      
      setSubject(defaultSubject);
      setMessage(defaultMessage);
    }
  }, [open, productTitle]);

  const handleSendMessage = async () => {
    if (!user) {
      setOpen(false);
      // Store current URL for redirect after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = '/auth';
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: sellerId,
          product_id: productId,
          subject,
          content: message,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Message envoyé",
        description: "Ouverture du chat...",
      });

      // Préparer les données pour le ChatDialog
      setSentMessage({
        id: data.id,
        sender_id: data.sender_id,
        recipient_id: data.recipient_id,
        product_id: data.product_id,
        subject: data.subject,
        content: data.content,
        product: {
          title: productTitle,
        },
      });

      setSubject('');
      setMessage('');
      setOpen(false);
      
      // Ouvrir le ChatDialog
      setTimeout(() => setChatOpen(true), 300);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className={iconOnly ? "p-2 min-w-[44px] min-h-[44px] flex-1" : "w-full min-h-[44px]"} 
            size="sm"
          >
            <MessageSquare className="w-4 h-4" />
            {!iconOnly && <span className="ml-2">Contacter le vendeur</span>}
          </Button>
        </DialogTrigger>
        <DialogContent className="mx-4 sm:mx-auto w-[calc(100%-2rem)] sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Contacter le vendeur
            </DialogTitle>
            <DialogDescription className="text-sm">
              Envoyez un message concernant "{productTitle}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-semibold">Sujet</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Question sur le produit..."
                className="min-h-[44px] text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-semibold">Message</Label>
              <ChatInput
                value={message}
                onChange={setMessage}
                onSend={handleSendMessage}
                placeholder="Bonjour, j'aimerais en savoir plus sur ce produit..."
                disabled={loading}
                minHeight="100px"
                maxHeight="200px"
              />
            </div>
          </div>
          
          <div className="border-t bg-background px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="flex-1 min-h-[44px]"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={loading || !message.trim() || !subject.trim()} 
              className="flex-1 min-h-[44px] gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {sentMessage && (
        <ChatDialog
          initialMessage={sentMessage}
          open={chatOpen}
          onOpenChange={setChatOpen}
          userType="buyer"
        />
      )}
    </>
  );
};