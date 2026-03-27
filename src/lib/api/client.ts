/**
 * API Client for Binectics Frontend
 * Handles all HTTP requests with authentication
 */

import type { ApiResponse } from "@/lib/types";
import {
  tokenStorage,
  refreshTokenStorage,
  clearAuthStorage,
} from "@/lib/utils/storage";
import { isAuthRoute } from "@/lib/constants/routes";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://binectics-gym-dev-api-dwbaeufeafgqd6db.canadacentral-01.azurewebsites.net/api/v1";

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication token
   */
  private getToken(): string | null {
    return tokenStorage.get();
  }

  /**
   * Build headers with authentication
   */
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private getAuthHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {};

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(
    response: Response,
    retryFn?: () => Promise<Response>,
  ): Promise<ApiResponse<T>> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    let data: any;
    if (isJson) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle 401 - Unauthorized (token expired)
      if (response.status === 401 && retryFn) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry the original request with the new token
          const retryResponse = await retryFn();
          return this.handleResponse<T>(retryResponse);
        }

        // Refresh failed — clear auth and redirect
        clearAuthStorage();
        if (
          typeof window !== "undefined" &&
          !isAuthRoute(window.location.pathname)
        ) {
          window.location.replace("/login");
          return new Promise<ApiResponse<T>>(() => {});
        }
      } else if (response.status === 401) {
        // No retry function (e.g. this is already a retry or a refresh call)
        clearAuthStorage();
        if (
          typeof window !== "undefined" &&
          !isAuthRoute(window.location.pathname)
        ) {
          window.location.replace("/login");
          return new Promise<ApiResponse<T>>(() => {});
        }
      }

      return {
        success: false,
        message: data.message || data.error || "An error occurred",
        errors: data.errors,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    includeAuth: boolean = true,
  ): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "GET",
          headers: this.getHeaders(includeAuth),
        });
      const response = await makeFetch();

      return this.handleResponse<T>(
        response,
        includeAuth ? makeFetch : undefined,
      );
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: any,
    includeAuth: boolean = true,
  ): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          headers: this.getHeaders(includeAuth),
          body: JSON.stringify(body),
        });
      const response = await makeFetch();

      return this.handleResponse<T>(
        response,
        includeAuth ? makeFetch : undefined,
      );
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: any,
    includeAuth: boolean = true,
  ): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "PUT",
          headers: this.getHeaders(includeAuth),
          body: JSON.stringify(body),
        });
      const response = await makeFetch();

      return this.handleResponse<T>(
        response,
        includeAuth ? makeFetch : undefined,
      );
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: any,
    includeAuth: boolean = true,
  ): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "PATCH",
          headers: this.getHeaders(includeAuth),
          body: JSON.stringify(body),
        });
      const response = await makeFetch();

      return this.handleResponse<T>(
        response,
        includeAuth ? makeFetch : undefined,
      );
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async postFormData<T>(
    endpoint: string,
    body: FormData,
    includeAuth: boolean = true,
  ): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          headers: this.getAuthHeaders(includeAuth),
          body,
        });
      const response = await makeFetch();

      return this.handleResponse<T>(
        response,
        includeAuth ? makeFetch : undefined,
      );
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async patchFormData<T>(
    endpoint: string,
    body: FormData,
    includeAuth: boolean = true,
  ): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "PATCH",
          headers: this.getAuthHeaders(includeAuth),
          body,
        });
      const response = await makeFetch();

      return this.handleResponse<T>(
        response,
        includeAuth ? makeFetch : undefined,
      );
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    includeAuth: boolean = true,
  ): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "DELETE",
          headers: this.getHeaders(includeAuth),
        });
      const response = await makeFetch();

      return this.handleResponse<T>(
        response,
        includeAuth ? makeFetch : undefined,
      );
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * Attempt to refresh the access token using the stored refresh token.
   * De-duplicates concurrent refresh attempts.
   */
  private async tryRefreshToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = refreshTokenStorage.get();
    if (!refreshToken) return false;

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return false;

        const result = await response.json();
        const data = result.data || result;

        if (data.access_token) {
          tokenStorage.set(data.access_token);
          if (data.refresh_token) {
            const maxAge = data.refresh_token_expires_at
              ? Math.floor(
                  (new Date(data.refresh_token_expires_at).getTime() -
                    Date.now()) /
                    1000,
                )
              : undefined;
            refreshTokenStorage.set(data.refresh_token, maxAge);
          }
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Store tokens after successful authentication
   */
  storeTokens(accessToken: string, refreshToken?: string): void {
    tokenStorage.set(accessToken);
    if (refreshToken) {
      refreshTokenStorage.set(refreshToken);
    }
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    clearAuthStorage();
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
