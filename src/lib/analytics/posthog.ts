/**
 * PostHog (Cloud, EU) for the web: settings and the privacy filters every
 * event goes through. The component that loads it is
 * components/PostHogAnalytics.tsx; it does so only after the visitor accepts
 * the "Analytics" cookie category, never with Do Not Track on, and never
 * without NEXT_PUBLIC_POSTHOG_KEY.
 *
 * Tracking plan: binectics-plans/analytics/TRACKING-PLAN.md.
 */
import type { PostHogConfig, CaptureResult } from "posthog-js";

export const DEFAULT_POSTHOG_HOST = "https://eu.i.posthog.com";

export function posthogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || DEFAULT_POSTHOG_HOST;
}

/** The browser asks not to be tracked (navigator.doNotTrack / globalPrivacyControl). */
export function doNotTrack(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const win = typeof window === "undefined" ? undefined : (window as unknown as { doNotTrack?: string });
  const dnt = nav.doNotTrack ?? win?.doNotTrack ?? nav.msDoNotTrack;
  return dnt === "1" || dnt === "yes" || nav.globalPrivacyControl === true;
}

/** A path segment that is an id or a token (ObjectId, invite/reset token, uuid, long number). */
const ID_SEGMENT = /^(?:[0-9a-f]{24}|[0-9a-f-]{32,36}|\d{4,}|[A-Za-z0-9_-]{20,})$/i;

/**
 * A URL with no query string, no fragment, and every id-like path segment
 * replaced by ":id". Query strings carry tokens, emails and search text;
 * path ids say which client or booking was opened.
 */
export function sanitizeUrl(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw) return undefined;
  let url: URL;
  try {
    url = new URL(raw, "https://placeholder.invalid");
  } catch {
    return undefined;
  }
  const path = url.pathname
    .split("/")
    .map((seg) => (seg && ID_SEGMENT.test(decodeURIComponent(seg)) ? ":id" : seg))
    .join("/");
  return url.host === "placeholder.invalid" ? path : `${url.origin}${path}`;
}

const URL_PROPS = ["$current_url", "$pathname", "$initial_current_url", "$initial_pathname"] as const;
/** Dropped from every event: page titles can hold names; referrers can hold tokens. */
const DROPPED_PROPS = ["$title", "$referrer", "$initial_referrer", "$initial_title"] as const;

/** Runs on every event before it leaves the browser. */
export function beforeSend(event: CaptureResult | null): CaptureResult | null {
  if (!event) return null;
  const strip = (props: Record<string, unknown> | undefined) => {
    if (!props) return;
    for (const key of URL_PROPS) {
      if (key in props) props[key] = sanitizeUrl(props[key]);
    }
    for (const key of DROPPED_PROPS) delete props[key];
  };
  strip(event.properties as Record<string, unknown> | undefined);
  strip(event.$set as Record<string, unknown> | undefined);
  strip(event.$set_once as Record<string, unknown> | undefined);
  return event;
}

/**
 * Everything automatic is off: only page views (sent by the component, with
 * clean URLs) and the allowlisted track() events go out.
 */
export function posthogConfig(): Partial<PostHogConfig> {
  return {
    api_host: posthogHost(),
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_exceptions: false,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_feature_flags: true,
    advanced_disable_flags: true,
    respect_dnt: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    person_profiles: "identified_only",
    persistence: "localStorage+cookie",
    before_send: beforeSend,
  };
}
