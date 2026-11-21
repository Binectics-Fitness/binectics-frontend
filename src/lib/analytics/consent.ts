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

/** The configured analytics tool's id, or null when none is set up. */
export function analyticsMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim();
  return id && /^G-[A-Z0-9]+$/i.test(id) ? id : null;
}

export function analyticsConfigured(): boolean {
  return analyticsMeasurementId() !== null;
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
