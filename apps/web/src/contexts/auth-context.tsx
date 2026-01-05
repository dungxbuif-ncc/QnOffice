'use client';

import { PATHS } from '@/constants';
import { authService, User } from '@/lib/services/auth-service';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialState?: {
    user: User | null;
    isAuthenticated: boolean;
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  initialState,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialState?.isAuthenticated || false,
  );
  const [user, setUser] = useState<User | null>(initialState?.user || null);
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      console.log('[AuthContext] User authenticated');
      setIsAuthenticated(true);
      // If user is authenticated and on login page, redirect to dashboard
      if (pathname === PATHS.AUTH.LOGIN) {
        console.log(
          '[AuthContext] Redirecting authenticated user to /dashboard',
        );
        router.push(PATHS.DASHBOARD.BASE);
      }
    } else {
      console.log('[AuthContext] No user found');
      setIsAuthenticated(false);
    }
  }, [user, pathname, router]);

  const refetch = async () => {
    try {
      const authState = await authService.me();
      setUser(authState.user);
      setIsAuthenticated(authState.isAuthenticated);
    } catch (error) {
      console.error('Refetch auth failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const login = async () => {
    await authService.redirectToOAuth();
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
    }
  };

  const value = {
    user,
    isLoading: false, // No loading since we get data server-side
    isAuthenticated,
    login,
    logout,
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
