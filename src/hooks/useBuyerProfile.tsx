import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  full_name: string;
  phone: string;
  email: string;
}

interface Order {
  id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  quantity: number;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  delivery_location: string;
  created_at: string;
  updated_at: string;
}

export const useBuyerProfile = (userId: string | undefined) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>({ full_name: '', phone: '', email: '' });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch profile data immediately
  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setLoadingProfile(true);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;
      
      const userProfile = {
        full_name: profileData?.full_name || '',
        phone: profileData?.phone || '',
        email: profileData?.email || ''
      };
      
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  // Fetch orders data in background
  const fetchOrders = useCallback(async () => {
    if (!userId) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setLoadingOrders(true);
      
      const { data: ordersData, error: ordersError } = await supabase.rpc('get_seller_orders');
      
      if (ordersError) throw ordersError;
      
      const customerOrders = ordersData?.filter(order => order.customer_id === userId) || [];
      setOrders(customerOrders);
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Error fetching orders:', error);
      }
    } finally {
      setLoadingOrders(false);
    }
  }, [userId]);

  const updateProfile = async (updatedProfile: UserProfile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedProfile.full_name,
          phone: updatedProfile.phone,
        })
        .eq('user_id', userId);

      if (error) throw error;

      setProfile(updatedProfile);
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès",
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase.rpc('cancel_order_by_customer', {
        order_id: orderId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; seller_id?: string; customer_name?: string; product_title?: string };

      if (!result.success) {
        toast({
          title: "Impossible d'annuler",
          description: result.error || "Erreur inconnue",
          variant: "destructive",
        });
        return { success: false };
      }

      if (result.seller_id) {
        await supabase
          .from('messages')
          .insert({
            sender_id: userId,
            recipient_id: result.seller_id,
            subject: 'Commande annulée',
            content: `Le client ${result.customer_name} a annulé sa commande pour "${result.product_title}". La commande a été automatiquement marquée comme annulée.`,
            is_read: false
          });
      }

      toast({
        title: "✅ Commande annulée",
        description: "Votre commande a été annulée avec succès. Le vendeur a été notifié.",
      });

      await fetchOrders();
      return { success: true };
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la commande. Veuillez réessayer.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  useEffect(() => {
    if (userId) {
      // Fetch profile immediately
      fetchProfile();
      
      // Fetch orders in background after a small delay
      const timer = setTimeout(() => {
        fetchOrders();
      }, 100);

      return () => {
        clearTimeout(timer);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [userId, fetchProfile, fetchOrders]);

  return {
    profile,
    orders,
    loadingProfile,
    loadingOrders,
    loading: loadingProfile || loadingOrders,
    updateProfile,
    cancelOrder,
    refreshOrders: fetchOrders,
  };
};
