import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (emailOrPhone: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, phone: string, country?: string, role?: 'buyer' | 'seller', shopName?: string) => Promise<{ error: any; data?: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Éviter les re-renderings inutiles si les valeurs n'ont pas changé
        setSession(prevSession => {
          if (prevSession?.access_token === session?.access_token) {
            return prevSession;
          }
          return session;
        });
        
        setUser(prevUser => {
          const newUser = session?.user ?? null;
          if (prevUser?.id === newUser?.id) {
            return prevUser;
          }
          return newUser;
        });
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (emailOrPhone: string, password: string) => {
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    
    // SECURITY: Rate limiting - check login attempts
    const attempts = JSON.parse(
      localStorage.getItem('login_attempts') || '{}'
    );
    
    const userAttempts = attempts[emailOrPhone] || { count: 0, lockedUntil: null };
    
    // Check if account is locked
    if (userAttempts.lockedUntil && Date.now() < userAttempts.lockedUntil) {
      const minutes = Math.ceil(
        (userAttempts.lockedUntil - Date.now()) / 60000
      );
      return { 
        error: { 
          message: `Compte temporairement verrouillé. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.` 
        } 
      };
    }
    
    // Déterminer si l'identifiant est un email ou un téléphone
    const isEmail = emailOrPhone.includes('@');
    
    const { error } = await supabase.auth.signInWithPassword({
      email: isEmail ? emailOrPhone : undefined,
      phone: !isEmail ? emailOrPhone : undefined,
      password,
    });
    
    // SECURITY: Update login attempts
    if (error) {
      userAttempts.count++;
      if (userAttempts.count >= MAX_ATTEMPTS) {
        userAttempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
        userAttempts.count = 0;
      }
      attempts[emailOrPhone] = userAttempts;
      localStorage.setItem('login_attempts', JSON.stringify(attempts));
    } else {
      // Clear attempts on successful login
      delete attempts[emailOrPhone];
      localStorage.setItem('login_attempts', JSON.stringify(attempts));
    }
    
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    country?: string,
    role?: 'buyer' | 'seller',
    shopName?: string
  ) => {
    const redirectUrl = `https://djassa.siteviral.site/auth/callback`;

    // Logs temporaires (à retirer après validation)
    console.log('🔵 [signUp] start', { email });

    const safeResendConfirmation = async () => {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: redirectUrl },
        });
        console.log('📧 [signUp] resend result', {
          hasError: !!error,
          message: error?.message,
        });
        return { error };
      } catch (e) {
        console.log('⚠️ [signUp] resend exception', e);
        return { error: e } as any;
      }
    };

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone,
            country: country || 'CI',
            user_role: role || 'buyer',
            shop_name: shopName || '',
          },
        },
      });

      const identitiesLen = data?.user?.identities?.length ?? 0;
      const emailConfirmedAt = (data?.user as any)?.email_confirmed_at ?? null;
      const createdAt = (data?.user as any)?.created_at ?? null;

      console.log('🔵 [signUp] supabase response', {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        hasError: !!error,
        errorMessage: error?.message,
        identitiesLen,
        emailConfirmedAt,
        createdAt,
      });

      // CAS A: Supabase renvoie une erreur
      // - Certains cas "already registered" peuvent arriver ici → on fait un resend pour déterminer confirmé vs non-confirmé.
      if (error) {
        const msg = error.message || '';
        const looksLikeAlreadyRegistered =
          msg.toLowerCase().includes('already registered') ||
          msg.toLowerCase().includes('already been registered') ||
          msg.toLowerCase().includes('user already registered') ||
          msg.toLowerCase().includes('email address has already been registered') ||
          msg.toLowerCase().includes('email already exists');

        if (looksLikeAlreadyRegistered) {
          const resend = await safeResendConfirmation();
          const resendMsg = (resend.error as any)?.message || '';

          // Si Supabase dit que c'est déjà confirmé → vrai doublon
          if (
            resendMsg.toLowerCase().includes('already confirmed') ||
            resendMsg.toLowerCase().includes('email link is invalid')
          ) {
            return {
              error: {
                message: 'EMAIL_ALREADY_CONFIRMED',
                __isConfirmedEmail: true,
              } as any,
              data: null,
            };
          }

          // Sinon → email existant non confirmé (on a tenté un resend)
          return {
            error: {
              message: 'EMAIL_NOT_CONFIRMED',
              __isUnconfirmedEmail: true,
            } as any,
            data: { user: data?.user ?? null, session: null, needsConfirmation: true },
          };
        }

        return { error, data: null };
      }

      // CAS B: Pas d'erreur, mais Supabase renvoie un user
      if (data?.user) {
        // Heuristique robuste:
        // - identities.length === 0 arrive souvent quand l'email existe déjà mais n'est pas confirmé.
        // - MAIS certains setups (SMTP custom) semblent parfois renvoyer identities=[] même pour un nouvel email.
        // → On distingue via created_at (nouvel user créé récemment).
        if (identitiesLen === 0) {
          const createdMs = createdAt ? new Date(createdAt).getTime() : NaN;
          const isFreshUser = Number.isFinite(createdMs) && Date.now() - createdMs < 2 * 60 * 1000; // 2 min

          console.log('🟣 [signUp] identities empty analysis', {
            isFreshUser,
            ageMs: Number.isFinite(createdMs) ? Date.now() - createdMs : null,
          });

          if (isFreshUser) {
            // CAS 1 (email nouveau) → inscription normale
            return { error: null, data };
          }

          // CAS 2 (email existant non confirmé) → ne pas bloquer, renvoyer la confirmation
          await safeResendConfirmation();
          return {
            error: {
              message: 'EMAIL_NOT_CONFIRMED',
              __isUnconfirmedEmail: true,
            } as any,
            data: { user: data.user, session: null, needsConfirmation: true },
          };
        }

        // identities > 0
        // Si email_confirmed_at est présent, c'est un doublon confirmé.
        if (emailConfirmedAt) {
          return {
            error: {
              message: 'EMAIL_ALREADY_CONFIRMED',
              __isConfirmedEmail: true,
            } as any,
            data: null,
          };
        }

        // Sinon, user à confirmer / nouvel user
        return { error: null, data };
      }

      // CAS C: Pas de user retourné (rare) → considérer comme succès silencieux
      return { error: null, data };
    } catch (exception) {
      console.error('❌ [signUp] exception', exception);
      return {
        error: {
          message: exception instanceof Error ? exception.message : 'Erreur inattendue',
          name: 'UnexpectedError',
          status: 500,
        } as any,
        data: null,
      };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://djassa.siteviral.site/auth/reset-password`,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear Supabase auth session
      await supabase.auth.signOut({ scope: 'local' });
      
      // Clear local state after successful logout
      setUser(null);
      setSession(null);
    } catch (error) {
      // Even if signOut fails, clear local state to allow re-login
      console.log('Clearing local session after logout error');
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}