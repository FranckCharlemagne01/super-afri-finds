import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const usePremiumStatus = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_premium, premium_expires_at')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking premium status:', error);
          setIsPremium(false);
        } else {
          const isPremiumActive = data?.is_premium && 
            (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date());
          setIsPremium(isPremiumActive || false);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();

    // Set up real-time subscription for premium status changes
    if (user) {
      const channel = supabase
        .channel('premium-status')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            checkPremiumStatus();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const refreshPremiumStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium, premium_expires_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error refreshing premium status:', error);
        return;
      }

      const isPremiumActive = data?.is_premium && 
        (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date());
      setIsPremium(isPremiumActive || false);
    } catch (error) {
      console.error('Error refreshing premium status:', error);
    }
  };

  return {
    isPremium,
    loading,
    refreshPremiumStatus,
  };
};