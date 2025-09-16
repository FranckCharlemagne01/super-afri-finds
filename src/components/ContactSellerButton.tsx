import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';

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
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: sellerId,
          product_id: productId,
          subject,
          content: message,
        }]);

      if (error) throw error;

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé au vendeur",
      });

      setSubject('');
      setMessage('');
      setOpen(false);
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
      <DialogContent className="mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Contacter le vendeur</DialogTitle>
          <DialogDescription className="text-sm">
            Envoyez un message au vendeur concernant "{productTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">Sujet</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Question sur le produit..."
              className="min-h-[44px] text-base"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bonjour, j'aimerais en savoir plus sur ce produit..."
              rows={4}
              className="min-h-[100px] text-base resize-none"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 min-h-[44px]">
              Annuler
            </Button>
            <Button onClick={handleSendMessage} disabled={loading} className="flex-1 min-h-[44px]">
              {loading ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};