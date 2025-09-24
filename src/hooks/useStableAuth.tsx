import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook optimisé pour éviter les re-renders inutiles dans l'authentification
 * Utilise la mémorisation pour stable l'état utilisateur
 */
export function useStableAuth() {
  const auth = useAuth();
  
  // Mémoriser les valeurs critiques pour éviter les re-renders
  const stableAuth = useMemo(() => {
    return {
      user: auth.user,
      session: auth.session,
      loading: auth.loading,
      signIn: auth.signIn,
      signUp: auth.signUp,
      resetPassword: auth.resetPassword,
      signOut: auth.signOut,
      // Valeurs dérivées stables
      isAuthenticated: !!auth.user,
      userId: auth.user?.id || null,
      userEmail: auth.user?.email || null,
    };
  }, [
    auth.user?.id, // Seul l'ID utilisateur détermine un changement d'utilisateur
    auth.session?.access_token, // Seul le token détermine un changement de session
    auth.loading,
    auth.signIn,
    auth.signUp,
    auth.resetPassword,
    auth.signOut,
  ]);

  return stableAuth;
}