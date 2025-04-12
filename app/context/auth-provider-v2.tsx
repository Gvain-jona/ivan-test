'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isPinVerified: boolean;
  setPinVerified: (value: boolean) => void;
  profile: any;
  clearPinVerification: () => void;
  resetInactivityTimer: () => void;
  checkSupabaseHealth: () => Promise<{ ok: boolean, error?: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderV2 = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinVerified, setPinVerified] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const setupAuth = async () => {
      setIsLoading(true);
      
      // Check for session in localStorage
      const storedSession = localStorage.getItem('supabase.auth.token');
      
      if (storedSession) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setSession(session);
            setUser(session.user);
            
            // Check if pin is verified
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (data) {
              setProfile(data);
              if (data.pin_verified) {
                setPinVerified(true);
              }
            }
          }
        } catch (error) {
          console.error('Error getting session:', error);
        }
      }
      
      setIsLoading(false);
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (session) {
            setSession(session);
            setUser(session.user);
            
            // Store auth state in localStorage for persistence
            localStorage.setItem('supabase.auth.token', JSON.stringify(session));
            
            // Set custom cookie for middleware
            document.cookie = `ivan-auth-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`;
            
            // Fetch profile data
            supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setProfile(data);
                  if (data.pin_verified) {
                    setPinVerified(true);
                  }
                }
              });
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
            setPinVerified(false);
            localStorage.removeItem('supabase.auth.token');
            document.cookie = 'ivan-auth-token=; path=/; max-age=0; SameSite=Lax';
          }
        }
      );
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    setupAuth();
  }, [supabase]);

  const signIn = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setPinVerified(false);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const clearPinVerification = () => {
    setPinVerified(false);
  };
  
  const resetInactivityTimer = () => {
    // Implementation would go here
    console.log('Inactivity timer reset');
  };
  
  const checkSupabaseHealth = async () => {
    try {
      const { data, error } = await supabase.from('health_check').select('*').limit(1);
      return { ok: !error, error };
    } catch (error) {
      return { ok: false, error };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
    isPinVerified,
    setPinVerified,
    profile,
    clearPinVerification,
    resetInactivityTimer,
    checkSupabaseHealth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthV2 = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthV2 must be used within an AuthProviderV2');
  }
  return context;
};

export default AuthProviderV2;
