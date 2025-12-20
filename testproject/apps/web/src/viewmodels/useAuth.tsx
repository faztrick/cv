/**
 * MVVM Architecture - ViewModel Layer
 *
 * Auth ViewModel - Manages authentication state and operations.
 * Encapsulates all auth-related business logic.
 */

'use client';

import { AuthApi } from '@/models/api';
import type { User } from '@/models/types';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'fanhouse_token';

// ============ State Interface ============

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// ============ ViewModel Interface ============

export interface AuthViewModel extends AuthState {
  // Commands
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: 'FAN' | 'CREATOR') => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  clearError: () => void;

  // Computed
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  isApprovedCreator: boolean;
}

// ============ Context ============

const AuthContext = createContext<AuthViewModel | undefined>(undefined);

// ============ Provider ============

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null
  });

  // Initialize from localStorage
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (stored) {
      setState(prev => ({ ...prev, token: stored }));
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Fetch user when token changes
  useEffect(() => {
    if (!state.token) {
      setState(prev => ({ ...prev, user: null, loading: false }));
      return;
    }

    refresh().catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setState({ user: null, token: null, loading: false, error: null });
    });
  }, [state.token]);

  // ============ Commands ============

  const refresh = useCallback(async () => {
    const activeToken = state.token;
    if (!activeToken) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const data = await AuthApi.getMe(activeToken);
      setState(prev => ({ ...prev, user: data.user, loading: false, error: null }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to refresh'
      }));
      throw err;
    }
  }, [state.token]);

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await AuthApi.login(email, password);
      localStorage.setItem(TOKEN_KEY, data.token);
      setState({
        user: data.user,
        token: data.token,
        loading: false,
        error: null
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Login failed'
      }));
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, role?: 'FAN' | 'CREATOR') => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await AuthApi.register(email, password, role);
      localStorage.setItem(TOKEN_KEY, data.token);
      setState({
        user: data.user,
        token: data.token,
        loading: false,
        error: null
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Registration failed'
      }));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, token: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============ Computed Properties ============

  const viewModel = useMemo<AuthViewModel>(() => ({
    // State
    ...state,

    // Commands
    login,
    register,
    logout,
    refresh,
    clearError,

    // Computed
    isAuthenticated: !!state.user,
    isAdmin: state.user?.role === 'ADMIN',
    isCreator: state.user?.role === 'CREATOR',
    isApprovedCreator: state.user?.creator?.status === 'APPROVED' && !state.user?.creator?.isDisabled
  }), [state, login, register, logout, refresh, clearError]);

  return <AuthContext.Provider value={viewModel}>{children}</AuthContext.Provider>;
}

// ============ Hook ============

export function useAuth(): AuthViewModel {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
