/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { apiClient } from './client';
import type {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
} from '@/lib/types';

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
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data, false);

    if (response.success && response.data) {
      // Store tokens and user data
      apiClient.storeTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );

      // Store user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response;
  },

  /**
   * Register a new user
   * Note: Registration does not return tokens. User must verify OTP first.
   */
  async register(data: RegisterRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.post<User>('/auth/register', data, false);
    console.log('Register response:', response);

    // Registration only returns user data, no tokens
    // User needs to verify OTP before authentication

    return response;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Always clear local auth data
      apiClient.clearAuth();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
    }
  },

  /**
   * Request password reset email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/forgot-password', data, false);
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/reset-password', data, false);
  },

  /**
   * Verify email address with token
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/verify-email', data, false);
  },

  /**
   * Verify OTP code
   */
  async verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse<{ message: string; user?: User }>> {
    return apiClient.post('/auth/verify-otp', data, false);
  },

  /**
   * Resend OTP code
   */
  async resendOtp(data: ResendOtpRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/resend-otp', data, false);
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Server-side token refresh not supported' };
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return { success: false, message: 'No refresh token available' };
    }

    const response = await apiClient.post<AuthTokens>(
      '/auth/refresh',
      { refreshToken },
      false
    );

    if (response.success && response.data) {
      apiClient.storeTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  },

  /**
   * Update stored user data
   */
  updateUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },
};
