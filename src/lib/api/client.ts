/**
 * API Client for Binectics Frontend
 * Handles all HTTP requests with authentication
 */

import type { ApiResponse } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

console.log("🔧 API Base URL:", API_BASE_URL);

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication token from localStorage
   */
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }

  /**
   * Set authentication token in localStorage
   */
  private setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("access_token", token);
  }

  /**
   * Remove authentication token from localStorage
   */
  private removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
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

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
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
      if (response.status === 401) {
        this.removeToken();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: this.getHeaders(includeAuth),
      });

      return this.handleResponse<T>(response);
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(body),
      });

      return this.handleResponse<T>(response);
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(body),
      });

      return this.handleResponse<T>(response);
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PATCH",
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(body),
      });

      return this.handleResponse<T>(response);
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE",
        headers: this.getHeaders(includeAuth),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * Store tokens after successful authentication
   */
  storeTokens(accessToken: string, refreshToken?: string): void {
    this.setToken(accessToken);
    if (refreshToken && typeof window !== "undefined") {
      localStorage.setItem("refresh_token", refreshToken);
    }
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    this.removeToken();
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
