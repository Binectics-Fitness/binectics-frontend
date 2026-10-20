import { describe, it, expect } from "vitest";
import {
  annualDiscountOf,
  annualFromMonthlyMinor,
  annualToggleLabel,
  clampAnnualDiscount,
} from "@/lib/billing/annualDiscount";

/**
 * "Save N%" on annual plans is the admin's setting from the API, clamped to
 * 0–90; nothing on the client invents or works out a saving.
 */
describe("annual discount helpers", () => {
  it("clamps to a whole percent in 0–90", () => {
    expect(clampAnnualDiscount(undefined)).toBe(0);
    expect(clampAnnualDiscount("")).toBe(0);
    expect(clampAnnualDiscount("abc")).toBe(0);
    expect(clampAnnualDiscount(-3)).toBe(0);
    expect(clampAnnualDiscount("20")).toBe(20);
    expect(clampAnnualDiscount(19.6)).toBe(20);
    expect(clampAnnualDiscount(120)).toBe(90);
  });

  it("reads the yearly price's discount, null when there is none", () => {
    expect(annualDiscountOf(null)).toBeNull();
    expect(annualDiscountOf({})).toBeNull();
    expect(annualDiscountOf({ discount_percent: 0 })).toBeNull();
    expect(annualDiscountOf({ discount_percent: 15 })).toBe(15);
  });

  it("derives the yearly amount in minor units without float drift", () => {
    // ₦15,000/month less 20%: 12 × 1,500,000 kobo × 0.8 = 14,400,000 kobo.
    expect(annualFromMonthlyMinor(1_500_000, 20)).toBe(14_400_000);
    // $19.99/month less 15%: 1999 × 12 × 85 / 100 = 20389.8 → 20390 cents.
    expect(annualFromMonthlyMinor(1999, 15)).toBe(20390);
    expect(annualFromMonthlyMinor(1999, 0)).toBe(23988);
    expect(Number.isInteger(annualFromMonthlyMinor(333, 7))).toBe(true);
    // The clamp applies here too: 95% is treated as 90%.
    expect(annualFromMonthlyMinor(1000, 95)).toBe(1200);
  });

  it("labels the toggle from the admin's figures", () => {
    const withYear = (discount_percent?: number, is_self_serve = true) => ({
      is_self_serve,
      prices: { year: { amount_minor: 1000, discount_percent } },
    });
    const noYear = { is_self_serve: true, prices: { year: null } };
    expect(annualToggleLabel([])).toBe("Annual");
    expect(annualToggleLabel([withYear(), noYear])).toBe("Annual");
    expect(annualToggleLabel([withYear(20), withYear(20), noYear])).toBe("Annual (save 20%)");
    expect(annualToggleLabel([withYear(10), withYear(25)])).toBe("Annual (save up to 25%)");
  });

  it("counts a yearly tier with no discount as 0, so mixed tiers say 'up to'", () => {
    const pro = { is_self_serve: true, prices: { year: { amount_minor: 14_400_000, discount_percent: 20 } } };
    const plus = { is_self_serve: true, prices: { year: { amount_minor: 30_000_000 } } };
    const enterprise = { is_self_serve: false, prices: { year: { amount_minor: 99_000_000, discount_percent: 40 } } };
    const freeYear = { is_self_serve: true, prices: { year: { amount_minor: 0, discount_percent: 0 } } };
    // Pro saves 20%, Plus saves nothing: not every plan saves 20%.
    expect(annualToggleLabel([pro, plus])).toBe("Annual (save up to 20%)");
    // Enterprise is "talk to us": its figure is left out entirely.
    expect(annualToggleLabel([pro, enterprise])).toBe("Annual (save 20%)");
    // A free yearly price is nothing to save on.
    expect(annualToggleLabel([pro, freeYear])).toBe("Annual (save 20%)");
    expect(annualToggleLabel([plus, enterprise])).toBe("Annual");
  });
});
