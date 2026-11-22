"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { PostHog } from "posthog-js";
import { posthogKey } from "@/lib/analytics/consent";
import { useConsent } from "@/lib/analytics/useConsent";
import { registerAnalyticsSink } from "@/lib/analytics/track";
import { doNotTrack, posthogConfig, sanitizeUrl } from "@/lib/analytics/posthog";
import { useAuth } from "@/contexts/AuthContext";

const ROLES = new Set(["user", "trainer", "dietitian", "gym_owner", "admin"]);

/**
 * PostHog, loaded ONLY after the visitor accepts "Analytics" in the cookie
 * banner, with Do Not Track off and a project key set. Until then posthog-js
 * is not even downloaded: no script, no request, no cookie.
 *
 * - Page views are sent here, with the query string dropped and ids in the
 *   path replaced by ":id" (lib/analytics/posthog.ts beforeSend).
 * - track() events (allowlisted, consent-checked) reach PostHog through
 *   registerAnalyticsSink.
 * - Signed in: identified by the internal user id, with the role as the only
 *   person property. Signing out resets to a new anonymous id.
 * - Withdrawing consent: opt out and reset at once.
 */
export function PostHogAnalytics() {
  const key = posthogKey();
  const consented = useConsent("analytics");
  const pathname = usePathname() ?? "/";
  const { user } = useAuth();
  const [client, setClient] = useState<PostHog | null>(null);
  const identified = useRef<string | null>(null);
  const allowed = !!key && consented && !doNotTrack();

  // Load (once) on consent; opt back in if it was loaded before a withdrawal.
  useEffect(() => {
    if (!allowed || !key) return;
    let cancelled = false;
    void import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;
      if (!posthog.__loaded) posthog.init(key, posthogConfig());
      if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing({ captureEventName: false });
      setClient(posthog);
    });
    return () => {
      cancelled = true;
    };
  }, [allowed, key]);

  // Withdrawn (or Do Not Track turned on): stop and forget this browser's id.
  useEffect(() => {
    if (allowed || !client) return;
    client.opt_out_capturing();
    client.reset();
    identified.current = null;
  }, [allowed, client]);

  // The loaded client, only while consent stands.
  const active = allowed ? client : null;

  // Everything track() lets through goes to PostHog too.
  useEffect(() => {
    if (!active) return;
    return registerAnalyticsSink((event, params) => active.capture(event, params));
  }, [active]);

  // Who: the internal id and the role, nothing else. Sign-out resets.
  const userId = user?.id ?? null;
  const role = typeof user?.role === "string" ? user.role.toLowerCase() : null;
  useEffect(() => {
    if (!active) return;
    if (userId && identified.current !== userId) {
      active.identify(userId, role && ROLES.has(role) ? { role } : undefined);
      identified.current = userId;
    } else if (!userId && identified.current) {
      active.reset();
      identified.current = null;
    }
  }, [active, userId, role]);

  // Page views, with clean URLs.
  useEffect(() => {
    if (!active) return;
    active.capture("$pageview", { $current_url: sanitizeUrl(window.location.href) });
  }, [active, pathname]);

  return null;
}
