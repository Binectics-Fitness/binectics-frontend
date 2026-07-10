/**
 * API Client for Binectics Frontend
 * Handles all HTTP requests with authentication
 */

import type { ApiResponse } from "@/lib/types";
import { clearAuthStorage } from "@/lib/utils/storage";
import { isAuthRoute } from "@/lib/constants/routes";

// Default to the same-origin path served by the netlify.toml proxy. The API
// must be same-origin in production so the httpOnly auth cookies are
// first-party; a direct cross-site URL here breaks login in browsers that
// block third-party cookies. All API consumers run in the browser, so a
// relative path is safe. Local dev overrides this via NEXT_PUBLIC_API_URL.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

/** The loosely-typed envelope every API response is parsed into before it is
 *  narrowed to a concrete ApiResponse<T>. Replaces an untyped `any`. */
interface RawResponseBody {
  data?: unknown;
  message?: unknown;
  error?: unknown;
  code?: unknown;
  errors?: Record<string, string[]>;
  details?: unknown;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Build JSON headers. Auth is handled by the httpOnly access_token cookie
   * sent automatically on every credentialed request — no Authorization header needed.
   */
  private getHeaders(): HeadersInit {
    return { "Content-Type": "application/json" };
  }

  /** Headers for multipart/form-data requests (no Content-Type so fetch sets the boundary). */
  private getAuthHeaders(): HeadersInit {
    return {};
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

    // Guard the parse: a non-2xx response that advertises JSON but sends an
    // empty/truncated/HTML body (gateway 502/504 pages, 204s) would otherwise
    // throw here and be reported as a misleading "Network error" — dropping the
    // real HTTP status that 401-refresh handling depends on.
    let parsed: unknown = undefined;
    try {
      parsed = isJson ? await response.json() : await response.text();
    } catch {
      parsed = undefined;
    }
    const body: RawResponseBody =
      parsed && typeof parsed === "object" ? (parsed as RawResponseBody) : {};

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

      const rawMsg = body.message || body.error || "An error occurred";
      const message = Array.isArray(rawMsg) ? rawMsg.join(". ") : String(rawMsg);

      return {
        success: false,
        message,
        errors: body.errors,
        // Two error shapes exist: billing errors carry `error`
        // ("BILLING_LIMIT_REACHED"), auth errors carry `code`
        // ("AUTH_TOKEN_USED").
        code:
          typeof body.error === "string"
            ? body.error
            : typeof body.code === "string"
              ? body.code
              : undefined,
        details:
          body.details && typeof body.details === "object"
            ? (body.details as Record<string, unknown>)
            : undefined,
        status: response.status,
      };
    }

    // Unwrap a `{ data }` envelope when the `data` key is present, else return
    // the payload as-is. Uses a key-presence check (not truthiness) so a
    // legitimately falsy payload (`0`, `false`, `""`, `null`) isn't discarded
    // in favour of the whole envelope.
    const hasDataKey =
      parsed !== null && typeof parsed === "object" && "data" in parsed;
    return {
      success: true,
      data: (hasDataKey ? body.data : parsed) as T,
      message: typeof body.message === "string" ? body.message : undefined,
    };
  }

  async get<T>(endpoint: string, _includeAuth = true): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "GET",
          headers: this.getHeaders(),
          credentials: "include",
        });
      return this.handleResponse<T>(await makeFetch(), makeFetch);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Network error" };
    }
  }

  async post<T>(endpoint: string, body?: unknown, _includeAuth = true): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(body),
          credentials: "include",
        });
      return this.handleResponse<T>(await makeFetch(), makeFetch);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Network error" };
    }
  }

  async put<T>(endpoint: string, body?: unknown, _includeAuth = true): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify(body),
          credentials: "include",
        });
      return this.handleResponse<T>(await makeFetch(), makeFetch);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Network error" };
    }
  }

  async patch<T>(endpoint: string, body?: unknown, _includeAuth = true): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify(body),
          credentials: "include",
        });
      return this.handleResponse<T>(await makeFetch(), makeFetch);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Network error" };
    }
  }

  async postFormData<T>(endpoint: string, body: FormData, _includeAuth = true): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          headers: this.getAuthHeaders(),
          body,
          credentials: "include",
        });
      return this.handleResponse<T>(await makeFetch(), makeFetch);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Network error" };
    }
  }

  async patchFormData<T>(endpoint: string, body: FormData, _includeAuth = true): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "PATCH",
          headers: this.getAuthHeaders(),
          body,
          credentials: "include",
        });
      return this.handleResponse<T>(await makeFetch(), makeFetch);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Network error" };
    }
  }

  async delete<T>(endpoint: string, body?: unknown, _includeAuth = true): Promise<ApiResponse<T>> {
    try {
      const makeFetch = () =>
        fetch(`${this.baseUrl}${endpoint}`, {
          method: "DELETE",
          headers: this.getHeaders(),
          credentials: "include",
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
      return this.handleResponse<T>(await makeFetch(), makeFetch);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Network error" };
    }
  }

  /**
   * Attempt to refresh the access token.
   * The httpOnly refresh_token cookie is sent automatically with credentials:"include".
   * De-duplicates concurrent refresh attempts.
   */
  private async tryRefreshToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          credentials: "include",
        });

        return response.ok;
      } catch {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /** Clear UI-state auth data (token cookies are cleared server-side on logout). */
  clearAuth(): void {
    clearAuthStorage();
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
