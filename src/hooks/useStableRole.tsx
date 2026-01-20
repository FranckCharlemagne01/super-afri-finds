import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from './useStableAuth';
import { prefetchSellerDashboard, prefetchBuyerDashboard } from './useDashboardPrefetch';

export type UserRole = 'buyer' | 'seller' | 'admin' | 'superadmin';

/**
 * Hook stable pour la gestion des rôles utilisateur
 * Évite les re-renders inutiles et les boucles infinies
 * Auto-prefetches dashboard data when role is detected
 */
export const useStableRole = () => {
  const { user, userId } = useStableAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const prefetchedRef = useRef(false);

  // Fonction pour récupérer le rôle - stable avec userId en dépendance
  const fetchUserRole = useCallback(async () => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_role', { 
        _user_id: userId 
      });

      if (error) {
        console.error('Error fetching user role:', error);
        setRole('buyer');
      } else {
        const detectedRole = data || 'buyer';
        setRole(detectedRole);
        
        // ✅ Auto-prefetch dashboard data when role is detected
        if (!prefetchedRef.current) {
          prefetchedRef.current = true;
          if (detectedRole === 'seller' || detectedRole === 'admin' || detectedRole === 'superadmin') {
            // Seller: prefetch seller dashboard data in background
            setTimeout(() => prefetchSellerDashboard(userId), 100);
          } else {
            // Buyer: prefetch buyer dashboard data in background
            setTimeout(() => prefetchBuyerDashboard(userId), 100);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setRole('buyer');
    } finally {
      setLoading(false);
    }
  }, [userId]); // Dépend uniquement de userId qui est stable

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadRole = async () => {
      if (mounted) {
        await fetchUserRole();
      }
    };

    loadRole();

    return () => {
      mounted = false;
    };
  }, [userId, fetchUserRole]);

  // Fonction stable pour rafraîchir le rôle après un changement
  const refreshRole = useCallback(() => {
    if (userId) {
      setLoading(true);
      fetchUserRole();
    }
  }, [userId, fetchUserRole]);

  // Écouter les changements de rôle en temps réel
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-role-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Rafraîchir le rôle automatiquement sans loader visible
          fetchUserRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUserRole]);

  // Valeurs mémorisées pour éviter les re-renders
  const roleInfo = useMemo(() => {
    const hasRole = (requiredRole: UserRole): boolean => {
      if (!role) return false;
      
      const roleHierarchy: Record<UserRole, number> = {
        buyer: 1,
        seller: 2,
        admin: 3,
        superadmin: 4,
      };
      
      return roleHierarchy[role] >= roleHierarchy[requiredRole];
    };

    return {
      role,
      loading,
      hasRole,
      isSuperAdmin: role === 'superadmin',
      isAdmin: role === 'admin' || role === 'superadmin',
      isSeller: role === 'seller' || role === 'admin' || role === 'superadmin',
      isBuyer: !!role, // Tous les rôles incluent buyer
      refreshRole,
    };
  }, [role, loading, refreshRole]);

  return roleInfo;
};