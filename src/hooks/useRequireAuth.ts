'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to protect client-side routes
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth(redirectUrl: string = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectUrl]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to protect routes by specific role
 */
export function useRequireRole(allowedRoles: string[], redirectUrl: string = '/dashboard') {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.push(redirectUrl);
    }
  }, [user, isLoading, allowedRoles, router, redirectUrl]);

  return { user, isLoading, hasAccess: user ? allowedRoles.includes(user.role) : false };
}
