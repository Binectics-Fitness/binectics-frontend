import { describe, it, expect } from "vitest";
import { minorToMajor, majorToMinor } from "@/lib/money/minorMoney";
import { formatMinorForInput, parseMoneyMinor } from "@/lib/money/moneyInput";
import { formatCurrency } from "@/utils/format";
import { formatMinorAmount, seatHeadroomLabel } from "@/lib/api/providerBilling";
import {
  MembershipSubscriptionStatus,
  isEntitlingMembershipStatus,
  isSeatBearingMembershipStatus,
  TERMINAL_MEMBERSHIP_STATUSES,
  type MembershipSubscription,
} from "@/lib/types";
import {
  MEMBERSHIP_STATUS_META,
  MEMBERSHIP_STATUS_FILTER_ORDER,
  membershipStatusMeta,
  countMembersByPlan,
  subscriptionPlanId,
} from "@/lib/constants/membershipStatus";

/**
 * The API renamed AND RESCALED five money columns (binectics-api #105/#106):
 * `price` → `price_minor`, `amount_paid` → `amount_paid_minor`, and so on. The
 * failure mode of a rename that is really a unit change is silent and
 * exactly-100×: a plan stored as 500000 renders as "₦500,000" instead of
 * "₦5,000", and a form sends 5000 where 500000 was meant.
 *
 * These tests assert the real amounts rather than the shape of the conversion,
 * because "off by 100" is the whole bug and a test that asserts
 * `minorToMajor(x) === x / 100` cannot catch a caller that forgot to call it.
 */
describe("minor-unit money contract — the read side (display)", () => {
  it("renders a plan stored as 500000 as ₦5,000, not ₦500,000", () => {
    const priceMinor = 500_000; // what MembershipPlan.price_minor now holds
    expect(formatCurrency(minorToMajor(priceMinor), "NGN")).toBe("₦5,000");
  });

  it("renders the SAME plan under the old major-unit reading 100× too high", () => {
    // The bug this whole change exists to prevent, pinned so the difference is
    // visible in the test file rather than only in a reviewer's head.
    expect(formatCurrency(500_000, "NGN")).toBe("₦500,000");
  });

  it("renders a USD price with its cents intact", () => {
    // 4900 cents is $49.00, which formatCurrency renders whole as "$49".
    expect(formatCurrency(minorToMajor(4_900), "USD")).toBe("$49");
    // 4999 cents keeps the fraction.
    expect(formatCurrency(minorToMajor(4_999), "USD")).toBe("$49.99");
  });

  it("renders amount_paid_minor for a ₦12,500 monthly membership", () => {
    const sub = { amount_paid_minor: 1_250_000, currency: "NGN" };
    expect(formatCurrency(minorToMajor(sub.amount_paid_minor), sub.currency)).toBe(
      "₦12,500",
    );
  });

  it("renders price_from_minor on a listing card", () => {
    expect(formatCurrency(minorToMajor(45_000), "ZAR")).toBe("R 450");
  });

  it("multiplies a recurring booking in minor units and converts once", () => {
    // 4 sessions at ₦8,000 each. Multiplying integers keeps this exact; scaling
    // to major first and multiplying second reintroduces the IEEE-754 drift
    // that majorToMinor exists to avoid.
    const unitMinor = 800_000;
    const totalMinor = unitMinor * 4;
    expect(totalMinor).toBe(3_200_000);
    expect(formatCurrency(minorToMajor(totalMinor), "NGN")).toBe("₦32,000");
  });

  it("sums amount_paid_minor across subscriptions without float drift", () => {
    // Three USD memberships of $12.34 each: 1234 * 3 = 3702 cents = $37.02.
    // Summing 12.34 three times in floats gives 37.019999999999996.
    const total = [1_234, 1_234, 1_234].reduce((a, b) => a + b, 0);
    expect(total).toBe(3_702);
    expect(minorToMajor(total)).toBe(37.02);
  });

  it("formatMinorAmount takes minor units end to end", () => {
    expect(formatMinorAmount(500_000, "NGN")).toBe("₦5,000");
    expect(formatMinorAmount(4_999, "USD")).toBe("$49.99");
  });
});

describe("minor-unit money contract — renames that were ALREADY minor", () => {
  /**
   * `ProviderInvoice.amount_due`/`amount_paid` and the admin revenue figures
   * were minor units before the rename; the `*Minor` suffix only says so out
   * loud. Their VALUES did not change, so the display conversion is the same
   * one that was always needed — the risk here is the mirror image of the
   * rescaled fields: dividing twice, and reporting a hundredth of reality.
   */
  it("renders an invoice of 2500000 minor as ₦25,000 — converted once", () => {
    expect(formatMinorAmount(2_500_000, "NGN")).toBe("₦25,000");
  });

  it("would report a hundredth of reality if converted twice", () => {
    expect(formatMinorAmount(minorToMajor(2_500_000), "NGN")).toBe("₦250");
  });

  it("renders platform revenue of 987654321 cents as $9,876,543.21", () => {
    expect(formatCurrency(minorToMajor(987_654_321), "USD")).toBe("$9,876,543.21");
  });
});

