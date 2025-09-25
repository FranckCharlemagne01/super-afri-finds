import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook optimisé pour éviter les re-renders inutiles dans l'authentification
 * Utilise la mémorisation pour stabiliser l'état utilisateur
 */
export function useStableAuth() {
  const auth = useAuth();
  
  // Mémoriser uniquement les valeurs qui changent réellement
  const stableAuth = useMemo(() => {
    return {
      user: auth.user,
      session: auth.session,
      loading: auth.loading,
      // Valeurs dérivées stables
      isAuthenticated: !!auth.user,
      userId: auth.user?.id || null,
      userEmail: auth.user?.email || null,
    };
  }, [
    auth.user?.id, // Seul l'ID utilisateur détermine un changement d'utilisateur
    auth.session?.access_token, // Seul le token détermine un changement de session
    auth.loading,
  ]);

  // Fonctions stables - ne changent pas entre les renders
  return {
    ...stableAuth,
    signIn: auth.signIn,
    signUp: auth.signUp,
    resetPassword: auth.resetPassword,
    signOut: auth.signOut,
  };
}