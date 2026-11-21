/**
 * Analytics consent, as recorded by the cookie banner (CookieConsent.tsx).
 *
 * Nothing analytics-related may load or send before the visitor accepts the
 * "Analytics" category. The record lives in localStorage under
 * CONSENT_STORAGE_KEY; the banner fires CONSENT_EVENT on document whenever
 * it changes.
 */
export const CONSENT_STORAGE_KEY = "binectics-cookies";
export const CONSENT_EVENT = "cookies:change";
/** Bump to ask everyone again when the categories or tools change. */
export const CONSENT_VERSION = "3.0";

/** The Google Analytics 4 measurement id, or null when GA is not set up. */
export function analyticsMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim();
  return id && /^G-[A-Z0-9]+$/i.test(id) ? id : null;
}

/** The PostHog project key, or null when PostHog is not set up. */
export function posthogKey(): string | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return key ? key : null;
}

/**
 * Whether ANY analytics tool is configured. The cookie banner only appears
 * when one is: with none there is nothing optional to ask about.
 */
export function analyticsConfigured(): boolean {
  return analyticsMeasurementId() !== null || posthogKey() !== null;
}

export function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as { analytics?: unknown; version?: unknown };
    return data.version === CONSENT_VERSION && data.analytics === true;
  } catch {
    return false;
  }
}

export type ConsentCategory = "analytics";

/** Whether the visitor has accepted a consent category. Analytics is the only optional one. */
export function hasConsent(category: ConsentCategory): boolean {
  return category === "analytics" ? hasAnalyticsConsent() : false;
}

/**
 * Calls `listener` with the current analytics consent now and every time it
 * changes (accept, reject, withdraw from the cookie button). Returns an
 * unsubscribe function. For code outside React (e.g. an analytics client
 * that must opt in or out).
 */
export function onAnalyticsConsentChange(listener: (granted: boolean) => void): () => void {
  if (typeof document === "undefined") return () => {};
  const handler = () => listener(hasAnalyticsConsent());
  handler();
  document.addEventListener(CONSENT_EVENT, handler);
  return () => document.removeEventListener(CONSENT_EVENT, handler);
}
