/**
 * Display helpers for a membership plan: its cadence next to the price.
 * Prices themselves go through formatMinor in the plan's own currency.
 */

import type { MarketplaceMembershipPlan } from "@/lib/types";
import { MembershipPlanType } from "@/lib/types";

/** "/ month" for 30d subscriptions, "/ year" for 365d, "/ week", "/ N days", or "once" for one-time. */
export function planPerLabel(
  plan: Pick<MarketplaceMembershipPlan, "plan_type" | "duration_days">,
): string {
  if (plan.plan_type === MembershipPlanType.ONE_TIME) return "once";
  if (plan.duration_days === 30 || plan.duration_days === 31) return "/ month";
  if (plan.duration_days === 365 || plan.duration_days === 366) return "/ year";
  if (plan.duration_days === 7) return "/ week";
  return `/ ${plan.duration_days} days`;
}

/** Ceiling the API puts on a plan's advertised saving. */
export const MAX_PLAN_DISCOUNT_PERCENT = 90;

/**
 * "Save 17% vs Monthly" for a plan the provider labelled as a saving against
 * another of their plans, from the API's `comparison` only (set while both
 * the compared plan and a discount are set and the compared plan is still
 * active). Null otherwise. The plan's price is unchanged by it.
 */
export function planSavingLabel(
  plan: Pick<MarketplaceMembershipPlan, "comparison">,
): string | null {
  const c = plan.comparison;
  if (!c || !c.plan_name) return null;
  const pct = Math.min(MAX_PLAN_DISCOUNT_PERCENT, Math.max(0, Math.round(c.discount_percent)));
  return pct > 0 ? `Save ${pct}% vs ${c.plan_name}` : null;
}
