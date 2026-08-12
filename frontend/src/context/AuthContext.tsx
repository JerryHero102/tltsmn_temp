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

    // Clean up any legacy localStorage access_token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
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
          const is401 = err.message?.includes('401') || err.message?.includes('Chưa đăng nhập') || err.message?.includes('hết hạn');
          if (is401) {
            setUser(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('user_profile');
            }
            if (pathname !== '/login') {
              router.replace('/login');
            }
          } else {
            // Keep existing cached user for temporary offline network hiccups
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
    if (res.user && typeof window !== 'undefined') {
      localStorage.setItem('user_profile', JSON.stringify(res.user));
    }
    setUser(res.user);
    router.replace('/');
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
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
