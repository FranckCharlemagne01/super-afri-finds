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
    // Utiliser le nouveau domaine pour le redirect
    const redirectUrl = `https://djassa.siteviral.site/auth/callback`;
    
    console.log('🔵 [useAuth.signUp] Début du processus d\'inscription');
    console.log('🔵 [useAuth.signUp] Email:', email);
    console.log('🔵 [useAuth.signUp] Redirect URL:', redirectUrl);
    console.log('🔵 [useAuth.signUp] Rôle utilisateur:', role);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        phone,
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
      
      console.log('🟢 [useAuth.signUp] Réponse Supabase:');
      console.log('🟢 [useAuth.signUp] - Data:', data);
      console.log('🟢 [useAuth.signUp] - Error:', error);
      
      if (error) {
        console.error('❌ [useAuth.signUp] Erreur Supabase:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
      } else {
        console.log('✅ [useAuth.signUp] Utilisateur créé:', data.user?.id);
        console.log('✅ [useAuth.signUp] Session:', data.session ? 'Présente' : 'Null (confirmation email requise)');
      }
      
      return { error, data };
    } catch (exception) {
      console.error('❌ [useAuth.signUp] Exception inattendue:', exception);
      return { 
        error: { 
          message: exception instanceof Error ? exception.message : 'Une erreur inattendue est survenue',
          name: 'UnexpectedError',
          status: 500
        } as any,
        data: null
      };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://djassa.djassa.tech/auth',
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