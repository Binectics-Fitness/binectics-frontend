import { describe, it, expect } from "vitest";
import {
  parseBillingError,
  billingResourceLabel,
  BILLING_LIMIT_REACHED,
  BILLING_FEATURE_DISABLED,
} from "@/lib/utils/billingErrors";
import { formatMinorAmount } from "@/lib/api/providerBilling";
import type { ApiResponse } from "@/lib/types";

describe("parseBillingError", () => {
  it("returns null for successful responses", () => {
    const res: ApiResponse<unknown> = { success: true, data: {} };
    expect(parseBillingError(res)).toBeNull();
  });

  it("returns null for non-billing failure responses", () => {
    const res: ApiResponse<unknown> = {
      success: false,
      message: "Not found",
      status: 404,
    };
    expect(parseBillingError(res)).toBeNull();
  });

  it("parses BILLING_LIMIT_REACHED into structured payload", () => {
    const res: ApiResponse<unknown> = {
      success: false,
      message: "limit reached",
      code: BILLING_LIMIT_REACHED,
      details: {
        quota: "max_membership_plans",
        limit: 2,
        current_usage: 2,
        plan_tier: "free",
      },
      status: 403,
    };
    expect(parseBillingError(res)).toEqual({
      kind: "limit",
      message: "limit reached",
      resource: "max_membership_plans",
      planTier: "free",
      limit: 2,
      currentUsage: 2,
    });
  });

  it("parses BILLING_FEATURE_DISABLED into structured payload", () => {
    const res: ApiResponse<unknown> = {
      success: false,
      message: "feature off",
      code: BILLING_FEATURE_DISABLED,
      details: { feature: "analytics_enabled", plan_tier: "pro" },
      status: 403,
    };
    expect(parseBillingError(res)).toEqual({
      kind: "feature",
      message: "feature off",
      resource: "analytics_enabled",
      planTier: "pro",
      limit: null,
      currentUsage: null,
    });
  });

  it("returns null for an unknown billing-shaped error code", () => {
    const res: ApiResponse<unknown> = {
      success: false,
      code: "SOMETHING_ELSE",
      details: {},
      status: 403,
    };
    expect(parseBillingError(res)).toBeNull();
  });
});

describe("billingResourceLabel", () => {
  it("maps known quota and feature keys to friendly labels", () => {
    expect(billingResourceLabel("max_active_members")).toBe("active members");
    expect(billingResourceLabel("analytics_enabled")).toBe("analytics");
  });

  it("falls back to a humanised key when unknown", () => {
    expect(billingResourceLabel("some_new_thing")).toBe("some new thing");
    expect(billingResourceLabel(null)).toBe("this feature");
  });
});

describe("formatMinorAmount", () => {
  it("formats whole and fractional amounts in the given currency", () => {
    // Locale-dependent; assert key markers rather than exact strings.
    const ngn = formatMinorAmount(1500000, "NGN");
    expect(ngn).toMatch(/15,000|15000/);
    const usd = formatMinorAmount(1999, "USD");
    expect(usd).toMatch(/19\.99/);
  });

  it("falls back gracefully on invalid currency codes", () => {
    expect(formatMinorAmount(1000, "ZZZ")).toContain("ZZZ");
  });
});
