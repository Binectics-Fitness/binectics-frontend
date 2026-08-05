/**
 * Turns the admin-configured provider plans (from `GET /provider-billing/plans`)
 * into the view models the pricing page renders. This is the single mapping
 * layer between the backend catalogue and the marketing UI, so plan names,
 * quotas, feature flags and prices always reflect what admins set in
 * `/admin/plans`. Nothing here invents pricing or feature data.
 */

import type {
  ProviderPlanOption,
  ProviderBillingFeatures,
  ProviderBillingLimits,
} from "@/lib/api/providerBilling";
import type { PlanCardPlan } from "@/components/ds/PlanCard";
import { formatCurrency } from "@/utils/format";

type Interval = "month" | "year";

/**
 * Presentational chrome (short strapline + button label) keyed by the tier
 * code. This is UI copy, not pricing or feature data — the actual capabilities
 * always come from the backend.
 */
const TIER_META: Record<string, { meta: string; cta: string }> = {
  free: { meta: "For getting started", cta: "Start free" },
  pro: { meta: "For growing practices", cta: "Choose" },
  enterprise: { meta: "For multi-location teams", cta: "Talk to sales" },
};

/** Human-facing label for each admin feature flag. */
const FEATURE_LABELS: Record<keyof ProviderBillingFeatures, string> = {
  analytics_enabled: "Revenue and check-in analytics",
  consultations_enabled: "Consultations and bookings",
  journals_enabled: "Client journals and logs",
  qr_checkin_enabled: "QR check-in and streaks",
  classes_enabled: "Class scheduling",
  forms_enabled: "Forms (PAR-Q, waivers)",
  loyalty_enabled: "Loyalty rewards",
  white_label_enabled: "White-label branding",
  custom_domain_enabled: "Custom domain",
  branded_email_enabled: "Branded email",
  api_access_enabled: "API access",
};

/** The order feature flags appear in, on both the cards and the comparison table. */
const FEATURE_ORDER: (keyof ProviderBillingFeatures)[] = [
  "analytics_enabled",
  "consultations_enabled",
  "journals_enabled",
  "qr_checkin_enabled",
  "classes_enabled",
  "forms_enabled",
  "loyalty_enabled",
  "white_label_enabled",
  "custom_domain_enabled",
  "branded_email_enabled",
  "api_access_enabled",
];

function plural(n: number, singular: string): string {
  return `${n.toLocaleString()} ${singular}${n === 1 ? "" : "s"}`;
}

/** Capacity bullets derived from a plan's quota columns (null = unlimited). */
function quotaBullets(limits: ProviderBillingLimits): string[] {
  const bullets: string[] = [];

  bullets.push(
    limits.max_listings === null
      ? "Unlimited marketplace listings"
      : plural(limits.max_listings, "marketplace listing"),
  );

  bullets.push(
    limits.max_active_members === null
      ? "Unlimited active members"
      : `Up to ${limits.max_active_members.toLocaleString()} active members`,
  );

  if (limits.max_staff_members === null) {
    bullets.push("Unlimited staff seats");
  } else if (limits.max_staff_members > 0) {
    bullets.push(plural(limits.max_staff_members, "staff seat"));
  }

  bullets.push(
    limits.max_membership_plans === null
      ? "Unlimited membership plans"
      : `Up to ${plural(limits.max_membership_plans, "membership plan")}`,
  );

  return bullets;
}

/** Feature bullets for every flag the admin has switched on for this plan. */
function featureBullets(features: ProviderBillingFeatures): string[] {
  return FEATURE_ORDER.filter((key) => features[key]).map(
    (key) => FEATURE_LABELS[key],
  );
}

/**
 * Price + interval label for a plan. The free tier is always free; any other
 * tier without a configured price for this market falls back to "Custom" so
 * the card never shows a fabricated number.
 */
