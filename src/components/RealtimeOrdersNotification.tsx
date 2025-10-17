import { useEffect, useRef } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Package } from 'lucide-react';

interface NewOrder {
  id: string;
  customer_name: string;
  product_title: string;
  total_amount: number;
  created_at: string;
}

export const RealtimeOrdersNotification = () => {
  const { userId } = useStableAuth();
  const { toast } = useToast();
  const lastOrderIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Créer un son de notification (optionnel)
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjeL0fPTgjMGHm7A7+OZS');
    
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('seller-new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${userId}`
        },
        (payload) => {
          const newOrder = payload.new as NewOrder;
          
          // Éviter les doublons
          if (lastOrderIdRef.current === newOrder.id) return;
          lastOrderIdRef.current = newOrder.id;

          // Jouer le son de notification
          if (audioRef.current) {
            audioRef.current.play().catch(() => {
              // Silently fail if audio can't play
            });
          }

          // Afficher la notification toast
          toast({
            title: "🛒 Nouvelle commande reçue !",
            description: (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-medium">{newOrder.product_title}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Client: {newOrder.customer_name}
                </div>
                <div className="text-sm font-bold text-primary">
                  Montant: {newOrder.total_amount.toLocaleString()} FCFA
                </div>
              </div>
            ),
            duration: 8000,
          });

          // Vibrer si disponible (mobile)
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
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
