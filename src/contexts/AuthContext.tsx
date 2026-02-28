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
import { getDashboardRoute, getLoginRoute } from "@/lib/constants/routes";
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

// Parse JWT to get expiration time
function parseJWT(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
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

    const token = tokenStorage.get();
    if (!token) return;

    const payload = parseJWT(token);
    if (!payload?.exp) return;

    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;

    // Show warning 2 minutes before expiry
    const warningTime = timeUntilExpiry - 2 * 60 * 1000;

    let warningTimeout: NodeJS.Timeout;
    let expiryTimeout: NodeJS.Timeout;

    if (warningTime > 0) {
      warningTimeout = setTimeout(() => {
        setShowSessionModal(true);
        setSessionEnded(false);
      }, warningTime);
    } else if (timeUntilExpiry > 0) {
      // If less than 2 minutes remaining, show warning immediately
      setShowSessionModal(true);
      setSessionEnded(false);
    }

    if (timeUntilExpiry > 0) {
      expiryTimeout = setTimeout(() => {
        setShowSessionModal(true);
        setSessionEnded(true);
      }, timeUntilExpiry);
    } else {
      // Token already expired
      setShowSessionModal(true);
      setSessionEnded(true);
    }

    return () => {
      if (warningTimeout) clearTimeout(warningTimeout);
      if (expiryTimeout) clearTimeout(expiryTimeout);
    };
  }, [user]);

  const handleContinueSession = () => {
    setShowSessionModal(false);
    setSessionEnded(false);
    // In a real app, you might want to refresh the token here
  };

  const handleModalLogout = async () => {
    setShowSessionModal(false);
    await logout();
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
        router.push(getDashboardRoute(response.data.user.role));
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
