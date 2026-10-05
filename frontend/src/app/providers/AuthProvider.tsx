import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export interface DemoUser {
  id: string;
  email: string;
  supabaseUserId?: string;
}

interface AuthContextType {
  user: User | DemoUser | null;
  session: Session | null;
  isLoading: boolean;
  setDemoUser: (email: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'shardflow_demo_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | DemoUser | null>(() => {
    try {
      const saved = localStorage.getItem(DEMO_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check initial Supabase session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          setSession(session);
          setUser(session.user);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });

    // Listen for Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        localStorage.removeItem(DEMO_USER_KEY);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setDemoUser = (email: string) => {
    const demoUser: DemoUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: email || 'admin@shardflow.io',
    };
    setUser(demoUser);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    localStorage.removeItem(DEMO_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, setDemoUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
