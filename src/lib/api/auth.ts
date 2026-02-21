/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { apiClient } from "./client";
import type {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
} from "@/lib/types";
import { userStorage, refreshTokenStorage, clearAuthStorage } from "@/lib/utils/storage";

export interface LoginResponse {
  user: User;
  access_token: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      data,
      false,
    );

    if (response.success && response.data) {
      // Store access token
      apiClient.storeTokens(response.data.access_token);
      // Store user data
      userStorage.set(response.data.user);
    } else {
      // Clear any stale auth data when login fails
      clearAuthStorage();
    }

    return response;
  },

  /**
   * Register a new user
   * Note: Registration does not return tokens. User must verify OTP first.
   */
  async register(data: RegisterRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>("/auth/register", data, false);
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    clearAuthStorage();
  },

  /**
   * Request password reset email
   */
  async forgotPassword(
    data: ForgotPasswordRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post("/auth/forgot-password", data, false);
  },

  /**
   * Reset password with token
   */
  async resetPassword(
    data: ResetPasswordRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post("/auth/reset-password", data, false);
  },

  /**
   * Verify email address with token
   */
  async verifyEmail(
    data: VerifyEmailRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post("/auth/verify-email", data, false);
  },

  /**
   * Verify OTP code
   */
  async verifyOtp(
    data: VerifyOtpRequest,
  ): Promise<ApiResponse<{ message: string; user?: User }>> {
    return apiClient.post("/auth/verify-otp", data, false);
  },

  /**
   * Resend OTP code
   */
  async resendOtp(
    data: ResendOtpRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post("/auth/resend-otp", data, false);
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const refreshToken = refreshTokenStorage.get();
    if (!refreshToken) {
      return { success: false, message: "No refresh token available" };
    }

    const response = await apiClient.post<AuthTokens>(
      "/auth/refresh",
      { refreshToken },
      false,
    );

    if (response.success && response.data) {
      apiClient.storeTokens(
        response.data.access_token,
        response.data.refresh_token,
      );
    }

    return response;
  },

  /**
   * Get current user from storage
   */
  getCurrentUser(): User | null {
    return userStorage.get();
  },

  /**
   * Update stored user data
   */
  updateUser(user: User): void {
    userStorage.set(user);
  },
};
