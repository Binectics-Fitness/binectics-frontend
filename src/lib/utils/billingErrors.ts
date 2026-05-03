/**
 * Structured 403 helpers for the Provider SaaS Billing system.
 *
 * The backend returns:
 *   { statusCode: 403, error: 'BILLING_LIMIT_REACHED',  details: { quota, limit, current_usage, plan_tier } }
 *   { statusCode: 403, error: 'BILLING_FEATURE_DISABLED', details: { feature, plan_tier } }
 *
 * These helpers normalise the payload so UI code can render an upgrade
 * prompt without re-parsing the raw response on each call site.
 */

import type { ApiResponse } from "@/lib/types";

export const BILLING_LIMIT_REACHED = "BILLING_LIMIT_REACHED";
export const BILLING_FEATURE_DISABLED = "BILLING_FEATURE_DISABLED";

export type BillingErrorKind = "limit" | "feature" | null;

export interface BillingError {
  kind: BillingErrorKind;
  message: string;
  /** Quota key (limit) or feature key (feature). Null for non-billing errors. */
  resource: string | null;
  planTier: string | null;
  limit: number | null;
  currentUsage: number | null;
}

/**
 * Returns a normalised `BillingError` if the response is a structured 403
 * from the billing system; returns `null` otherwise.
 */
export function parseBillingError(
  res: ApiResponse<unknown>,
): BillingError | null {
  if (res.success || !res.code) return null;

  const details = res.details ?? {};
  const planTier =
    typeof details.plan_tier === "string" ? details.plan_tier : null;

  if (res.code === BILLING_LIMIT_REACHED) {
    return {
      kind: "limit",
      message: res.message ?? "Plan limit reached.",
      resource: typeof details.quota === "string" ? details.quota : null,
      planTier,
      limit: typeof details.limit === "number" ? details.limit : null,
      currentUsage:
        typeof details.current_usage === "number"
          ? details.current_usage
          : null,
    };
  }

  if (res.code === BILLING_FEATURE_DISABLED) {
    return {
      kind: "feature",
      message: res.message ?? "Feature not included in your current plan.",
      resource: typeof details.feature === "string" ? details.feature : null,
      planTier,
      limit: null,
      currentUsage: null,
    };
  }

  return null;
}

/** Human-readable label for a quota/feature key. */
export function billingResourceLabel(key: string | null): string {
  if (!key) return "this feature";
  return (
    {
      max_active_members: "active members",
      max_membership_plans: "membership plans",
      max_staff_members: "staff seats",
      max_listings: "listings",
      analytics_enabled: "analytics",
      consultations_enabled: "consultations",
      journals_enabled: "client journals",
      qr_checkin_enabled: "QR check-in",
      white_label_enabled: "white-label branding",
      custom_domain_enabled: "custom domains",
      branded_email_enabled: "branded email",
    }[key] ?? key.replace(/_/g, " ")
  );
}
