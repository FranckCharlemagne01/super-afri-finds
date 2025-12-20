import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from './useStableAuth';

export interface SellerAccessStatus {
  // Dashboard access - always allowed for sellers
  canAccessDashboard: boolean;
  // Action permissions - blocked when subscription expired
  canPublish: boolean;
  canEdit: boolean;
  canBoost: boolean;
  // Legacy field for backwards compatibility
  canAccess: boolean;
  // Subscription status
  isInTrial: boolean;
  trialDaysLeft: number;
  trialEndDate: Date | null;
  hasActiveSubscription: boolean;
  subscriptionEnd: Date | null;
  subscriptionStatus: string;
  subscriptionExpired: boolean;
  // Loading/error states
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
    canAccessDashboard: true,
    canPublish: false,
    canEdit: false,
    canBoost: false,
    canAccess: false,
    isInTrial: false,
    trialDaysLeft: 0,
    trialEndDate: null,
    hasActiveSubscription: false,
    subscriptionEnd: null,
    subscriptionStatus: 'none',
    subscriptionExpired: false,
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
          error: error.message,
          canAccessDashboard: true, // Always allow dashboard access
        }));
        return;
      }

      if (data) {
        const accessData = data as unknown as AccessData;
        
        // Determine if subscription is expired (not in trial AND no active subscription)
        const isInTrial = accessData.is_in_trial || false;
        const hasActiveSubscription = accessData.has_active_subscription || false;
        const canPerformActions = accessData.can_access || false;
        const subscriptionExpired = !isInTrial && !hasActiveSubscription;
        
        setStatus({
          canAccessDashboard: true, // Always allow dashboard access for sellers
          canPublish: canPerformActions,
          canEdit: canPerformActions,
          canBoost: canPerformActions,
          canAccess: canPerformActions, // Legacy compatibility
          isInTrial,
          trialDaysLeft: accessData.trial_days_left || 0,
          trialEndDate: accessData.trial_end_date ? new Date(accessData.trial_end_date) : null,
          hasActiveSubscription,
          subscriptionEnd: accessData.subscription_end ? new Date(accessData.subscription_end) : null,
          subscriptionStatus: accessData.subscription_status || 'none',
          subscriptionExpired,
          loading: false,
          error: null,
        });
      }
    } catch (err: any) {
      console.error('Error in useSellerAccess:', err);
      setStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message,
        canAccessDashboard: true, // Always allow dashboard access
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
