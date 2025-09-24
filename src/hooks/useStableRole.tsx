import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from './useStableAuth';

export type UserRole = 'buyer' | 'seller' | 'admin' | 'superadmin';

/**
 * Hook stable pour la gestion des rôles utilisateur
 * Évite les re-renders inutiles et les boucles infinies
 */
export const useStableRole = () => {
  const { user, userId } = useStableAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction mémorisée pour récupérer le rôle
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
        setRole('buyer'); // Rôle par défaut
      } else {
        setRole(data || 'buyer');
      }
    } catch (error) {
      console.error('Error:', error);
      setRole('buyer');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
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
  }, [fetchUserRole]);

  // Fonction pour rafraîchir le rôle après un changement
  const refreshRole = useCallback(() => {
    if (userId) {
      setLoading(true);
      fetchUserRole();
    }
  }, [fetchUserRole, userId]);

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