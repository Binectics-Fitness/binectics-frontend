/**
 * Browser Storage Utilities
 * Centralized localStorage access with SSR safety
 */

import type { User } from "@/lib/types";

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
} as const;

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Token Storage
 */
export const tokenStorage = {
  get(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  set(token: string): void {
    if (!isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);

    // Also set as httpOnly cookie for middleware access
    // Note: We set it as a regular cookie since httpOnly can only be set server-side
    const maxAge = 60 * 60; // 1 hour (matches JWT expiration)
    document.cookie = `access_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  },

  remove(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);

    // Also remove cookie
    document.cookie =
      "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  },
};

/**
 * Refresh Token Storage
 */
export const refreshTokenStorage = {
  get(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  set(token: string): void {
    if (!isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);

    // Also set as cookie for middleware access
    const maxAge = 7 * 24 * 60 * 60; // 7 days
    document.cookie = `refresh_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  },

  remove(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

    // Also remove cookie
    document.cookie =
      "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  },
};

/**
 * User Data Storage
 */
export const userStorage = {
  get(): User | null {
    if (!isBrowser()) return null;

    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch (error) {
      console.error("Failed to parse user data:", error);
      return null;
    }
  },

  set(user: User): void {
    if (!isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  remove(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};

/**
 * Clear all authentication data
 */
export function clearAuthStorage(): void {
  tokenStorage.remove();
  refreshTokenStorage.remove();
  userStorage.remove();
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  return !!tokenStorage.get();
}
