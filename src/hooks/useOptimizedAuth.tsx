import { useMemo } from 'react';
import { useAuth } from './useAuth';

// Hook optimisé pour éviter les re-renders inutiles
export function useOptimizedAuth() {
  const auth = useAuth();
  
  // Mémoriser les valeurs pour éviter les re-renders
  const optimizedAuth = useMemo(() => ({
    user: auth.user,
    session: auth.session,
    loading: auth.loading,
    signIn: auth.signIn,
    signUp: auth.signUp,
    resetPassword: auth.resetPassword,
    signOut: auth.signOut,
    isAuthenticated: !!auth.user,
    userId: auth.user?.id || null,
  }), [auth.user, auth.session, auth.loading, auth.signIn, auth.signUp, auth.resetPassword, auth.signOut]);

  return optimizedAuth;
}