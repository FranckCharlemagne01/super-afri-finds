import { useEffect, useRef } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, User } from 'lucide-react';

interface NewMessage {
  id: string;
  sender_id: string;
  content: string;
  subject?: string;
  created_at: string;
}

export const RealtimeMessagesNotification = () => {
  const { userId } = useStableAuth();
  const { toast } = useToast();
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('seller-new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        async (payload) => {
          const newMessage = payload.new as NewMessage;
          
          // Éviter les doublons
          if (lastMessageIdRef.current === newMessage.id) return;
          lastMessageIdRef.current = newMessage.id;

          // Récupérer le nom de l'expéditeur
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', newMessage.sender_id)
            .single();

          const senderName = senderProfile?.full_name || senderProfile?.email || 'Un client';

          // Afficher la notification toast
          toast({
            title: "💬 Nouveau message reçu !",
            description: (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">{senderName}</span>
                </div>
                {newMessage.subject && (
                  <div className="text-sm font-medium text-foreground">
                    {newMessage.subject}
                  </div>
                )}
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {newMessage.content}
                </div>
              </div>
            ),
            duration: 6000,
          });

          // Vibrer si disponible (mobile)
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  return null;
};
