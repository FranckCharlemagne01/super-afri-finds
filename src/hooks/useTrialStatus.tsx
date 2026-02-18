import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TrialStatus {
  isInTrial: boolean;
  trialEndDate: Date | null;
  canPublish: boolean;
  isPremium: boolean;
  hasTokens: boolean;
  loading: boolean;
}

export const useTrialStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<TrialStatus>({
    isInTrial: false,
    trialEndDate: null,
    canPublish: false,
    isPremium: false,
    hasTokens: false,
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
          hasTokens: false,
          loading: false,
        });
        return;
      }

      try {
        // Fetch profile and token balance in parallel
        const [profileResult, tokensResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('trial_end_date, trial_used, is_premium, premium_expires_at')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('seller_tokens')
            .select('token_balance, bonus_tokens_count, paid_tokens_count, free_tokens_count, free_tokens_expires_at')
            .eq('seller_id', user.id)
            .maybeSingle(),
        ]);

        if (profileResult.error) {
          console.error('Error fetching trial status:', profileResult.error);
          setStatus(prev => ({ ...prev, loading: false }));
          return;
        }

        const profile = profileResult.data;
        const tokens = tokensResult.data;

        const now = new Date();
        const trialEndDate = profile.trial_end_date ? new Date(profile.trial_end_date) : null;
        const premiumExpiresAt = profile.premium_expires_at ? new Date(profile.premium_expires_at) : null;
        
        const isInTrial = !profile.trial_used && trialEndDate && trialEndDate > now;
        const isPremium = profile.is_premium && premiumExpiresAt && premiumExpiresAt > now;

        // Check if user has any usable tokens (bonus, paid, or valid free)
        const bonusTokens = tokens?.bonus_tokens_count ?? 0;
        const paidTokens = tokens?.paid_tokens_count ?? 0;
        const freeTokens = tokens?.free_tokens_count ?? 0;
        const freeExpires = tokens?.free_tokens_expires_at ? new Date(tokens.free_tokens_expires_at) : null;
        const hasValidFreeTokens = freeTokens > 0 && (!freeExpires || freeExpires > now);
        const hasTokens = bonusTokens > 0 || paidTokens > 0 || hasValidFreeTokens;

        // canPublish: trial OR premium OR has tokens
        const canPublish = isInTrial || isPremium || hasTokens;

        setStatus({
          isInTrial,
          trialEndDate,
          canPublish,
          isPremium,
          hasTokens,
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