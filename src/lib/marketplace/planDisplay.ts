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
