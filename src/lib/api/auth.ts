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
import { userStorage, clearAuthStorage, tokenStorage } from "@/lib/utils/storage";

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  refresh_token_expires_at?: string;
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
  new_password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ProfilePictureResponse {
  profile_picture: string | null;
  profile_picture_public_id: string | null;
}

export interface ResendOtpRequest {
  email: string;
}

function extractJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload?.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
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
      // Tokens are now httpOnly cookies set by the server — just store UI state.
      userStorage.set(response.data.user);
      if (response.data.access_token) {
        const exp = extractJwtExp(response.data.access_token);
        if (exp) tokenStorage.setExpiry(exp * 1000);
      }
    } else {
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
   * Logout current user.
   *
   * Best-effort server-side revoke of the refresh token, then clear local
   * state regardless of the result. `includeAuth: false` because the refresh
   * token in the body authenticates the call and the access token may already
   * be expired (this also avoids the client's 401 refresh/redirect path).
   */
  async logout(): Promise<void> {
    // POST with empty body — the server reads the httpOnly refresh_token cookie.
    await apiClient.post("/auth/logout", {}, false);
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
   * Change password for the authenticated user (used for the
   * "must_change_password" forced rotation flow on first login).
   */
  async changePassword(data: {
    current_password: string;
    new_password: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post("/auth/change-password", data);
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
    // Refresh token is an httpOnly cookie — send empty body; cookie is included automatically.
    const response = await apiClient.post<AuthTokens>("/auth/refresh", {}, false);
    if (response.success && response.data?.access_token) {
      const exp = extractJwtExp(response.data.access_token);
      if (exp) tokenStorage.setExpiry(exp * 1000);
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

  /**
   * Fetch fresh profile from API and sync to localStorage.
   * Use after operations that may promote the user's role (e.g. org creation
   * during onboarding) so subsequent role guards read the updated role.
   */
  async refreshUserFromApi(): Promise<User | null> {
    const response = await apiClient.get<User>("/auth/profile");
    if (response.success && response.data) {
      userStorage.set(response.data);
      return response.data;
    }
    return null;
  },

  /**
   * Update user profile on the server
   */
  async updateProfile(
    data: Record<string, unknown>,
  ): Promise<ApiResponse<User>> {
    return apiClient.patch<User>("/auth/profile", data);
  },

  async uploadProfilePicture(
    file: File,
  ): Promise<ApiResponse<ProfilePictureResponse>> {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.patchFormData<ProfilePictureResponse>(
      "/auth/profile/picture",
      formData,
    );
  },

  async deleteProfilePicture(): Promise<ApiResponse<ProfilePictureResponse>> {
    return apiClient.patch<ProfilePictureResponse>(
      "/auth/profile/picture/delete",
    );
  },
};
