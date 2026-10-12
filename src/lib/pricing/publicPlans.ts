/**
 * Pure helpers that turn the public plan catalogue
 * (GET /provider-billing/plans) into pricing-page copy. Every amount, name,
 * limit and feature comes from the API, so an admin's catalogue edit is what
 * visitors see. Nothing here invents a price or a currency.
 */

import type { PlatformCurrency } from "@/lib/api/currencies";
import type {
  BillingInterval,
  PlanAudience,
  ProviderBillingFeatures,
  ProviderBillingLimits,
  ProviderPlanPrice,
  PublicProviderPlanOption,
} from "@/lib/api/providerBilling";
import { formatMinor } from "@/lib/currencies/helpers";
import { ProviderPlanTier } from "@/lib/api/providerBilling";

/** The provider types the pricing pages price for, in display order. */
export const PROVIDER_AUDIENCES: readonly { value: Exclude<PlanAudience, "ALL">; label: string }[] = [
  { value: "personal_trainer", label: "Trainers" },
  { value: "dietitian", label: "Dietitians" },
  { value: "gym_owner", label: "Gyms" },
];

export interface PlanPriceView {
  /** "₦5,000.00", "Free", "Custom" or "Unavailable". */
  price: string;
  /** "/ month", "/ year", "talk to us", or the API's reason. */
  priceSub: string;
  /** True when price is a word rather than an amount. */
  text: boolean;
  /** The API's reason a paid price isn't shown, when it gave one. */
  unavailableReason: string | null;
  /** The interval actually shown (may differ from the one asked for). */
  interval: BillingInterval | null;
}

/**
 * The country whose catalogue the public pricing shows, for every visitor.
 * Plans are priced in naira only for now (owner decision, Oct 2026), so a
 * visitor detected elsewhere sees the same NGN prices rather than a "no
 * price set" row for their own country.
 */
export const PRICING_COUNTRY = "NG";

function priceFor(
  plan: Pick<PublicProviderPlanOption, "prices">,
  interval: BillingInterval,
): { price: ProviderPlanPrice; interval: BillingInterval } | null {
  const wanted = plan.prices[interval];
  if (wanted) return { price: wanted, interval };
  const other: BillingInterval = interval === "month" ? "year" : "month";
  const fallback = plan.prices[other];
  return fallback ? { price: fallback, interval: other } : null;
}

/**
 * How one plan's price reads for `interval`. The amount is formatted in the
 * currency the API returned it in; there is no conversion. When the asked-for
 * interval has no price, the other one is shown and labelled as such.
 */
export function planPriceView(
  plan: Pick<PublicProviderPlanOption, "code" | "prices" | "is_self_serve" | "price_unavailable_reason">,
  interval: BillingInterval,
  list?: readonly PlatformCurrency[] | null,
): PlanPriceView {
  const hit = priceFor(plan, interval);
  if (hit) {
    if (hit.price.amount_minor === 0) {
      return { price: "Free", priceSub: "no card needed", text: true, unavailableReason: null, interval: hit.interval };
    }
    return {
      price: formatMinor(hit.price.currency, hit.price.amount_minor, { list }),
      priceSub: hit.interval === "month" ? "/ month" : "/ year",
      text: false,
      unavailableReason: null,
      interval: hit.interval,
    };
  }
  if (plan.price_unavailable_reason) {
    return {
      price: "Unavailable",
      priceSub: plan.price_unavailable_reason,
      text: true,
      unavailableReason: plan.price_unavailable_reason,
      interval: null,
    };
  }
  if (!plan.is_self_serve) {
    return { price: "Custom", priceSub: "talk to us", text: true, unavailableReason: null, interval: null };
  }
  // No price at all only means free for the free tier. A paid tier the
  // admin hasn't priced yet must never read as free (an older API sends no
  // reason for it; a newer one says "No price is set for this plan yet.").
  if (plan.code === ProviderPlanTier.FREE) {
    return { price: "Free", priceSub: "no card needed", text: true, unavailableReason: null, interval: null };
  }
  const why = "No price is set for this plan yet.";
  return { price: "Price not set yet", priceSub: why, text: true, unavailableReason: why, interval: null };
}

/** True when any plan has a yearly price, so a Monthly/Annual toggle means something. */
export function hasYearlyPrices(plans: readonly Pick<PublicProviderPlanOption, "prices">[]): boolean {
  return plans.some((p) => !!p.prices.year && p.prices.year.amount_minor > 0);
}

/**
 * Whole-percent saving of paying yearly over twelve monthly payments, from
 * the plan's own prices. Null unless both exist in the same currency and the
 * yearly one is cheaper.
 */
export function yearlySavingPercent(plan: Pick<PublicProviderPlanOption, "prices">): number | null {
  const { month, year } = plan.prices;
  if (!month || !year || month.currency !== year.currency || month.amount_minor <= 0) return null;
  const twelve = month.amount_minor * 12;
  if (year.amount_minor >= twelve) return null;
  const pct = Math.round(((twelve - year.amount_minor) / twelve) * 100);
  return pct > 0 ? pct : null;
}

export const LIMIT_LABELS: readonly { key: keyof ProviderBillingLimits; noun: string }[] = [
  { key: "max_active_members", noun: "active members" },
  { key: "max_staff_members", noun: "staff seats" },
  { key: "max_listings", noun: "marketplace listings" },
  { key: "max_membership_plans", noun: "membership plans" },
];

export const FEATURE_LABELS: readonly { key: keyof ProviderBillingFeatures; label: string }[] = [
  { key: "consultations_enabled", label: "Consultations" },
  { key: "journals_enabled", label: "Client journals" },
  { key: "qr_checkin_enabled", label: "QR check-in" },
  { key: "forms_enabled", label: "Forms (PAR-Q, waivers)" },
  { key: "classes_enabled", label: "Class schedule" },
  { key: "analytics_enabled", label: "Analytics" },
  // No loyalty row: a provider's own loyalty program is on every tier, so it
  // is not something one plan has and another lacks.
  { key: "white_label_enabled", label: "White-label branding" },
  { key: "custom_domain_enabled", label: "Custom domain" },
  { key: "branded_email_enabled", label: "Branded email" },
  { key: "api_access_enabled", label: "API access" },
];

/** "Up to 250 active members", "1 marketplace listing", "Unlimited staff seats", "No staff seats". */
export function limitLine(value: number | null | undefined, noun: string): string {
  if (value === null || value === undefined) return `Unlimited ${noun}`;
  if (value === 0) return `No ${noun}`;
  if (value === 1) return `1 ${noun.replace(/s$/, "")}`;
  return `Up to ${value.toLocaleString("en")} ${noun}`;
}

/** A plan's card bullets: its limits, then the features it switches on. */
export function planFeatureLines(
  plan: Pick<PublicProviderPlanOption, "limits" | "features">,
): string[] {
  const limits = LIMIT_LABELS.map(({ key, noun }) => limitLine(plan.limits?.[key], noun));
  const features = FEATURE_LABELS.filter(({ key }) => plan.features?.[key] === true).map(
    ({ label }) => label,
  );
  return [...limits, ...features];
}

/** Plans in the API's display order. */
export function sortPlans<T extends Pick<PublicProviderPlanOption, "sort_order">>(plans: readonly T[]): T[] {
  return [...plans].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}
