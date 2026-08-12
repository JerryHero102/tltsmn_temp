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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
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

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      if (!token) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
          if (pathname !== '/login') {
            router.replace('/login');
          }
        }
        return;
      }

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
          // ONLY clear session if server explicitly tells us 401 Unauthorized
          const is401 = err.message?.includes('401') || err.message?.includes('Chưa đăng nhập') || err.message?.includes('hết hạn');
          if (is401) {
            setUser(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token');
              localStorage.removeItem('user_profile');
            }
            if (pathname !== '/login') {
              router.replace('/login');
            }
          } else {
            // For network glitches/timeouts, keep existing cached user if available
            if (pathname === '/login' && user) {
              router.replace('/');
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
    if (res.access_token && typeof window !== 'undefined') {
      localStorage.setItem('access_token', res.access_token);
    }
    if (res.user && typeof window !== 'undefined') {
      localStorage.setItem('user_profile', JSON.stringify(res.user));
    }
    setUser(res.user);
    router.replace('/');
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');
    }
    try {
      await api.logout();
    } catch {}
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
