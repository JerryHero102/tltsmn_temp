'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

export interface UserProfile {
  id?: string;
  id_system: string;
  phone_number?: string;
  role?: 'admin' | 'student';
  profile?: {
    id?: string;
    fullname?: string;
    email?: string;
    gender?: string;
    schedule?: string;
    notes?: string;
    birth_year?: number;
  };
  fullname?: string;
  email?: string;
  gender?: string;
  schedule?: string;
  notes?: string;
  birth_year?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (idSystem: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

function isSessionExpired(): boolean {
  if (typeof window === 'undefined') return false;
  const expiresAt = localStorage.getItem('auth_expires_at');
  if (!expiresAt) return true;
  const expTime = parseInt(expiresAt, 10);
  return isNaN(expTime) || Date.now() > expTime;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      if (isSessionExpired()) {
        localStorage.removeItem('user_profile');
        localStorage.removeItem('auth_expires_at');
        return null;
      }
      const cached = localStorage.getItem('user_profile');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_profile');
      localStorage.removeItem('auth_expires_at');
    }
    try {
      await api.logout();
    } catch {}
    setUser(null);
    router.replace('/login');
  };

  // Active Timer to automatically logout precisely when 2 hours have passed
  useEffect(() => {
    if (!user) return;

    const checkExpiration = () => {
      if (isSessionExpired()) {
        logout();
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkExpiration, 10000);

    // Also check when tab becomes active / window gains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkExpiration();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkExpiration);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkExpiration);
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    // Clean up any legacy localStorage access_token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      if (isSessionExpired()) {
        localStorage.removeItem('user_profile');
        localStorage.removeItem('auth_expires_at');
        setUser(null);
        setLoading(false);
        if (pathname !== '/login') {
          router.replace('/login');
        }
        return;
      }
    }

    const checkAuth = async () => {
      try {
        const userData = await api.getMe();
        if (isMounted) {
          setUser(userData);
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_profile', JSON.stringify(userData));
          }
          if (pathname === '/login') {
            router.replace('/');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          const is401 =
            err.message?.includes('401') ||
            err.message?.includes('Chưa đăng nhập') ||
            err.message?.includes('hết hạn');
          if (is401 || isSessionExpired()) {
            setUser(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('user_profile');
              localStorage.removeItem('auth_expires_at');
            }
            if (pathname !== '/login') {
              router.replace('/login');
            }
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const login = async (idSystem: string, pass: string) => {
    const res = await api.login(idSystem, pass);
    if (res.user && typeof window !== 'undefined') {
      const expiresAt = Date.now() + SESSION_DURATION_MS;
      localStorage.setItem('user_profile', JSON.stringify(res.user));
      localStorage.setItem('auth_expires_at', expiresAt.toString());
    }
    setUser(res.user);
    router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
