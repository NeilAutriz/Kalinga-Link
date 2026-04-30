import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../services/api';
import type { User } from '../lib/types';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { fullName: string; email: string; password: string; role: User['role']; affiliation?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const r = await api.get('/auth/me');
      setUser(r.data.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => { (async () => { await refresh(); setLoading(false); })(); }, []);

  const login = async (email: string, password: string) => {
    const r = await api.post('/auth/login', { email, password });
    setUser(r.data.user);
  };

  const register = async (input: { fullName: string; email: string; password: string; role: User['role']; affiliation?: string }) => {
    const r = await api.post('/auth/register', input);
    setUser(r.data.user);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
};
