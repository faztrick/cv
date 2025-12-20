'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';

export type CreatorProfile = {
  id: string;
  displayName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isDisabled?: boolean;
};

export type User = {
  id: string;
  email: string;
  role: 'FAN' | 'CREATOR' | 'ADMIN';
  creator?: CreatorProfile | null;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: 'FAN' | 'CREATOR') => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'fanhouse_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (stored) {
      setToken(stored);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    refresh(token).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    });
  }, [token]);

  async function refresh(currentToken?: string) {
    const activeToken = currentToken ?? token;
    if (!activeToken) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{ user: User }>('/auth/me', { method: 'GET' }, activeToken);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await apiFetch<{ token: string; user: User }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password })
      },
      null
    );
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function register(email: string, password: string, role?: 'FAN' | 'CREATOR') {
    const data = await apiFetch<{ token: string; user: User }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, role })
      },
      null
    );
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refresh: () => refresh() }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
