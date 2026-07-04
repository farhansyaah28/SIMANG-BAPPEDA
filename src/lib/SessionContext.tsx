'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dataService, isDemoMode } from './dataService';
import { useRouter, usePathname } from 'next/navigation';

interface SessionContextType {
  user: any | null;
  loading: boolean;
  demoMode: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error: any }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  demoMode: false,
  login: async () => ({ success: false, error: null }),
  logout: async () => {},
  refreshUser: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const currentUser = await dataService.auth.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Gagal mengambil data user sesi:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      try {
        const currentUser = await dataService.auth.getCurrentUser();
        if (active) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Gagal mengambil data user sesi:', err);
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadUser();
    return () => {
      active = false;
    };
  }, []);

  // Simple route protection in Client Component
  useEffect(() => {
    if (!loading) {
      const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!user && !isPublicRoute) {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const { error } = await dataService.auth.login(email, password);
      if (error) {
        return { success: false, error };
      }
      await refreshUser();
      router.push('/dashboard');
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || err };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await dataService.auth.logout();
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SessionContext.Provider value={{ user, loading, demoMode: isDemoMode, login, logout, refreshUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
