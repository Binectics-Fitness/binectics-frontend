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
    const withYear = (discount_percent?: number) => ({
      prices: { year: { discount_percent } },
    });
    expect(annualToggleLabel([])).toBe("Annual");
    expect(annualToggleLabel([withYear(), { prices: { year: null } }])).toBe("Annual");
    expect(annualToggleLabel([withYear(20), withYear(20), withYear()])).toBe("Annual (save 20%)");
    expect(annualToggleLabel([withYear(10), withYear(25)])).toBe("Annual (save up to 25%)");
  });
});
