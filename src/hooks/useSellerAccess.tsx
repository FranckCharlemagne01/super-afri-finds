import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from './useStableAuth';

export interface SellerAccessStatus {
  canAccess: boolean;
  isInTrial: boolean;
  trialDaysLeft: number;
  trialEndDate: Date | null;
  hasActiveSubscription: boolean;
  subscriptionEnd: Date | null;
  subscriptionStatus: string;
  loading: boolean;
  error: string | null;
}

interface AccessData {
  can_access: boolean;
  is_in_trial: boolean;
  trial_days_left: number;
  trial_end_date: string | null;
  has_active_subscription: boolean;
  subscription_end: string | null;
  subscription_status: string;
}

export const useSellerAccess = () => {
  const { userId } = useStableAuth();
  const [status, setStatus] = useState<SellerAccessStatus>({
    canAccess: false,
    isInTrial: false,
    trialDaysLeft: 0,
    trialEndDate: null,
    hasActiveSubscription: false,
    subscriptionEnd: null,
    subscriptionStatus: 'none',
    loading: true,
    error: null,
  });

  const fetchAccessStatus = useCallback(async () => {
    if (!userId) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.rpc('can_access_seller_features', {
        _user_id: userId
      });

      if (error) {
        console.error('Error fetching seller access status:', error);
        setStatus(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        return;
      }

      if (data) {
        // Cast data to the expected type
        const accessData = data as unknown as AccessData;
        
        setStatus({
          canAccess: accessData.can_access || false,
          isInTrial: accessData.is_in_trial || false,
          trialDaysLeft: accessData.trial_days_left || 0,
          trialEndDate: accessData.trial_end_date ? new Date(accessData.trial_end_date) : null,
          hasActiveSubscription: accessData.has_active_subscription || false,
          subscriptionEnd: accessData.subscription_end ? new Date(accessData.subscription_end) : null,
          subscriptionStatus: accessData.subscription_status || 'none',
          loading: false,
          error: null,
        });
      }
    } catch (err: any) {
      console.error('Error in useSellerAccess:', err);
      setStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message 
      }));
    }
  }, [userId]);

  useEffect(() => {
    fetchAccessStatus();
  }, [fetchAccessStatus]);

  const refresh = useCallback(() => {
    setStatus(prev => ({ ...prev, loading: true }));
    fetchAccessStatus();
  }, [fetchAccessStatus]);

  return { ...status, refresh };
};
