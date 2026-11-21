/**
 * The only way the app sends an analytics event.
 *
 * Rules (owner brief, Nov 2026):
 *   - nothing is sent without analytics consent (hasAnalyticsConsent);
 *   - only the events below, with only the listed properties;
 *   - never health, fasting, faith or payment details. The property
 *     allowlist enforces that: anything not listed is dropped, and values
 *     are short plain tokens, never free text a person typed.
 *
 * Page views are sent by the analytics tool itself once it loads (after
 * consent), so they need no call here.
 */
import { analyticsConfigured, hasAnalyticsConsent } from "./consent";

export const ANALYTICS_EVENTS = {
  /** A visitor clicked a call to action that starts sign-up. */
  cta_click: ["cta", "page"],
  /** The sign-up form was shown. */
  sign_up_start: ["role"],
  /** An account was created. */
  sign_up_complete: ["role"],
} as const;

export type AnalyticsEvent = keyof typeof ANALYTICS_EVENTS;
type Params = Record<string, string | undefined>;

const TOKEN = /^[a-z0-9_/-]{1,80}$/i;

/** Keeps allowed keys whose values are short plain tokens. Exported for tests. */
export function cleanParams(event: AnalyticsEvent, params: Params = {}): Record<string, string> {
  const allowed = ANALYTICS_EVENTS[event] as readonly string[];
  const out: Record<string, string> = {};
  for (const key of allowed) {
    const value = params[key];
    if (typeof value === "string" && TOKEN.test(value)) out[key] = value;
  }
  return out;
}

type Gtag = (command: "event", name: string, params: Record<string, string>) => void;

/** Receives every event track() lets through (consented, allowlisted, cleaned). */
export type AnalyticsSink = (event: AnalyticsEvent, params: Record<string, string>) => void;

const sinks = new Set<AnalyticsSink>();

/**
 * Plug an analytics client (e.g. PostHog) into track(). It only ever
 * receives events that passed the consent check and the allowlist. Returns
 * an unregister function.
 */
export function registerAnalyticsSink(sink: AnalyticsSink): () => void {
  sinks.add(sink);
  return () => {
    sinks.delete(sink);
  };
}

export function track(event: AnalyticsEvent, params?: Params): void {
  if (typeof window === "undefined") return;
  if (!analyticsConfigured() || !hasAnalyticsConsent()) return;
  const clean = cleanParams(event, params);
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("event", event, clean);
  for (const sink of sinks) {
    try {
      sink(event, clean);
    } catch {
      // An analytics client must never break the page.
    }
  }
}
