import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TrialStatus {
  isInTrial: boolean;
  trialEndDate: Date | null;
  canPublish: boolean;
  isPremium: boolean;
  loading: boolean;
}

export const useTrialStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<TrialStatus>({
    isInTrial: false,
    trialEndDate: null,
    canPublish: false,
    isPremium: false,
    loading: true,
  });

  useEffect(() => {
    const fetchTrialStatus = async () => {
      if (!user) {
        setStatus({
          isInTrial: false,
          trialEndDate: null,
          canPublish: false,
          isPremium: false,
          loading: false,
        });
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('trial_end_date, trial_used, is_premium, premium_expires_at')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching trial status:', error);
          setStatus(prev => ({ ...prev, loading: false }));
          return;
        }

        const now = new Date();
        const trialEndDate = profile.trial_end_date ? new Date(profile.trial_end_date) : null;
        const premiumExpiresAt = profile.premium_expires_at ? new Date(profile.premium_expires_at) : null;
        
        const isInTrial = !profile.trial_used && trialEndDate && trialEndDate > now;
        const isPremium = profile.is_premium && premiumExpiresAt && premiumExpiresAt > now;
        const canPublish = isInTrial || isPremium;

        setStatus({
          isInTrial,
          trialEndDate,
          canPublish,
          isPremium,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching trial status:', error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    fetchTrialStatus();
  }, [user]);

  return status;
};