describe("minor-unit money contract — the write side (submission)", () => {
  it("sends 500000 for a ₦5,000 plan price", () => {
    // What <MoneyInput> hands its caller for the string it displays.
    expect(parseMoneyMinor("₦5,000", { currency: "NGN" })).toBe(500_000);
  });

  it("sends 500000 for a pasted, already-formatted ₦5,000", () => {
    expect(parseMoneyMinor("5,000", { currency: "NGN" })).toBe(500_000);
    expect(parseMoneyMinor("NGN 5 000", { currency: "NGN" })).toBe(500_000);
  });

  it("sends 4999 for $49.99, not 49.99 and not 499900", () => {
    expect(parseMoneyMinor("$49.99", { currency: "USD" })).toBe(4_999);
  });

  it("never sends a float — 12.34 becomes exactly 1234", () => {
    // 12.34 * 100 is 1233.9999999999998 in IEEE 754. A float must never reach
    // the wire as money: the API's @IsInt would reject it, and a rounded-down
    // 1233 would be a silent one-kobo theft on every save.
    const minor = parseMoneyMinor("12.34", { currency: "USD" });
    expect(minor).toBe(1_234);
    expect(Number.isInteger(minor)).toBe(true);
  });

  it("distinguishes an empty field (null, not set) from a zero price", () => {
    // Null must never be coalesced to 0: 0 comps a member, "not set" falls back
    // to the plan's own price.
    expect(parseMoneyMinor("", { currency: "NGN" })).toBeNull();
    expect(parseMoneyMinor("₦0", { currency: "NGN" })).toBe(0);
  });

  it("round-trips a saved price back out unchanged for a decimal currency", () => {
    const saved = 4_999;
    const display = formatMinorForInput(saved, { currency: "USD" });
    expect(display).toBe("$49.99");
    expect(parseMoneyMinor(display, { currency: "USD" })).toBe(saved);
  });

  it("documents why an UNTOUCHED whole-unit prefill must be sent verbatim", () => {
    // NGN renders as a whole number, so 199 kobo displays as "₦2" — the display
    // string is lossy. Every form here therefore keeps the minor value it was
    // given and only re-parses when the user actually edits the field. Pinning
    // the lossiness is what keeps that rule from being "optimised" away.
    const saved = 199;
    const display = formatMinorForInput(saved, { currency: "NGN" });
    expect(display).toBe("₦2");
    expect(parseMoneyMinor(display, { currency: "NGN" })).toBe(200);
  });

  it("round-trips every real amount through major and back exactly", () => {
    // majorToMinor(minorToMajor(x)) === x is the invariant that lets a form
    // prefill from a stored value and send it back untouched.
    for (const minor of [500_000, 1_250_000, 4_999, 4_900, 45_000, 199, 1]) {
      expect(majorToMinor(minorToMajor(minor))).toBe(minor);
    }
  });
});

describe("seat headroom copy", () => {
  const n = (x: number) => x.toLocaleString("en-US");

  it("reads '428 of 500' territory — 72 seats left", () => {
    expect(seatHeadroomLabel({ remaining: 72 }, n)).toBe("72 seats left");
  });

  it("singularises the last seat", () => {
    expect(seatHeadroomLabel({ remaining: 1 }, n)).toBe("1 seat left");
  });

  it("says 'unlimited' when the grant is uncapped, not '0 left'", () => {
    expect(seatHeadroomLabel({ remaining: null }, n)).toBe("Unlimited seats");
  });

  it("does NOT clamp a negative remaining — being over is a real state", () => {
    // A gym 12 seats over its cap is about to be billed for the overage;
    // clamping to "0 left" would hide it.
    expect(seatHeadroomLabel({ remaining: -12 }, n)).toBe("12 over your limit");
  });

  it("never says '0 seats left' at exactly the cap", () => {
    // over_limit is `used > limit` but enforcement refuses at `used >= limit`,
    // so a gym AT its cap reads over_limit:false and is still refused. Copy
    // must not imply another seat is available.
    const label = seatHeadroomLabel({ remaining: 0 }, n);
    expect(label).toBe("At your limit — free a seat before adding a member");
    expect(label).not.toContain("0 seats left");
  });

  it("groups a large remaining count through the injected formatter", () => {
    expect(seatHeadroomLabel({ remaining: 4_500 }, n)).toBe("4,500 seats left");
  });
});

