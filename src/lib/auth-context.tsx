'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';
import { AuthUser, clearToken, getUserFromToken, saveToken } from './auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>; // <-- Added this
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to fetch the latest user data from the database
  const refreshUser = async () => {
    try {
      const res = await api.get('/users/me');
      // Update the user state with fresh database data (including isVerified!)
      setUser({
        userId: res.data._id,
        username: res.data.username,
        email: res.data.email,
        name: res.data.name,
        isVerified: res.data.isVerified,
        avatarUrl: res.data.avatarUrl,
      } as AuthUser);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // If the token is invalid/expired, log them out
      clearToken();
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const u = getUserFromToken();
      if (u) {
        setUser(u); // Set initial state from token
        await refreshUser(); // Then immediately fetch fresh data from DB
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    saveToken(res.data.access_token);
    setUser(getUserFromToken());
    await refreshUser(); // Fetch fresh data after login
    router.push('/');
  };

  const register = async (email: string, username: string, password: string, name?: string) => {
    await api.post('/auth/register', { email, username, password, name });
    await login(email, password);
  };

  const logout = () => {
    clearToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}