function priceView(
  plan: ProviderPlanOption,
  interval: Interval,
  locale: string,
): { price: string; priceSub: string; isText: boolean } {
  if (plan.code === "free") {
    return { price: "Free", priceSub: "forever", isText: true };
  }

  const want = interval === "year" ? plan.prices.year : plan.prices.month;
  if (want) {
    return {
      price: formatCurrency(want.amount_minor / 100, want.currency, locale),
      priceSub: interval === "year" ? "/ year" : "/ month",
      isText: false,
    };
  }

  // Fall back to the other interval so a plan priced monthly still shows a
  // number when the annual toggle is on (and vice versa).
  const other = interval === "year" ? plan.prices.month : plan.prices.year;
  if (other) {
    return {
      price: formatCurrency(other.amount_minor / 100, other.currency, locale),
      priceSub: interval === "year" ? "/ month" : "/ year",
      isText: false,
    };
  }

  return { price: "Custom", priceSub: "talk to us", isText: true };
}

/** Build the pricing cards from the admin plan catalogue, sorted by tier order. */
export function toPlanCards(
  plans: ProviderPlanOption[],
  interval: Interval,
  locale: string,
): PlanCardPlan[] {
  const sorted = [...plans].sort((a, b) => a.sort_order - b.sort_order);

  return sorted.map((plan, idx) => {
    const chrome = TIER_META[plan.code] ?? { meta: "", cta: "Choose" };
    const { price, priceSub, isText } = priceView(plan, interval, locale);
    const prev = idx > 0 ? sorted[idx - 1] : null;
    const isEnterprise = plan.code === "enterprise";
    const cta =
      chrome.cta === "Choose" ? `Choose ${plan.name}` : chrome.cta;

    return {
      name: plan.name,
      meta: chrome.meta,
      price,
      priceSub,
      text: isText,
      tagline: plan.description,
      cta,
      ghost: plan.code === "free",
      featured: plan.code === "pro",
      ink: isEnterprise,
      divider: prev ? `Everything in ${prev.name}, plus` : "Includes",
      features: [...quotaBullets(plan.limits), ...featureBullets(plan.features)],
    };
  });
}

export interface ComparisonRow {
  feature: string;
  /** One cell per plan (column order matches `planHeaders`). */
  cells: (string | boolean | null)[];
}

export interface ComparisonGroup {
  group: string;
  rows: ComparisonRow[];
}

export interface ComparisonView {
  planHeaders: { name: string; priceLabel: string; featured: boolean }[];
  groups: ComparisonGroup[];
}

function limitCell(value: number | null, zeroAsDash = false): string | null {
  if (value === null) return "Unlimited";
  if (value === 0 && zeroAsDash) return null;
  return value.toLocaleString();
}

/** Build the side-by-side comparison table straight from the admin catalogue. */
export function toComparison(
  plans: ProviderPlanOption[],
  interval: Interval,
  locale: string,
): ComparisonView {
  const sorted = [...plans].sort((a, b) => a.sort_order - b.sort_order);

  const planHeaders = sorted.map((plan) => {
    const { price, priceSub } = priceView(plan, interval, locale);
    return {
      name: plan.name,
      priceLabel: price === "Free" || price === "Custom" ? price : `${price} ${priceSub}`,
      featured: plan.code === "pro",
    };
  });

  const capacity: ComparisonGroup = {
    group: "Capacity",
    rows: [
      {
        feature: "Marketplace listings",
        cells: sorted.map((p) => limitCell(p.limits.max_listings)),
      },
      {
        feature: "Active members / clients",
        cells: sorted.map((p) => limitCell(p.limits.max_active_members)),
      },
      {
        feature: "Staff seats",
        cells: sorted.map((p) => limitCell(p.limits.max_staff_members, true)),
      },
      {
        feature: "Membership plans",
        cells: sorted.map((p) => limitCell(p.limits.max_membership_plans)),
      },
    ],
  };

  const features: ComparisonGroup = {
    group: "Features",
    rows: FEATURE_ORDER.map((key) => ({
      feature: FEATURE_LABELS[key],
      cells: sorted.map((p) => (p.features[key] ? true : null)),
    })),
  };

  return { planHeaders, groups: [capacity, features] };
}
