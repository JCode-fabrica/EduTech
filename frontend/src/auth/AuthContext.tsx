import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

export type Role = 'admin' | 'coordenacao' | 'professor';
type MeUser = { id: string; nome: string; email: string; role: Role; escola_id?: string | null; must_change_password?: boolean };
type MeResponse = { user: MeUser };
type LoginResponse = { token: string; user: MeUser };

type AuthState = {
  user: MeUser | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
};

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<MeResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api<MeResponse>('/me')
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, senha: string) => {
    const res = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    localStorage.setItem('token', res.token);
    setUser(res.user);
    if (res.user.must_change_password) {
      window.location.href = '/alterar-senha';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    login,
    logout,
    hasRole: (...roles: Role[]) => !!user && roles.includes(user.role as Role)
  }), [user, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
