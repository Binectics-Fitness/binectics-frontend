/**
 * Where the API lives, for code that runs on the server.
 *
 * The browser always calls the same-origin /api/v1 path (client.ts), which
 * the next.config.ts rewrite and the netlify.toml redirect forward to
 * API_UPSTREAM_URL, so the auth cookies stay first-party. A server render has
 * no origin to resolve a relative path against, so it needs an absolute URL.
 *
 * Kept free of imports: next.config.ts loads this file before path aliases
 * exist. netlify.toml repeats the host because TOML cannot import it.
 */
export const API_UPSTREAM_URL =
  "https://binectics-gym-dev-api-dwbaeufeafgqd6db.canadacentral-01.azurewebsites.net/api/v1";

type Env = Record<string, string | undefined>;

/**
 * Base URL for server-side API calls, without a trailing slash.
 *
 * An absolute NEXT_PUBLIC_API_URL wins: local dev points it at a local API,
 * and on Netlify it names the site's own proxy, which a server function can
 * call like any other URL. Unset or relative (Vercel, previews) falls back to
 * the host the proxy forwards to. Public, unauthenticated reads only: no
 * cookies travel with these requests.
 */
export function serverApiBaseUrl(env: Env = process.env): string {
  const configured = env.NEXT_PUBLIC_API_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }
  return API_UPSTREAM_URL;
}
