import { useMemo } from 'react';
import { useStableAuth } from './useStableAuth';
import { useStableRole } from './useStableRole';

/**
 * Optimized combined auth and role hook
 * Prevents unnecessary re-renders by combining stable hooks
 */
export function useOptimizedAuth() {
  const auth = useStableAuth();
  const role = useStableRole();

  return useMemo(
    () => ({
      // Auth data
      user: auth.user,
      userId: auth.userId,
      userEmail: auth.userEmail,
      isAuthenticated: auth.isAuthenticated,
      loading: auth.loading || role.loading,
      
      // Role data
      role: role.role,
      isSuperAdmin: role.isSuperAdmin,
      isAdmin: role.isAdmin,
      isSeller: role.isSeller,
      isBuyer: role.isBuyer,
      hasRole: role.hasRole,
      
      // Auth functions
      signIn: auth.signIn,
      signUp: auth.signUp,
      resetPassword: auth.resetPassword,
      signOut: auth.signOut,
      
      // Role functions
      refreshRole: role.refreshRole,
    }),
    [auth, role]
  );
}
