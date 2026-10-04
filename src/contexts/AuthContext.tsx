import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface SignUpResult {
  // false quando o projeto exige confirmação de e-mail antes do primeiro login
  hasSession: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAppUser(authUser: SupabaseUser): User {
  const email = authUser.email ?? '';
  const metaName = authUser.user_metadata?.name;
  return {
    id: authUser.id,
    name: typeof metaName === 'string' && metaName.trim() ? metaName : email.split('@')[0] || 'Usuário',
    email,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) console.error('Erro ao recuperar sessão do Supabase:', error.message);
        if (isMounted) setSession(data.session);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // Não fazer chamadas ao Supabase dentro deste callback: apenas sincronizar o estado
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ? toAppUser(session.user) : null,
      isLoading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw new Error(`Não foi possível entrar: ${error.message}`);
      },
      signUp: async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { name: name.trim() } },
        });
        if (error) throw new Error(`Não foi possível criar a conta: ${error.message}`);
        return { hasSession: Boolean(data.session) };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(`Não foi possível sair: ${error.message}`);
      },
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
