import { describe, it, expect } from "vitest";
import {
  addPlanLabel,
  chosenPlan,
  heldPlanIds,
  isPurchasable,
  membershipHere,
  membershipLine,
  profileCta,
} from "@/lib/marketplace/listingMembership";
import { MembershipSubscriptionStatus as S, type MembershipSubscription } from "@/lib/types";

// Ported rules from binectics-mobile src/utils/planChoice.ts (mobile #304).

const sub = (over: Partial<MembershipSubscription> & Record<string, unknown>): MembershipSubscription =>
  ({
    _id: "s1",
    organization_id: { _id: "org-gym", name: "Imole Forge Fitness" },
    plan_id: { _id: "p-monthly", name: "All-Access Monthly", plan_type: "subscription" },
    listing_id: { _id: "l-gym", headline: "Gym" },
    member_user_id: "u1",
    status: S.ACTIVE,
    start_date: "2026-11-01",
    end_date: "2026-12-23T00:00:00.000Z",
    amount_paid_minor: 3_500_000,
    currency: "NGN",
    auto_renew: true,
    ...over,
  }) as MembershipSubscription;

const dayPass = { _id: "p-day", name: "Day Pass" };
const monthly = { _id: "p-monthly", name: "All-Access Monthly" };

describe("membershipHere: who is a member of this provider", () => {
  it("matches by the listing it was bought through", () => {
    expect(membershipHere([sub({})], { listingId: "l-gym" })?._id).toBe("s1");
  });

  it("matches by the listing that renews it (a gym enrolment has none of its own)", () => {
    const enrolled = sub({ listing_id: undefined, renewal_listing_id: "l-gym", organization_id: "other" });
    expect(membershipHere([enrolled], { listingId: "l-gym" })).toBe(enrolled);
  });

  it("matches by the gym's organization, populated or as a bare id", () => {
    expect(membershipHere([sub({ listing_id: "l-elsewhere" })], { listingId: "l-gym", organizationId: "org-gym" })).toBeDefined();
    expect(membershipHere([sub({ listing_id: undefined, organization_id: "org-gym" })], { organizationId: "org-gym" })).toBeDefined();
  });

  it("counts running, past due, paused and suspended; not pending payment or ended", () => {
    for (const status of [S.ACTIVE, S.PAST_DUE, S.PAUSED, S.SUSPENDED]) {
      expect(membershipHere([sub({ status })], { listingId: "l-gym" })).toBeDefined();
    }
    for (const status of [S.PENDING_PAYMENT, S.EXPIRED, S.CANCELLED]) {
      expect(membershipHere([sub({ status })], { listingId: "l-gym" })).toBeUndefined();
    }
  });

  it("prefers the membership that opens the door over a paused one", () => {
    const paused = sub({ _id: "paused", status: S.PAUSED });
    const active = sub({ _id: "active", status: S.PAST_DUE });
    expect(membershipHere([paused, active], { listingId: "l-gym" })?._id).toBe("active");
  });

  it("is nobody's membership elsewhere, and nothing when signed out", () => {
    expect(membershipHere([sub({})], { listingId: "l-other", organizationId: "org-other" })).toBeUndefined();
    expect(membershipHere(undefined, { listingId: "l-gym" })).toBeUndefined();
  });
});

describe("the plan choice", () => {
  it("knows which plans the member holds", () => {
    const held = heldPlanIds([sub({}), sub({ _id: "s2", plan_id: "p-day", status: S.PENDING_PAYMENT })]);
    expect([...held]).toEqual(["p-monthly"]);
    expect(isPurchasable(monthly, held)).toBe(false);
    expect(isPurchasable(dayPass, held)).toBe(true);
    expect(isPurchasable({ _id: "p-x", name: "Negotiated", is_self_serve: false }, new Set())).toBe(false);
  });

  it("gives a newcomer with several plans nothing picked, and one plan ready", () => {
    expect(chosenPlan([dayPass, monthly], null, new Set())).toBeUndefined();
    expect(chosenPlan([dayPass], null, new Set())).toBe(dayPass);
    expect(chosenPlan([dayPass, monthly], "p-monthly", new Set())).toBe(monthly);
  });

  it("never picks a second plan for a member", () => {
    const held = new Set(["p-monthly"]);
    expect(chosenPlan([dayPass, monthly], null, held)).toBeUndefined();
    expect(chosenPlan([dayPass, monthly], "p-monthly", held)).toBeUndefined();
    expect(chosenPlan([dayPass, monthly], "p-day", held)).toBe(dayPass);
  });
});

describe("profileCta: what the buy area offers", () => {
  const m = sub({});
  it("a member: their membership first, an Add only for a plan they picked", () => {
    expect(profileCta({ membership: m, selectedPlan: undefined, hasPurchasable: true })).toEqual({ kind: "member", membership: m, add: undefined });
    expect(profileCta({ membership: m, selectedPlan: dayPass, hasPurchasable: true })).toEqual({ kind: "member", membership: m, add: dayPass });
  });
  it("a newcomer: choose, then checkout; nothing when nothing is buyable", () => {
    expect(profileCta({ membership: undefined, selectedPlan: undefined, hasPurchasable: true })).toEqual({ kind: "choose" });
    expect(profileCta({ membership: undefined, selectedPlan: dayPass, hasPurchasable: true })).toEqual({ kind: "checkout", plan: dayPass });
    expect(profileCta({ membership: undefined, selectedPlan: undefined, hasPurchasable: false })).toEqual({ kind: "none" });
  });
});

describe("membershipLine", () => {
  const fmt = () => "23 Dec 2026";
  it("says when it renews or ends", () => {
    expect(membershipLine(sub({}), fmt)).toBe("All-Access Monthly · Active · renews 23 Dec 2026");
    expect(membershipLine(sub({ auto_renew: false }), fmt)).toBe("All-Access Monthly · Active · until 23 Dec 2026");
    expect(membershipLine(sub({ cancel_requested_at: "2026-11-20" }), fmt)).toBe("All-Access Monthly · Active · until 23 Dec 2026");
    expect(membershipLine(sub({ plan_id: { _id: "p-day", name: "Day Pass", plan_type: "one_time" } as never }), fmt)).toBe("Day Pass · Active · until 23 Dec 2026");
  });
  it("names a held state plainly", () => {
    expect(membershipLine(sub({ status: S.PAUSED }), fmt)).toBe("All-Access Monthly · Paused");
    expect(membershipLine(sub({ status: S.PAST_DUE }), fmt)).toBe("All-Access Monthly · Payment due");
    expect(membershipLine(sub({ plan_id: "p-monthly" }), fmt)).toBe("Membership · Active · renews 23 Dec 2026");
  });
  it("labels an added plan", () => {
    expect(addPlanLabel(dayPass, "₦5,000")).toBe("Add · Day Pass · ₦5,000");
  });
});
