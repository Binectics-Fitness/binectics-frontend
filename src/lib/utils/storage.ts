/**
 * Browser Storage Utilities
 * Centralized localStorage access with SSR safety
 */

import type { User } from "@/lib/types";

const STORAGE_KEYS = {
  USER: "user",
} as const;

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * `; Secure` on HTTPS so auth cookies are never sent over plain HTTP.
 * Skipped on http://localhost so local development still works.
 */
function secureFlag(): string {
  return isBrowser() && window.location.protocol === "https:" ? "; Secure" : "";
}

/**
 * Token Storage
 *
 * Tokens are now issued as httpOnly cookies by the server (MF-2).
 * The browser sends them automatically on every credentialed request —
 * no JS-accessible storage needed. These stubs are kept so call-sites
 * don't need to be updated en masse; they are all no-ops.
 */
export const tokenStorage = {
  /** Always returns null — token lives in an httpOnly cookie. */
  get(): string | null {
    return null;
  },
  set(_token: string): void {
    /* server sets the httpOnly cookie; nothing to do client-side */
  },
  remove(): void {
    /* server clears the cookie on logout */
  },
};

/**
 * Refresh Token Storage
 *
 * Same rationale as tokenStorage — the refresh token is an httpOnly cookie
 * set by the server. Client code that previously read or wrote this value
 * now passes undefined/null, which the ApiClient handles correctly by
 * omitting the body field and relying on the cookie being sent automatically.
 */
export const refreshTokenStorage = {
  /** Always returns null — token lives in an httpOnly cookie. */
  get(): string | null {
    return null;
  },
  set(_token: string, _maxAge?: number): void {
    /* server sets the httpOnly cookie; nothing to do client-side */
  },
  remove(): void {
    /* server clears the cookie on logout */
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

    const maxAge = 60 * 60; // 1 hour (matches access token)

    // Set user_role cookie so middleware can redirect to the correct dashboard
    if (user.role) {
      document.cookie = `user_role=${user.role}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag()}`;
    }

    // Mirror must_change_password to a cookie so middleware can gate
    // /admin/* server-side without waiting for the client shell.
    if (user.must_change_password) {
      document.cookie = `must_change_password=1; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag()}`;
    } else {
      document.cookie =
        "must_change_password=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    // Mirror onboarding status so middleware can route correctly.
    if (user.is_onboarding_complete) {
      document.cookie = `onboarding_complete=1; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag()}`;
    } else {
      document.cookie =
        "onboarding_complete=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  },

  remove(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.USER);

    // Also remove user_role + must_change_password + onboarding_complete cookies
    document.cookie =
      "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "must_change_password=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "onboarding_complete=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
