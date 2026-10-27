import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { MarketplaceMembershipPlan } from "@/lib/types";
import { MembershipPlanType } from "@/lib/types";
import { planSavingLabel } from "@/lib/marketplace/planDisplay";
import {
  PlanComparisonFields,
  clampPlanDiscount,
  comparablePlans,
  comparisonFromPlan,
  comparisonPayload,
  ownerSavingLabel,
  type PlanComparisonValue,
} from "@/components/plans/PlanComparisonFields";

/**
 * Provider plan comparison (owner ruling, Oct 20 2026, option A): a plan can
 * point at another of the provider's active plans in the same currency with
 * a saving %, and members see "Save N% vs <plan>". The price is untouched.
 */

vi.mock("@/components/SearchableSelect", () => ({
  default: ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) => (
    <select aria-label="Compared with" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

function plan(over: Partial<MarketplaceMembershipPlan>): MarketplaceMembershipPlan {
  return {
    _id: "p",
    organization_id: "o1",
    created_by: "u1",
    name: "Monthly",
    plan_type: MembershipPlanType.SUBSCRIPTION,
    duration_days: 30,
    price_minor: 2_000_000,
    currency: "NGN",
    features: [],
    is_active: true,
    is_public: true,
    created_at: "",
    updated_at: "",
    ...over,
  };
}

const monthly = plan({ _id: "m", name: "Monthly" });
const annual = plan({ _id: "a", name: "Annual", duration_days: 365, price_minor: 20_000_000 });
const retired = plan({ _id: "r", name: "Retired", is_active: false });
const dollars = plan({ _id: "d", name: "Dollar monthly", currency: "USD" });
const hidden = plan({ _id: "h", name: "Hidden", is_public: false });
const all = [monthly, annual, retired, dollars, hidden];

describe("plan comparison helpers", () => {
  it("offers only the provider's other active plans in the same currency", () => {
    expect(comparablePlans(all, "a", "ngn").map((p) => p._id)).toEqual(["m", "h"]);
  });

  it("clamps the saving to a whole 0–90", () => {
    expect(clampPlanDiscount("")).toBe(0);
    expect(clampPlanDiscount("17")).toBe(17);
    expect(clampPlanDiscount("95")).toBe(90);
    expect(clampPlanDiscount("-2")).toBe(0);
    expect(clampPlanDiscount(12.4)).toBe(12);
  });

  it("sends the plan and saving, and clears both when no plan is chosen", () => {
    expect(comparisonPayload({ compare_to_plan_id: "m", discount_percent: "17" })).toEqual({
      compare_to_plan_id: "m",
      discount_percent: 17,
    });
    expect(comparisonPayload({ compare_to_plan_id: null, discount_percent: "17" })).toEqual({
      compare_to_plan_id: null,
      discount_percent: 0,
    });
    expect(comparisonFromPlan(plan({ compare_to_plan_id: "m", discount_percent: 15 }))).toEqual({
      compare_to_plan_id: "m",
      discount_percent: "15",
    });
  });

  it("shows members the API's label only", () => {
    expect(planSavingLabel(plan({ comparison: { plan_id: "m", plan_name: "Monthly", discount_percent: 17 } }))).toBe(
      "Save 17% vs Monthly",
    );
    expect(planSavingLabel(plan({ comparison: null }))).toBeNull();
    // Fields set but the API sent no comparison (e.g. Monthly was retired): nothing.
    expect(planSavingLabel(plan({ compare_to_plan_id: "m", discount_percent: 17 }))).toBeNull();
  });

  it("tells the provider what members see, by the same rule", () => {
    const a = { ...annual, compare_to_plan_id: "m", discount_percent: 17 };
    expect(ownerSavingLabel(a, all)).toBe("Save 17% vs Monthly");
    expect(ownerSavingLabel({ ...a, compare_to_plan_id: "r" }, all)).toBeNull();
    expect(ownerSavingLabel({ ...a, compare_to_plan_id: "d" }, all)).toBeNull();
    expect(ownerSavingLabel({ ...a, compare_to_plan_id: "h" }, all)).toBeNull();
    expect(ownerSavingLabel({ ...a, discount_percent: 0 }, all)).toBeNull();
  });
});

function Harness({ initial }: { initial: PlanComparisonValue }) {
  const [value, setValue] = useState(initial);
  return <PlanComparisonFields plans={all} planId="a" currency="NGN" value={value} onChange={setValue} />;
}

describe("PlanComparisonFields", () => {
  it("previews the member's label in plain words", () => {
    render(<Harness initial={{ compare_to_plan_id: null, discount_percent: "" }} />);
    expect(screen.getByText("Members see no saving on this plan.")).toBeInTheDocument();
    expect(screen.getByLabelText("Saving percent")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Compared with"), { target: { value: "m" } });
    fireEvent.change(screen.getByLabelText("Saving percent"), { target: { value: "17" } });
    expect(screen.getByText(/Members will see "Save 17% vs Monthly"/)).toBeInTheDocument();
  });

  it("says when the compared plan no longer counts", () => {
    render(<Harness initial={{ compare_to_plan_id: "r", discount_percent: "10" }} />);
    expect(screen.getByText(/no longer active or is in another currency/)).toBeInTheDocument();
  });
});
