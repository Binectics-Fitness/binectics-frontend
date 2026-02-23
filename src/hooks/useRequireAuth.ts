"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/constants/routes";
import type { UserRole } from "@/lib/types";

/**
 * Hook to protect client-side routes
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth(redirectUrl: string = "/login") {
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
 * @deprecated Use useRoleGuard instead for better role-based routing
 */
export function useRequireRole(
  allowedRoles: string[],
  redirectUrl: string = "/dashboard",
) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.push(redirectUrl);
    }
  }, [user, isLoading, allowedRoles, router, redirectUrl]);

  return {
    user,
    isLoading,
    hasAccess: user ? allowedRoles.includes(user.role) : false,
  };
}

/**
 * Hook to guard dashboard routes by user role
 * Handles authentication check and role-based redirects
 *
 * @param requiredRole - The role required to access this page
 * @returns Object with user, isLoading, and isAuthorized flags
 *
 * @example
 * ```tsx
 * function GymOwnerDashboard() {
 *   const { user, isLoading, isAuthorized } = useRoleGuard('GYM_OWNER');
 *
 *   if (isLoading) return <DashboardLoading />;
 *   if (!isAuthorized) return null;
 *
 *   return <div>Dashboard content</div>;
 * }
 * ```
 */
export function useRoleGuard(requiredRole: UserRole) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!user) {
        router.push("/login");
        return;
      }

      // Wrong role - redirect to correct dashboard
      if (user.role !== requiredRole) {
        router.replace(getDashboardRoute(user.role));
      }
    }
  }, [isLoading, user, requiredRole, router]);

  const isAuthorized =
    !isLoading && user !== null && user.role === requiredRole;

  return {
    user,
    isLoading,
    isAuthorized,
  };
}
