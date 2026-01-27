import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface ProfileCompletionStatus {
  isLoading: boolean;
  isComplete: boolean;
  isGoogleUser: boolean;
  needsOnboarding: boolean;
  profile: {
    country: string | null;
    city: string | null;
    userRole: string | null;
  } | null;
}

/**
 * Hook pour vérifier si un utilisateur Google a complété son profil
 * Vérifie: country, city, et role dans user_roles
 */
export function useProfileCompletion(user: User | null): ProfileCompletionStatus {
  const [status, setStatus] = useState<ProfileCompletionStatus>({
    isLoading: true,
    isComplete: false,
    isGoogleUser: false,
    needsOnboarding: false,
    profile: null,
  });

  useEffect(() => {
    if (!user) {
      setStatus({
        isLoading: false,
        isComplete: false,
        isGoogleUser: false,
        needsOnboarding: false,
        profile: null,
      });
      return;
    }

    const checkProfileCompletion = async () => {
      try {
        // Vérifier si c'est un utilisateur Google
        const isGoogleUser = user.app_metadata?.provider === 'google' ||
          user.identities?.some(id => id.provider === 'google') || false;

        console.log('[useProfileCompletion] User provider check:', {
          userId: user.id,
          provider: user.app_metadata?.provider,
          identities: user.identities?.map(id => id.provider),
          isGoogleUser
        });

        // Récupérer le profil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('country, city')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[useProfileCompletion] Profile fetch error:', profileError);
        }

        // Récupérer le rôle
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (roleError) {
          console.error('[useProfileCompletion] Role fetch error:', roleError);
        }

        const country = profile?.country || null;
        const city = profile?.city || null;
        const userRole = roleData?.role || null;

        // Un profil est complet si country ET city sont renseignés ET un rôle existe
        const isComplete = Boolean(country && city && userRole);

        // Un utilisateur Google a besoin d'onboarding s'il n'a pas complété son profil
        const needsOnboarding = isGoogleUser && !isComplete;

        console.log('[useProfileCompletion] Status:', {
          isGoogleUser,
          country,
          city,
          userRole,
          isComplete,
          needsOnboarding
        });

        setStatus({
          isLoading: false,
          isComplete,
          isGoogleUser,
          needsOnboarding,
          profile: {
            country,
            city,
            userRole,
          },
        });
      } catch (error) {
        console.error('[useProfileCompletion] Error:', error);
        setStatus({
          isLoading: false,
          isComplete: false,
          isGoogleUser: false,
          needsOnboarding: false,
          profile: null,
        });
      }
    };

    checkProfileCompletion();
  }, [user?.id]);

  return status;
}

/**
 * Fonction pour compléter le profil d'un utilisateur Google
 */
export async function completeGoogleUserProfile(
  userId: string,
  data: {
    country: string;
    city: string;
    objective: 'buyer' | 'seller';
    shopName?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[completeGoogleUserProfile] Starting with:', { userId, data });

    // 1. Mettre à jour le profil avec country et city
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        country: data.country,
        city: data.city,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('[completeGoogleUserProfile] Profile update error:', profileError);
      throw new Error('Erreur lors de la mise à jour du profil');
    }

    // 2. Créer ou mettre à jour le rôle
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingRole) {
      // Mettre à jour le rôle existant
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: data.objective })
        .eq('user_id', userId);

      if (roleError) {
        console.error('[completeGoogleUserProfile] Role update error:', roleError);
        throw new Error('Erreur lors de la mise à jour du rôle');
      }
    } else {
      // Créer un nouveau rôle
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: data.objective });

      if (roleError) {
        console.error('[completeGoogleUserProfile] Role insert error:', roleError);
        throw new Error('Erreur lors de la création du rôle');
      }
    }

    // 3. Si vendeur, créer la boutique et initialiser les tokens
    if (data.objective === 'seller') {
      // Créer la boutique
      const shopSlug = (data.shopName || 'boutique')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

      const { error: shopError } = await supabase
        .from('seller_shops')
        .insert({
          seller_id: userId,
          shop_name: data.shopName || 'Ma Boutique',
          shop_slug: shopSlug,
          is_active: true,
        });

      if (shopError) {
        console.error('[completeGoogleUserProfile] Shop creation error:', shopError);
        // Ne pas échouer complètement pour la boutique
      }

      // Initialiser les tokens du vendeur avec la période d'essai
      const { error: tokensError } = await supabase.rpc('ensure_seller_trial_tokens', {
        _user_id: userId
      });

      if (tokensError) {
        console.error('[completeGoogleUserProfile] Tokens initialization error:', tokensError);
      }
    }

    console.log('[completeGoogleUserProfile] Success');
    return { success: true };
  } catch (error) {
    console.error('[completeGoogleUserProfile] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue',
    };
  }
}
