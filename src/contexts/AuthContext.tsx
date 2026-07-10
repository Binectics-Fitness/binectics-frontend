"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api/auth";
import { getDashboardRoute, getLoginRoute, getOnboardingRoute } from "@/lib/constants/routes";
import { tokenStorage } from "@/lib/utils/storage";
import SessionModal from "@/components/SessionModal";
import type { User, LoginRequest, RegisterRequest } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<{
    success: boolean;
    error?: string;
    errors?: Record<string, string[]>;
  }>;
  register: (data: RegisterRequest) => Promise<{
    success: boolean;
    error?: string;
    errors?: Record<string, string[]>;
  }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  // Bumped after every successful token refresh so the monitoring effect
  // re-arms its timers against the NEW expiry. (Keying the effect on
  // user.id alone left the old expiry timer running after a refresh, which
  // fired a false "Session Expired" while the session was still valid.)
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Session timeout monitoring
  useEffect(() => {
    if (!user) {
      setShowSessionModal(false);
      setSessionEnded(false);
      return;
    }

    const expiresAt = tokenStorage.getExpiry();
    if (!expiresAt) return;

    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // Auto-refresh 5 minutes before expiry
    const autoRefreshTime = timeUntilExpiry - 5 * 60 * 1000;

    let refreshTimeout: NodeJS.Timeout;
    let expiryTimeout: NodeJS.Timeout;
    // Refresh calls are async: without this guard a continuation could show
    // the modal after this effect was torn down (e.g. right after logout).
    let cancelled = false;

    const attemptAutoRefresh = async (expired = false) => {
      const response = await authService.refreshToken();
      if (cancelled) return;
      if (response.success && response.data) {
        setSessionEpoch((e) => e + 1); // re-arm timers against the new expiry
      } else {
        // Auto-refresh failed — show the session modal as fallback
        setShowSessionModal(true);
        setSessionEnded(expired);
      }
    };

    if (autoRefreshTime > 0) {
      refreshTimeout = setTimeout(attemptAutoRefresh, autoRefreshTime);
    } else if (timeUntilExpiry > 0) {
      // Less than 5 minutes remaining — refresh immediately
      attemptAutoRefresh();
    }

    if (timeUntilExpiry > 0) {
      expiryTimeout = setTimeout(async () => {
        // This timer can outlive its token: a refresh in another tab (or a
        // race with auto-refresh) moves the stored expiry forward without
        // cancelling us. Trust storage, then one last refresh attempt,
        // before declaring the session dead.
        const currentExpiry = tokenStorage.getExpiry();
        if (currentExpiry && currentExpiry > Date.now()) {
          setSessionEpoch((e) => e + 1);
          return;
        }
        const response = await authService.refreshToken();
        if (cancelled) return;
        if (response.success && response.data) {
          setSessionEpoch((e) => e + 1);
          return;
        }
        setShowSessionModal(true);
        setSessionEnded(true);
      }, timeUntilExpiry);
    } else {
      // Expiry already passed — try refreshing before giving up
      attemptAutoRefresh(true);
    }

    return () => {
      cancelled = true;
      if (refreshTimeout) clearTimeout(refreshTimeout);
      if (expiryTimeout) clearTimeout(expiryTimeout);
    };
  }, [user?.id, sessionEpoch]);

  const handleContinueSession = async () => {
    setShowSessionModal(false);
    setSessionEnded(false);

    // Attempt to refresh the token
    const response = await authService.refreshToken();

    if (response.success && response.data) {
      // Token refreshed successfully - re-trigger session monitoring
      setSessionEpoch((e) => e + 1);
    } else {
      // Token refresh failed - force logout
      await logout();
    }
  };

  const handleModalLogout = async () => {
    setShowSessionModal(false);
    await logout();
  };

  // Dismiss the modal without logging in or out — the user stays on the
  // current page (e.g. to copy unsaved work before signing back in).
  const handleModalClose = () => {
    setShowSessionModal(false);
    setSessionEnded(false);
  };

  const login = async (
    data: LoginRequest,
  ): Promise<{
    success: boolean;
    error?: string;
    errors?: Record<string, string[]>;
  }> => {
    try {
      const response = await authService.login(data);

      if (response.success && response.data) {
        setUser(response.data.user);
        const u = response.data.user;
        if (u.must_change_password) {
          router.push("/admin/change-password");
        } else {
          const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          const rawRedirect = params?.get("redirect");
          // Only honour same-origin relative paths — reject absolute URLs and
          // protocol-relative `//host` paths so `?redirect=https://evil.com`
          // can't turn login into an open redirect.
          const redirect =
            rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
              ? rawRedirect
              : null;
          // First login picks up in onboarding. Gate on an explicit false so
          // accounts from a backend that omits the flag still reach their
          // dashboard instead of looping through onboarding forever.
          const needsOnboarding = u.is_onboarding_complete === false;
          router.push(redirect || (needsOnboarding ? getOnboardingRoute(u.role) : getDashboardRoute(u.role)));
        }
        return { success: true };
      }

      // Clear user state when login fails
      setUser(null);

      return {
        success: false,
        error: response.message || "Login failed",
        errors: response.errors,
      };
    } catch (error) {
      setUser(null);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const register = async (
    data: RegisterRequest,
  ): Promise<{
    success: boolean;
    error?: string;
    errors?: Record<string, string[]>;
  }> => {
    try {
      // Clear any previous session so the middleware doesn't
      // redirect the user back to a stale dashboard after OTP verification
      await authService.logout();
      setUser(null);

      const response = await authService.register(data);

      if (response.success && response.data) {
        // Redirect to verification page instead of logging in
        router.push(`/verification?email=${encodeURIComponent(data.email)}`);
        return { success: true };
      }

      return {
        success: false,
        error: response.message || "Registration failed",
        errors: response.errors,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      };
    }
  };

  const logout = async () => {
    const userRole = user?.role;

    try {
      await authService.logout();
      setUser(null);
      router.push(getLoginRoute(userRole));
    } catch {
      // Still clear local state and redirect even if API call fails
      setUser(null);
      router.push(getLoginRoute(userRole));
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
      <SessionModal
        isOpen={showSessionModal}
        sessionEnded={sessionEnded}
        onContinue={handleContinueSession}
        onLogout={handleModalLogout}
        onClose={handleModalClose}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
