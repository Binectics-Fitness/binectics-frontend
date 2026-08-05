import { describe, expect, it } from "vitest";

import { toPlanCards, toComparison } from "./providerPlanView";
import type { ProviderPlanOption, ProviderBillingFeatures } from "@/lib/api/providerBilling";
import { ProviderPlanTier } from "@/lib/api/providerBilling";

const NO_FEATURES: ProviderBillingFeatures = {
  analytics_enabled: false,
  consultations_enabled: false,
  journals_enabled: false,
  qr_checkin_enabled: false,
  white_label_enabled: false,
  custom_domain_enabled: false,
  branded_email_enabled: false,
  forms_enabled: false,
  classes_enabled: false,
  loyalty_enabled: false,
  api_access_enabled: false,
};

function plan(overrides: Partial<ProviderPlanOption>): ProviderPlanOption {
  return {
    code: ProviderPlanTier.FREE,
    name: "Free",
    description: "Get started",
    sort_order: 0,
    limits: {
      max_active_members: 10,
      max_membership_plans: 2,
      max_staff_members: 0,
      max_listings: 1,
    },
    features: { ...NO_FEATURES },
    prices: { month: null, year: null },
    ...overrides,
  };
}

const CATALOGUE: ProviderPlanOption[] = [
  plan({ code: ProviderPlanTier.PRO, name: "Pro", sort_order: 1, description: "Grow your business",
    limits: { max_active_members: 250, max_membership_plans: 20, max_staff_members: 5, max_listings: 3 },
    features: { ...NO_FEATURES, analytics_enabled: true, classes_enabled: true, qr_checkin_enabled: true },
    prices: { month: { amount_minor: 4800, currency: "USD" }, year: { amount_minor: 48000, currency: "USD" } } }),
  plan({ code: ProviderPlanTier.FREE, name: "Free", sort_order: 0 }),
  plan({ code: ProviderPlanTier.ENTERPRISE, name: "Enterprise", sort_order: 2, description: "Unlimited scale",
    limits: { max_active_members: null, max_membership_plans: null, max_staff_members: null, max_listings: null },
    features: { ...NO_FEATURES, white_label_enabled: true, api_access_enabled: true },
    prices: { month: null, year: null } }),
];

describe("toPlanCards", () => {
  it("orders cards by sort_order and uses backend names + descriptions", () => {
    const cards = toPlanCards(CATALOGUE, "month", "en-US");
    expect(cards.map((c) => c.name)).toEqual(["Free", "Pro", "Enterprise"]);
    expect(cards[1].tagline).toBe("Grow your business");
  });

  it("shows the free tier as free and a priced tier from the backend amount", () => {
    const cards = toPlanCards(CATALOGUE, "month", "en-US");
    expect(cards[0].price).toBe("Free");
    expect(cards[0].priceSub).toBe("forever");
    expect(cards[1].price).toContain("48");
    expect(cards[1].priceSub).toBe("/ month");
  });

  it("falls back to Custom when a paid tier has no configured price", () => {
    const cards = toPlanCards(CATALOGUE, "month", "en-US");
    const enterprise = cards.find((c) => c.name === "Enterprise")!;
    expect(enterprise.price).toBe("Custom");
    expect(enterprise.ink).toBe(true);
  });

  it("derives feature bullets from quotas and enabled flags only", () => {
    const cards = toPlanCards(CATALOGUE, "month", "en-US");
    const pro = cards.find((c) => c.name === "Pro")!;
    expect(pro.features).toContain("Up to 250 active members");
    expect(pro.features).toContain("5 staff seats");
    expect(pro.features).toContain("Revenue and check-in analytics");
    expect(pro.features).toContain("Class scheduling");
    // A disabled flag must never appear.
    expect(pro.features).not.toContain("White-label branding");
    expect(pro.featured).toBe(true);
    expect(pro.divider).toBe("Everything in Free, plus");
  });

  it("omits staff seats for a solo (zero-staff) plan and marks unlimited quotas", () => {
    const cards = toPlanCards(CATALOGUE, "month", "en-US");
    const free = cards[0];
    expect(free.features.some((f) => f.includes("staff seat"))).toBe(false);
    const enterprise = cards.find((c) => c.name === "Enterprise")!;
    expect(enterprise.features).toContain("Unlimited active members");
    expect(enterprise.features).toContain("Unlimited staff seats");
  });
});

describe("toComparison", () => {
  it("builds headers and capacity/feature rows straight from the catalogue", () => {
    const view = toComparison(CATALOGUE, "month", "en-US");
    expect(view.planHeaders.map((h) => h.name)).toEqual(["Free", "Pro", "Enterprise"]);
    expect(view.planHeaders[1].featured).toBe(true);

    const capacity = view.groups.find((g) => g.group === "Capacity")!;
    const members = capacity.rows.find((r) => r.feature === "Active members / clients")!;
    // Free = 10, Pro = 250, Enterprise = unlimited.
    expect(members.cells).toEqual(["10", "250", "Unlimited"]);

    const staff = capacity.rows.find((r) => r.feature === "Staff seats")!;
    // Zero staff renders as a dash (null), not "0".
    expect(staff.cells[0]).toBeNull();

    const features = view.groups.find((g) => g.group === "Features")!;
    const analytics = features.rows.find((r) => r.feature === "Revenue and check-in analytics")!;
    // Off for Free, on for Pro, off for Enterprise.
    expect(analytics.cells).toEqual([null, true, null]);
  });
});
