"use client";

import SearchableSelect from "@/components/SearchableSelect";
import { Eyebrow } from "@/components/ds";
import type { MarketplaceMembershipPlan } from "@/lib/types";
import { MAX_PLAN_DISCOUNT_PERCENT } from "@/lib/marketplace/planDisplay";

/**
 * "Show a saving" on a provider's plan editor (owner ruling, Oct 20 2026,
 * option A): pick another of your active plans in the same currency and the
 * percent this plan saves against it. Members then see "Save N% vs <plan>".
 * A label only: the plan's price is exactly what the provider typed.
 */

export interface PlanComparisonValue {
  compare_to_plan_id: string | null;
  /** Whole percent 0–90; "" while the field is empty. */
  discount_percent: string;
}

/** The plans this one can be compared with: other active plans in its currency. */
export function comparablePlans(
  plans: readonly MarketplaceMembershipPlan[],
  planId: string | undefined,
  currency: string,
): MarketplaceMembershipPlan[] {
  const cur = currency.toUpperCase();
  return plans.filter((p) => p._id !== planId && p.is_active && p.currency.toUpperCase() === cur);
}

/** A typed discount as the API takes it: a whole number in 0–90. */
export function clampPlanDiscount(raw: string | number | null | undefined): number {
  const n = typeof raw === "string" ? (raw.trim() === "" ? 0 : Number(raw)) : raw ?? 0;
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_PLAN_DISCOUNT_PERCENT, Math.max(0, Math.round(n)));
}

/** The request fields for a comparison value; no plan chosen clears both. */
export function comparisonPayload(v: PlanComparisonValue): {
  compare_to_plan_id: string | null;
  discount_percent: number;
} {
  return v.compare_to_plan_id
    ? { compare_to_plan_id: v.compare_to_plan_id, discount_percent: clampPlanDiscount(v.discount_percent) }
    : { compare_to_plan_id: null, discount_percent: 0 };
}

/** The editor's starting value from a saved plan. */
export function comparisonFromPlan(plan?: Pick<MarketplaceMembershipPlan, "compare_to_plan_id" | "discount_percent">): PlanComparisonValue {
  return {
    compare_to_plan_id: plan?.compare_to_plan_id ?? null,
    discount_percent: plan?.discount_percent ? String(plan.discount_percent) : "",
  };
}

export function PlanComparisonFields({
  plans,
  planId,
  currency,
  value,
  onChange,
}: {
  /** All of the provider's plans (the list the editor already has). */
  plans: readonly MarketplaceMembershipPlan[];
  /** The plan being edited; undefined while creating. */
  planId?: string;
  currency: string;
  value: PlanComparisonValue;
  onChange: (next: PlanComparisonValue) => void;
}) {
  const options = comparablePlans(plans, planId, currency);
  const chosen = options.find((p) => p._id === value.compare_to_plan_id) ?? null;
  // A saved comparison whose plan was since deactivated or repriced in
  // another currency: members see no saving until it is changed.
  const stale = !!value.compare_to_plan_id && !chosen;
  const pct = clampPlanDiscount(value.discount_percent);

  const preview = chosen
    ? !chosen.is_public
      ? `${chosen.name} is hidden from your listing, so members see no saving until it is visible.`
      : pct > 0
      ? `Members will see "Save ${pct}% vs ${chosen.name}". The price stays what you set above.`
      : `Enter the percent this plan saves against ${chosen.name}. With 0, members see no saving.`
    : "Members see no saving on this plan.";

  return (
    <div className="flex flex-col gap-1.5">
      <Eyebrow as="span">Show a saving (optional)</Eyebrow>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>Compared with</span>
          <SearchableSelect
            value={value.compare_to_plan_id ?? ""}
            onChange={(v) => onChange({ ...value, compare_to_plan_id: v || null })}
            options={[
              { label: "No comparison", value: "" },
              ...options.map((p) => ({ label: p.name, value: p._id })),
            ]}
            placeholder={options.length ? "Choose a plan" : "No other active plan in this currency"}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>Saving %</span>
          <input
            type="number"
            min={0}
            max={MAX_PLAN_DISCOUNT_PERCENT}
            step={1}
            inputMode="numeric"
            aria-label="Saving percent"
            disabled={!value.compare_to_plan_id}
            value={value.discount_percent}
            placeholder="e.g. 15"
            onChange={(e) => onChange({ ...value, discount_percent: e.target.value })}
            className="h-9 rounded-(--r-2) px-3 text-[13.5px] disabled:opacity-50"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
          />
        </label>
      </div>
      <p className="text-[12px]" style={{ color: stale ? "var(--danger)" : "var(--fg-3)" }}>
        {stale
          ? "The plan this was compared with is no longer active or is in another currency, so members see no saving. Choose another plan or No comparison."
          : preview}
      </p>
    </div>
  );
}

/**
 * What members see on a plan, worked out on the provider's own plan list
 * with the API's rule (compared plan still active, public and in the same
 * currency, discount above 0), for the provider's plan rows. Null when
 * nothing shows.
 */
export function ownerSavingLabel(
  plan: Pick<MarketplaceMembershipPlan, "_id" | "currency" | "compare_to_plan_id" | "discount_percent">,
  plans: readonly MarketplaceMembershipPlan[],
): string | null {
  const pct = clampPlanDiscount(plan.discount_percent ?? 0);
  if (!plan.compare_to_plan_id || pct <= 0) return null;
  const other = comparablePlans(plans, plan._id, plan.currency).find((p) => p._id === plan.compare_to_plan_id);
  // The listing only names a plan members can see.
  return other && other.is_public ? `Save ${pct}% vs ${other.name}` : null;
}
