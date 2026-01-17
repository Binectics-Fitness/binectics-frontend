'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuthService as authService } from '@/lib/api/mock-auth';
import type { User, LoginRequest, RegisterRequest } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (data: LoginRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.login(data);

      if (response.success && response.data) {
        setUser(response.data.user);

        // Redirect based on user role
        const redirectPath = getRoleBasedRedirect(response.data.user.role);
        router.push(redirectPath);

        return { success: true };
      }

      return {
        success: false,
        error: response.message || 'Login failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  };

  const register = async (
    data: RegisterRequest
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.register(data);

      if (response.success && response.data) {
        setUser(response.data.user);

        // Redirect based on user role
        const redirectPath = getRoleBasedRedirect(response.data.user.role);
        router.push(redirectPath);

        return { success: true };
      }

      return {
        success: false,
        error: response.message || 'Registration failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state and redirect even if API call fails
      setUser(null);
      router.push('/login');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    authService.updateUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Get redirect path based on user role
 */
function getRoleBasedRedirect(role: string): string {
  switch (role) {
    case 'GYM_OWNER':
      return '/dashboard/gym-owner';
    case 'TRAINER':
      return '/dashboard/trainer';
    case 'DIETICIAN':
      return '/dashboard/dietician';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'USER':
    default:
      return '/dashboard';
  }
}
