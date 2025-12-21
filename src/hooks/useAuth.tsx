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

  const signUp = async (email: string, password: string, fullName: string, phone: string, country?: string, role?: 'buyer' | 'seller', shopName?: string) => {
    const redirectUrl = `https://djassa.siteviral.site/auth/callback`;
    
    console.log('🔵 [signUp] Début inscription pour:', email);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
            country: country || 'CI',
            user_role: role || 'buyer',
            shop_name: shopName || '',
          }
        }
      });
      
      console.log('🔵 [signUp] Réponse Supabase:', { 
        hasUser: !!data?.user, 
        hasSession: !!data?.session,
        hasError: !!error,
        identitiesCount: data?.user?.identities?.length 
      });
      
      // CAS 1: Erreur explicite de Supabase
      if (error) {
        console.error('❌ [signUp] Erreur Supabase:', error.message);
        return { error, data: null };
      }
      
      // CAS 2: User retourné - analyser les identities
      // Supabase renvoie user avec identities = [] quand l'email existe déjà
      const identities = data?.user?.identities;
      const hasIdentities = identities && identities.length > 0;
      
      if (data?.user && !hasIdentities) {
        // Email existe déjà - vérifier si confirmé ou non
        console.log('⚠️ [signUp] Email existe (identities vides)');
        
        // Vérifier email_confirmed_at pour distinguer confirmé vs non-confirmé
        if (data.user.email_confirmed_at) {
          // Email confirmé = vrai doublon
          console.log('❌ [signUp] Email déjà confirmé - doublon');
          return { 
            error: { 
              message: 'EMAIL_ALREADY_CONFIRMED',
              __isConfirmedEmail: true
            } as any,
            data: null
          };
        } else {
          // Email non confirmé = renvoyer confirmation automatiquement
          console.log('📧 [signUp] Email non confirmé - renvoi auto');
          
          // Renvoyer email de confirmation automatiquement
          try {
            await supabase.auth.resend({
              type: 'signup',
              email: email,
              options: { emailRedirectTo: redirectUrl }
            });
            console.log('✅ [signUp] Email de confirmation renvoyé');
          } catch (resendErr) {
            console.log('⚠️ [signUp] Erreur renvoi (ignorée):', resendErr);
          }
          
          return { 
            error: { 
              message: 'EMAIL_NOT_CONFIRMED',
              __isUnconfirmedEmail: true
            } as any,
            data: { user: data.user, session: null, needsConfirmation: true }
          };
        }
      }
      
      // CAS 3: Nouvel utilisateur créé avec succès (identities > 0)
      console.log('✅ [signUp] Nouveau compte créé:', data.user?.id);
      return { error: null, data };
      
    } catch (exception) {
      console.error('❌ [signUp] Exception:', exception);
      return { 
        error: { 
          message: exception instanceof Error ? exception.message : 'Erreur inattendue',
          name: 'UnexpectedError',
          status: 500
        } as any,
        data: null
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