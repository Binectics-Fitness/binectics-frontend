/**
 * The one public address of the web app: what canonical tags, the sitemap
 * and robots.txt name, and the only host search engines may index.
 *
 * It lives in code rather than only in hosting settings because the app is
 * deployed to several hosts (Netlify, its branch aliases, Vercel, Azure) and
 * they must all name the SAME address, not each their own. An unset variable
 * used to fall back to http://localhost:3001, which the live sitemap and
 * canonical tags then published.
 *
 * Moving to a custom domain (app.binectics.com) is a change to this constant,
 * made once that domain is actually serving the app.
 * NEXT_PUBLIC_APP_URL overrides it for local work or a separate environment.
 */
export const DEFAULT_SITE_URL = "https://binectics.netlify.app";

type Env = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

/** True on a build or server run by a hosting platform, not a laptop or CI. */
function isHostedDeploy(env: Env): boolean {
  return env.NETLIFY === "true" || Boolean(env.VERCEL) || Boolean(env.WEBSITE_SITE_NAME);
}

/**
 * Resolves the site URL, without a trailing slash. Throws when an override is
 * not an absolute http(s) URL, or when a hosted deploy would publish a local
 * address; next.config.ts calls it so either case fails the build.
 */
export function resolveSiteUrl(env: Env = process.env): string {
  const raw = env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`NEXT_PUBLIC_APP_URL must be an absolute URL, got "${raw}"`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`NEXT_PUBLIC_APP_URL must be http(s), got "${raw}"`);
  }
  if (isHostedDeploy(env) && LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(
      `NEXT_PUBLIC_APP_URL is "${raw}" on a hosted deploy. Unset it to use ${DEFAULT_SITE_URL}, or set the real public address.`,
    );
  }
  return url.origin;
}

/**
 * Never throws: this module also loads in the middleware on every request,
 * and an app built on CI (Azure builds on GitHub Actions) can see a hosting
 * variable only at run time. The strict check is next.config.ts's job; at run
 * time an unusable override falls back to the production address rather
 * than failing every page.
 */
function siteUrlOrDefault(): string {
  try {
    return resolveSiteUrl();
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = siteUrlOrDefault();

/** Host (with port, if any) of SITE_URL, as a request's Host header carries it. */
export const SITE_HOST = new URL(SITE_URL).host;

/**
 * Whether a request arrived on the canonical host. Every other host the app
 * answers on (vercel.app, main--binectics.netlify.app, deploy previews,
 * azurewebsites.net) is a copy and must not be indexed.
 */
export function isCanonicalHost(host: string | null | undefined, siteHost: string = SITE_HOST): boolean {
  return (host ?? "").toLowerCase() === siteHost.toLowerCase();
}
