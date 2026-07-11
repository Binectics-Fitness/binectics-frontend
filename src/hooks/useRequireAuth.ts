"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/constants/routes";
import { UserRole } from "@/lib/types";

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
  allowedRoles: UserRole[],
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
/**
 * Admin surfaces gate on the is_admin FLAG, not the role — being a
 * platform admin is orthogonal to running a gym (the same login can be
 * both). Role ADMIN still passes for dedicated admin accounts.
 */
export function useAdminGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isAuthorized =
    !isLoading &&
    user !== null &&
    (user.role === UserRole.ADMIN || user.is_admin === true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      // HARD navigation, not router.push: with a live cookie the
      // middleware bounces /login straight back here, and a client-side
      // transition ping-pongs into a blank page. A full load either
      // renders the login form (no cookie) or reboots the app where the
      // session-recovery path restores the user (cookie alive).
      window.location.assign("/login");
      return;
    }
    if (!(user.role === UserRole.ADMIN || user.is_admin === true)) {
      router.replace(getDashboardRoute(user.role));
    }
  }, [isLoading, user, router]);

  return { user, isLoading, isAuthorized };
}

export function useRoleGuard(requiredRole: UserRole) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated — HARD navigation (see useAdminGuard: a client
      // push can ping-pong with the middleware into a blank page).
      if (!user) {
        window.location.assign("/login");
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
