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
