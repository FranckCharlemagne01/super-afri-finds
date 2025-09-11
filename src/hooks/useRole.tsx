import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'buyer' | 'seller' | 'admin' | 'superadmin';

export const useRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Éviter les appels multiples pendant le chargement
    let mounted = true;

    const fetchUserRole = async () => {
      if (!user) {
        if (mounted) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_user_role', { _user_id: user.id });

        if (mounted) {
          if (error) {
            console.error('Error fetching user role:', error);
            setRole('buyer'); // Default role
          } else {
            setRole(data || 'buyer');
          }
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error:', error);
          setRole('buyer');
          setLoading(false);
        }
      }
    };

    fetchUserRole();

    // Cleanup function pour éviter les memory leaks
    return () => {
      mounted = false;
    };
  }, [user?.id]); // Dépendance uniquement sur user.id pour éviter les re-renders

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

  const isSuperAdmin = (): boolean => {
    return role === 'superadmin';
  };

  return {
    role,
    loading,
    hasRole,
    isSuperAdmin,
  };
};