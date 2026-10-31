import { describe, it, expect } from "vitest";
import { effectiveFlag } from "@/lib/featureFlags/helpers";
import {
  buildAccessInput,
  draftFromAccess,
  draftFingerprint,
  entitlementSourceLabel,
  paidContentCopy,
  paidContentOn,
  accessSummary,
  purchaseView,
  purchaseStatusLabel,
  renewHint,
  gatewayFailureCopy,
} from "@/lib/paidContent/helpers";
import {
  normalizeAccess,
  normalizeEntitlement,
  normalizeOfferRead,
  normalizePrices,
  paidContentErrorOf,
  pathToKind,
} from "@/lib/api/paidContent";

describe("paidContentOn", () => {
  const data = {
    flags: { paid_content: false },
    organizations: [
      { organization_id: "on", flags: { paid_content: true } },
      { organization_id: "off", flags: { paid_content: false } },
    ],
  };
  const isEnabled = (k: string, o?: string | null) => effectiveFlag(data, k, o);
  it("follows the current workspace's own value", () => {
    expect(paidContentOn(isEnabled, "on")).toBe(true);
    expect(paidContentOn(isEnabled, "off")).toBe(false);
  });
  it("falls back to the global value with no workspace", () => {
    expect(paidContentOn(isEnabled, null)).toBe(false);
    expect(paidContentOn(isEnabled)).toBe(false);
    expect(paidContentOn((k, o) => effectiveFlag({ flags: { paid_content: true }, organizations: [] }, k, o), null)).toBe(true);
  });
  it("does not turn on because some other workspace has it", () => {
    expect(paidContentOn(isEnabled, "unknown-org")).toBe(false);
  });
});

describe("entitlement labels", () => {
  it("names how the member has it", () => {
    expect(entitlementSourceLabel({ source: "purchase", planName: null })).toBe("Bought");
    expect(entitlementSourceLabel({ source: "grant", planName: null })).toBe("Given to you");
    expect(entitlementSourceLabel({ source: "plan", planName: "Monthly" })).toBe("Included in Monthly");
    expect(entitlementSourceLabel({ source: "carry_over", planName: null })).toBe("Kept until your plan ends");
  });
});

describe("purchases", () => {
  it("reads the API status only", () => {
    expect(purchaseView({ status: "paid" })).toBe("unlocked");
    expect(purchaseView({ status: "pending" })).toBe("settling");
    expect(purchaseView({ status: "refunded" })).toBe("refunded");
    expect(purchaseView({ status: "mismatch" })).toBe("unmatched");
    expect(purchaseView({ status: "expired" })).toBe("payable");
    expect(purchaseStatusLabel({ status: "pending" })).toBe("Waiting for payment");
  });
  it("only names a gateway failure it knows", () => {
    expect(gatewayFailureCopy("abandoned")).toMatch(/not been charged/);
    expect(gatewayFailureCopy("reversed")).toMatch(/reversed/);
    expect(gatewayFailureCopy("error")).toMatch(/problem/);
    expect(gatewayFailureCopy("success")).toBeNull();
    expect(gatewayFailureCopy(null)).toBeNull();
  });
});

describe("normalisers", () => {
  it("drops non-positive and malformed prices, uppercases currency", () => {
    expect(
      normalizePrices([
        { currency: "ngn", amount_minor: 1500000 },
        { currency: "USD", amount_minor: 0 },
        { currency: 5, amount_minor: 10 },
      ]),
    ).toEqual([{ currency: "NGN", amountMinor: 1500000 }]);
  });
  it("treats a missing access block as free", () => {
    expect(normalizeAccess(undefined)).toBeNull();
    expect(accessSummary(null)).toBe("Free");
    const a = normalizeAccess({ mode: "paid", prices: [{ currency: "NGN", amount_minor: 1500000 }], included_in_plan_ids: ["a", "b"] });
    expect(accessSummary(a)).toBe("₦15,000 · In 2 plans");
  });
  it("never reads an unknown offer state as open", () => {
    const r = normalizeOfferRead({ item_kind: "program", item_id: "p", access: { state: "weird" } });
    expect(r?.access.state).toBe("needs_payment");
    expect(r?.forSale).toBe(false);
  });
  it("reads an unknown entitlement state as ended", () => {
    const e = normalizeEntitlement({ id: "e", item: { id: "p", kind: "program", title: "T" }, state: "??", source: "purchase" });
    expect(e?.state).toBe("expired");
    expect(normalizeEntitlement({ id: "e", item: {} })).toBeNull();
  });
  it("maps URL segments to item kinds", () => {
    expect(pathToKind("programs")).toBe("program");
    expect(pathToKind("meal-plans")).toBe("meal_plan");
    expect(pathToKind("nope")).toBeNull();
  });
});

