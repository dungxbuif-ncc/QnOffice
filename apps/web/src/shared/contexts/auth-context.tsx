'use client';

import { PATHS } from '@/shared/constants';
import authService from '@/shared/services/client/auth.service';
import { UserAuth, UserRole } from '@qnoffice/shared';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: UserAuth | null;
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
    user: UserAuth | null;
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
  const [user, setUser] = useState<UserAuth | null>(initialState?.user || null);
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      console.log('[AuthContext] User authenticated');
      setIsAuthenticated(true);
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
      console.log('[AuthContext] Fetching user profile...');
      const response = await authService.me();
      console.log('[AuthContext] Profile response:', response);

      if (response.data?.data?.user) {
        setUser(response.data.data.user);
        setIsAuthenticated(true);
        console.log(
          '[AuthContext] User authenticated:',
          response.data.data.user.email,
        );
      } else {
        console.warn('[AuthContext] No user in response');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[AuthContext] Refetch auth failed:', error);
      alert('[AUTH DEBUG] Failed to fetch user profile: ' + error);
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
    isLoading: false,
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

export function useUserRole(): UserRole | null {
  const { user } = useAuth();
  return user?.role ?? null;
}
