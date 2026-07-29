'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as api from './api';

// Minimal client-side auth: the token IS the source of truth for role
// (decoded here just to branch the UI — the API re-verifies it on every
// request, this never grants access on its own, feature spec §1).
interface AuthState {
  token: string | null;
  role: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; phone?: string; role: 'customer' | 'supplier' | 'fundraising_org' }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function decodeRole(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('findi_token');
    if (stored) {
      setTokenState(stored);
      setRole(decodeRole(stored));
    }
  }, []);

  function applyToken(accessToken: string) {
    api.setToken(accessToken);
    setTokenState(accessToken);
    setRole(decodeRole(accessToken));
  }

  async function login(email: string, password: string) {
    const { accessToken } = await api.login(email, password);
    applyToken(accessToken);
  }

  async function register(input: Parameters<AuthState['register']>[0]) {
    const { accessToken } = await api.register(input);
    applyToken(accessToken);
  }

  function logout() {
    api.setToken(null);
    setTokenState(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ token, role, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
