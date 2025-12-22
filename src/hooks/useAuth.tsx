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

    // === LOGS TEMPORAIRES ===
    console.log('[signup] email:', email);

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

      const userId = data?.user?.id ?? null;
      const identities = data?.user?.identities ?? [];
      const emailConfirmedAt = data?.user?.email_confirmed_at ?? null;
      const createdAt = data?.user?.created_at ?? null;

      // === LOGS TEMPORAIRES ===
      console.log('[signup] user.id:', userId);
      console.log('[signup] identities:', identities);
      console.log('[signup] email_confirmed_at:', emailConfirmedAt);
      console.log('[signup] created_at:', createdAt);

      // =========================================================
      // LOGIQUE PRINCIPALE - 3 CAS DISTINCTS
      // =========================================================

      // CAS ERREUR EXPLICITE DE SUPABASE
      if (error) {
        const msg = (error.message || '').toLowerCase();
        
        // Si Supabase dit explicitement "already registered" → on tente un resend
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          console.log('[signup] final_decision: ERROR_ALREADY_REGISTERED → trying resend');
          
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: { emailRedirectTo: redirectUrl },
          });
          
          const resendMsg = (resendError?.message || '').toLowerCase();
          console.log('[signup] resend result:', resendMsg || 'success');
          
          // Si le resend échoue car déjà confirmé → CAS 3 (email confirmé)
          if (resendMsg.includes('already confirmed') || resendMsg.includes('invalid')) {
            console.log('[signup] final_decision: EMAIL_ALREADY_CONFIRMED');
            return {
              error: { message: 'EMAIL_ALREADY_CONFIRMED', __isConfirmedEmail: true } as any,
              data: null,
            };
          }
          
          // Sinon → CAS 2 (email non confirmé, resend effectué)
          console.log('[signup] final_decision: EMAIL_NOT_CONFIRMED (resend done)');
          return {
            error: { message: 'EMAIL_NOT_CONFIRMED', __isUnconfirmedEmail: true } as any,
            data: { user: null, session: null, needsConfirmation: true },
          };
        }
        
        // Autre erreur → on la retourne telle quelle
        console.log('[signup] final_decision: OTHER_ERROR:', error.message);
        return { error, data: null };
      }

      // =========================================================
      // PAS D'ERREUR EXPLICITE - ANALYSER LA RÉPONSE
      // =========================================================

      // RÈGLE CLÉE: NE JAMAIS utiliser `user !== null` comme condition d'erreur
      // RÈGLE CLÉE: NE JAMAIS bloquer si `email_confirmed_at === null`

      // CAS 1: INSCRIPTION RÉUSSIE (email nouveau)
      // → identities.length > 0 ET email_confirmed_at === null
      // → OU data.session existe (auto-confirm activé)
      if (data?.session || (identities.length > 0 && !emailConfirmedAt)) {
        console.log('[signup] final_decision: NEW_USER_SUCCESS');
        return { error: null, data };
      }

      // CAS 3: EMAIL DÉJÀ CONFIRMÉ
      // → identities.length > 0 ET email_confirmed_at !== null
      if (identities.length > 0 && emailConfirmedAt) {
        console.log('[signup] final_decision: EMAIL_ALREADY_CONFIRMED');
        return {
          error: { message: 'EMAIL_ALREADY_CONFIRMED', __isConfirmedEmail: true } as any,
          data: null,
        };
      }

      // CAS SPÉCIAL: identities.length === 0
      // → Cela signifie généralement un email existant non confirmé
      // → MAIS peut aussi arriver pour un nouvel email avec certains SMTP
      // → On vérifie via un resend pour être sûr
      if (identities.length === 0) {
        console.log('[signup] identities empty → checking via resend...');
        
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: redirectUrl },
        });
        
        const resendMsg = (resendError?.message || '').toLowerCase();
        console.log('[signup] resend check result:', resendMsg || 'success');
        
        // Si resend échoue car confirmé → CAS 3
        if (resendMsg.includes('already confirmed') || resendMsg.includes('invalid')) {
          console.log('[signup] final_decision: EMAIL_ALREADY_CONFIRMED (via resend check)');
          return {
            error: { message: 'EMAIL_ALREADY_CONFIRMED', __isConfirmedEmail: true } as any,
            data: null,
          };
        }
        
        // Resend réussi ou erreur autre → considérer comme nouveau / non confirmé
        // On retourne succès pour rediriger vers page confirmation
        console.log('[signup] final_decision: NEW_OR_UNCONFIRMED → proceed to confirmation');
        return { error: null, data };
      }

      // FALLBACK: Cas non couvert → considérer comme succès
      console.log('[signup] final_decision: FALLBACK_SUCCESS');
      return { error: null, data };

    } catch (exception) {
      console.error('[signup] EXCEPTION:', exception);
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