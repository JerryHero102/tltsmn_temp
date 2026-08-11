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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const userData = await api.getMe();
        if (isMounted) {
          setUser(userData);
          if (pathname === '/login') {
            router.replace('/');
          }
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          if (pathname !== '/login') {
            router.replace('/login');
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
    setUser(res.user);
    router.replace('/');
  };

  const logout = async () => {
    await api.logout();
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
