import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, clearTokens, hasTokens, saveTokens, setSignedOutHandler } from './api';
import type { Tokens } from './types';

type Auth = {
  ready: boolean;
  signedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    hasTokens().then((v) => {
      setSignedIn(v);
      setReady(true);
    });
    setSignedOutHandler(() => setSignedIn(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await saveTokens(await api<Tokens>('/auth/login', { method: 'POST', body: { email, password } }));
    setSignedIn(true);
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    await saveTokens(
      await api<Tokens>('/auth/signup', { method: 'POST', body: { email, password, display_name: displayName } }),
    );
    setSignedIn(true);
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    qc.clear();
    setSignedIn(false);
  }, [qc]);

  const value = useMemo(() => ({ ready, signedIn, login, signup, logout }), [ready, signedIn, login, signup, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider 밖에서 useAuth를 쓸 수 없습니다.');
  return v;
}
