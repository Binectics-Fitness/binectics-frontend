/**
 * Application Routes & Navigation
 */

import type { UserRole } from "@/lib/types";

/**
 * Authentication routes
 */
export const AUTH_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFICATION: "/verification",
  VERIFY_EMAIL: "/verify-email",
} as const;

/**
 * Dashboard routes by user role
 */
export const DASHBOARD_ROUTES: Readonly<Record<UserRole, string>> = {
  USER: "/dashboard",
  GYM_OWNER: "/dashboard/gym-owner",
  TRAINER: "/dashboard/trainer",
  DIETICIAN: "/dashboard/dietician",
  ADMIN: "/admin/dashboard",
};

/**
 * Get dashboard route for user role
 */
export function getDashboardRoute(role: UserRole): string {
  return DASHBOARD_ROUTES[role] || DASHBOARD_ROUTES.USER;
}

/**
 * Get login route for user role
 */
export function getLoginRoute(role?: UserRole): string {
  return role === "ADMIN" ? "/admin" : AUTH_ROUTES.LOGIN;
}

/**
 * Check if pathname is an auth route
 */
export function isAuthRoute(pathname: string): boolean {
  return Object.values(AUTH_ROUTES).some((route) => pathname.startsWith(route));
}

/**
 * Check if pathname is a dashboard route
 */
export function isDashboardRoute(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
}
