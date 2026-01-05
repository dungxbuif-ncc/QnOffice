'use client';

import { authApi, User } from '@/lib/auth-api-simple';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPage = pathname === '/login' || pathname?.startsWith('/auth');

  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const response = await authApi.getProfile();
        return response;
      } catch (err) {
        throw err;
      }
    },
    enabled: pathname !== '/auth/callback',
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const user = profileData?.data || null;
  const actualIsLoading = pathname === '/auth/callback' ? false : isLoading;

  useEffect(() => {
    if (user) {
      console.log('[AuthContext] User authenticated');
      setIsAuthenticated(true);
      // If user is authenticated and on login page, redirect to dashboard
      if (pathname === '/login') {
        console.log(
          '[AuthContext] Redirecting authenticated user to /dashboard',
        );
        router.push('/dashboard');
      }
    } else if (!isLoading) {
      // Only update state after loading is complete
      // No user - either error or not logged in
      setIsAuthenticated(false);
      // Only redirect to login if we're on a protected page
      if (error && !isPublicPage) {
        console.log('[AuthContext] Auth error on protected page');
        if (pathname !== '/login' && !pathname?.startsWith('/auth')) {
          console.log('[AuthContext] Redirecting to /login');
          router.push('/login');
        }
      }
    }
  }, [user, error, isPublicPage, pathname, router, isLoading]);

  const login = () => {
    window.location.href = authApi.getLoginUrl();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      queryClient.clear();
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    isLoading: actualIsLoading,
    isAuthenticated,
    login,
    logout,
    refetch,
  };

  if (actualIsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
