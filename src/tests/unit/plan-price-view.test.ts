import { describe, it, expect } from "vitest";
import { planPriceView } from "@/lib/pricing/publicPlans";
import { ProviderPlanTier } from "@/lib/api/providerBilling";

const plan = (over: Record<string, unknown>) =>
  ({
    code: ProviderPlanTier.PRO,
    is_self_serve: true,
    price_unavailable_reason: null,
    prices: { month: null, year: null },
    ...over,
  }) as unknown as Parameters<typeof planPriceView>[0];

describe("planPriceView, when a plan has no price", () => {
  it("never shows a paid tier with no price as free (the live dev catalogue)", () => {
    const view = planPriceView(plan({}), "month");
    expect(view.price).toBe("Price not set yet");
    expect(view.unavailableReason).toBe("No price is set for this plan yet.");
  });

  it("shows the API's reason when it gives one", () => {
    const view = planPriceView(plan({ price_unavailable_reason: "Plans can't be paid in USD right now." }), "month");
    expect(view).toMatchObject({ price: "Unavailable", unavailableReason: "Plans can't be paid in USD right now." });
  });

  it("still shows the free tier as free, and Enterprise as custom", () => {
    expect(planPriceView(plan({ code: ProviderPlanTier.FREE }), "month").price).toBe("Free");
    expect(planPriceView(plan({ code: ProviderPlanTier.ENTERPRISE, is_self_serve: false }), "month").price).toBe("Custom");
  });

  it("shows a real zero price as free for any tier", () => {
    const view = planPriceView(plan({ prices: { month: { amount_minor: 0, currency: "NGN", minor_unit: 2 }, year: null } }), "month");
    expect(view.price).toBe("Free");
  });
});
