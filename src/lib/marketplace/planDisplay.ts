/**
 * Display helpers for a membership plan: its cadence next to the price.
 * Prices themselves go through formatMinor in the plan's own currency.
 */

import type { MarketplaceMembershipPlan } from "@/lib/types";
import { MembershipPlanType } from "@/lib/types";

/**
 * The cadence a plan's length reads as: 7 days a week, 30 a month, 90 a
 * quarter, 180 six months, 365 a year (a day either side of the calendar
 * lengths too). Null for any other length.
 */
export function planCadenceNoun(durationDays: number): string | null {
  if (durationDays === 7) return "week";
  if (durationDays >= 28 && durationDays <= 31) return "month";
  if (durationDays >= 89 && durationDays <= 92) return "quarter";
  if (durationDays >= 180 && durationDays <= 184) return "6 months";
  if (durationDays === 365 || durationDays === 366) return "year";
  return null;
}

/** "/ month", "/ quarter", "/ year" and so on, "/ N days" otherwise, or "once" for one-time. */
export function planPerLabel(
  plan: Pick<MarketplaceMembershipPlan, "plan_type" | "duration_days">,
): string {
  if (plan.plan_type === MembershipPlanType.ONE_TIME) return "once";
  const noun = planCadenceNoun(plan.duration_days);
  return noun ? `/ ${noun}` : `/ ${plan.duration_days} days`;
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