describe("errors", () => {
  it("recognises a paid-content refusal and carries its details", () => {
    const e = paidContentErrorOf({
      code: "CONTENT_PRICE_BELOW_MINIMUM",
      message: "",
      details: { currency: "NGN", minimum_minor: 5000 },
    });
    expect(e?.minimumMinor).toBe(5000);
    expect(paidContentCopy(e!)).toBe("The lowest price Paystack can charge in NGN is ₦50.");
  });
  it("lets the API's own sentence win", () => {
    const e = paidContentErrorOf({ code: "CONTENT_NOT_FOR_SALE", message: "Not today." });
    expect(paidContentCopy(e!)).toBe("Not today.");
  });
  it("ignores any other error", () => {
    expect(paidContentErrorOf({ code: "SOMETHING_ELSE" })).toBeNull();
    expect(paidContentErrorOf(undefined)).toBeNull();
  });
  it("lists the paid meal plans in the way", () => {
    const e = paidContentErrorOf({
      code: "PAID_MEAL_PLAN_IN_FREE_PROGRAM",
      details: { conflicts: [{ title: "Cut" }, "Bulk"] },
    });
    expect(e?.conflicts).toEqual(["Cut", "Bulk"]);
  });
  it("shows a renew hint from the offer", () => {
    expect(renewHint(null)).toBeNull();
    expect(
      renewHint({ itemKind: "program", itemId: "p", title: "", prices: [{ currency: "NGN", amountMinor: 100000 }], plans: [] }),
    ).toBe("Or buy it again for ₦1,000.");
  });
});

describe("pricing draft", () => {
  it("a free draft sends nothing else", () => {
    expect(buildAccessInput({ mode: "free", prices: [], planIds: ["x"], showOnListing: false })).toEqual({
      input: { mode: "free", prices: [], includedPlanIds: [], showOnListing: true },
    });
  });
  it("sends integer minor units, never a float", () => {
    const r = buildAccessInput({
      mode: "paid",
      prices: [{ currency: "NGN", display: "₦15,000.5", minor: 1500050 }],
      planIds: [],
      showOnListing: true,
    });
    expect(r).toEqual({
      input: { mode: "paid", prices: [{ currency: "NGN", amountMinor: 1500050 }], includedPlanIds: [], showOnListing: true },
    });
  });
  it("drops empty rows and refuses a paid item nobody can get", () => {
    const r = buildAccessInput({
      mode: "paid",
      prices: [{ currency: "NGN", display: "", minor: null }],
      planIds: [],
      showOnListing: true,
    });
    expect("error" in r && r.error).toMatch(/Add a price/);
  });
  it("refuses a row that is not an amount", () => {
    const r = buildAccessInput({
      mode: "paid",
      prices: [{ currency: "USD", display: "abc", minor: null }],
      planIds: [],
      showOnListing: true,
    });
    expect("error" in r && r.error).toMatch(/valid USD price/);
  });
  it("a paid item sold only through a plan is valid", () => {
    expect("input" in buildAccessInput({ mode: "paid", prices: [], planIds: ["p"], showOnListing: true })).toBe(true);
  });
  it("round-trips an access block and tracks changes", () => {
    const a = normalizeAccess({ mode: "paid", prices: [{ currency: "NGN", amount_minor: 1500000 }], included_in_plan_ids: ["p"], show_on_listing: false });
    const d = draftFromAccess(a);
    expect(d.prices[0]).toMatchObject({ currency: "NGN", minor: 1500000 });
    const same = draftFromAccess(a);
    expect(draftFingerprint(d)).toBe(draftFingerprint(same));
    expect(draftFingerprint({ ...d, showOnListing: true })).not.toBe(draftFingerprint(d));
  });
});