describe("membership lifecycle — the three new states", () => {
  const ALL = Object.values(MembershipSubscriptionStatus);

  it("knows all seven states, including paused/suspended/past_due", () => {
    expect(ALL).toContain("paused");
    expect(ALL).toContain("suspended");
    expect(ALL).toContain("past_due");
    expect(ALL).toHaveLength(7);
  });

  it("has a label, colours and a hint for every state", () => {
    for (const status of ALL) {
      const meta = MEMBERSHIP_STATUS_META[status];
      expect(meta, `no meta for ${status}`).toBeDefined();
      expect(meta.label).toBeTruthy();
      expect(meta.color).toBeTruthy();
      expect(meta.background).toBeTruthy();
      expect(meta.hint).toBeTruthy();
    }
  });

  it("offers a filter for every state, so none is unreachable", () => {
    expect([...MEMBERSHIP_STATUS_FILTER_ORDER].sort()).toEqual([...ALL].sort());
  });

  it("keeps a past_due member's access — they are in a grace window", () => {
    expect(isEntitlingMembershipStatus(MembershipSubscriptionStatus.PAST_DUE)).toBe(true);
    expect(MEMBERSHIP_STATUS_META[MembershipSubscriptionStatus.PAST_DUE].hasAccess).toBe(true);
  });

  it("denies access to a paused or suspended member — a hold is a hold", () => {
    expect(isEntitlingMembershipStatus(MembershipSubscriptionStatus.PAUSED)).toBe(false);
    expect(isEntitlingMembershipStatus(MembershipSubscriptionStatus.SUSPENDED)).toBe(false);
  });

  it("bills a seat for every non-terminal state, holds included", () => {
    for (const status of ALL) {
      const terminal = TERMINAL_MEMBERSHIP_STATUSES.includes(status);
      expect(isSeatBearingMembershipStatus(status), status).toBe(!terminal);
    }
  });

  it("separates the door from the seat — they are not the same question", () => {
    // paused: pays a seat, no access. Collapsing the two is what makes a
    // dashboard claim a paying customer has churned.
    expect(isSeatBearingMembershipStatus(MembershipSubscriptionStatus.PAUSED)).toBe(true);
    expect(isEntitlingMembershipStatus(MembershipSubscriptionStatus.PAUSED)).toBe(false);
  });

  it("labels an unknown future status as itself rather than crashing", () => {
    const meta = membershipStatusMeta("dormant");
    expect(meta.label).toBe("dormant");
    expect(meta.hasAccess).toBe(false);
  });
});

describe("per-plan member counts — the active_members replacement", () => {
  const sub = (
    planId: string,
    status: MembershipSubscriptionStatus,
  ): MembershipSubscription =>
    ({ _id: `s-${planId}-${status}`, plan_id: planId, status }) as MembershipSubscription;

  it("counts seat-bearing subscriptions, not just active ones", () => {
    const counts = countMembersByPlan([
      sub("p1", MembershipSubscriptionStatus.ACTIVE),
      sub("p1", MembershipSubscriptionStatus.PAUSED),
      sub("p1", MembershipSubscriptionStatus.PAST_DUE),
      sub("p1", MembershipSubscriptionStatus.SUSPENDED),
      sub("p1", MembershipSubscriptionStatus.PENDING_PAYMENT),
    ]);
    expect(counts.get("p1")).toBe(5);
  });

  it("excludes expired and cancelled — those members really are gone", () => {
    const counts = countMembersByPlan([
      sub("p1", MembershipSubscriptionStatus.ACTIVE),
      sub("p1", MembershipSubscriptionStatus.EXPIRED),
      sub("p1", MembershipSubscriptionStatus.CANCELLED),
    ]);
    expect(counts.get("p1")).toBe(1);
  });

  it("splits counts across plans and reports zero for an untouched plan", () => {
    const counts = countMembersByPlan([
      sub("p1", MembershipSubscriptionStatus.ACTIVE),
      sub("p2", MembershipSubscriptionStatus.ACTIVE),
      sub("p2", MembershipSubscriptionStatus.ACTIVE),
    ]);
    expect(counts.get("p1")).toBe(1);
    expect(counts.get("p2")).toBe(2);
    expect(counts.get("p3") ?? 0).toBe(0);
  });

  it("reads the plan id whether the API populated it or not", () => {
    expect(subscriptionPlanId({ plan_id: "p1" } as MembershipSubscription)).toBe("p1");
    expect(
      subscriptionPlanId({ plan_id: { _id: "p2", name: "Studio" } } as MembershipSubscription),
    ).toBe("p2");
  });

  it("counts a populated plan_id the same as a bare id", () => {
    const counts = countMembersByPlan([
      { _id: "a", plan_id: "p1", status: MembershipSubscriptionStatus.ACTIVE },
      {
        _id: "b",
        plan_id: { _id: "p1", name: "Studio" },
        status: MembershipSubscriptionStatus.ACTIVE,
      },
    ] as unknown as MembershipSubscription[]);
    expect(counts.get("p1")).toBe(2);
  });
});
