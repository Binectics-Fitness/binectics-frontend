import { describe, it, expect } from "vitest";
import {
  autoRenewOutcome,
  autoRenewUnavailableCopy,
  billingNotificationTarget,
  cardExpiry,
  cardLabel,
  cardStatusCopy,
  consentFromError,
  groupCardsByProvider,
  reasonFromError,
  renewHrefForMembership,
  renewHrefForNotification,
  renewHrefFromMetadata,
} from "@/lib/billing/autoRenew";
import { resolveNotificationTarget } from "@/utils/resolveNotificationLink";
import { canRecordRenewalFor } from "@/app/dashboard/gym-owner/members/MembersClient";
import {
  MembershipPlanType,
  MembershipSubscriptionStatus,
  UserRole,
  type MembershipSubscription,
} from "@/lib/types";
import type { PaymentMethodView } from "@/lib/api/memberBilling";

const NOW = new Date("2026-10-09T12:00:00Z");
const DAY = 86_400_000;

function sub(over: Partial<MembershipSubscription> = {}): MembershipSubscription {
  return {
    _id: "s1",
    organization_id: { _id: "o1", name: "Iron Temple" },
    plan_id: {
      _id: "p1",
      name: "Monthly",
      plan_type: MembershipPlanType.SUBSCRIPTION,
      duration_days: 30,
      price_minor: 2_500_000,
      currency: "NGN",
      features: [],
    },
    listing_id: { _id: "l1", headline: "Iron Temple" },
    member_user_id: "u1",
    status: MembershipSubscriptionStatus.ACTIVE,
    start_date: "2026-09-20T00:00:00Z",
    end_date: new Date(NOW.getTime() + 5 * DAY).toISOString(),
    amount_paid_minor: 2_500_000,
    currency: "NGN",
    auto_renew: false,
    created_at: "",
    updated_at: "",
    ...over,
  };
}

function card(over: Partial<PaymentMethodView> = {}): PaymentMethodView {
  return {
    id: "pm1",
    organization_id: "o1",
    provider_name: "Iron Temple",
    brand: "visa",
    card_type: "visa",
    last4: "4081",
    exp_month: 9,
    exp_year: 2027,
    bank: "Test Bank",
    status: "active",
    invalid_reason: null,
    created_at: null,
    subscriptions: [],
    ...over,
  };
}

describe("Renew links from notification metadata", () => {
  it("turns the API's checkout route into the web checkout page", () => {
    expect(
      renewHrefFromMetadata({ checkoutPath: "/marketplace/listings/l1/plans/p1/checkout" }),
    ).toBe("/checkout?listing=l1&plan=p1");
  });

  it("falls back to listingId and planId", () => {
    expect(renewHrefFromMetadata({ listingId: "l1", planId: "p1" })).toBe("/checkout?listing=l1&plan=p1");
  });

  it("refuses anything that isn't a plain id (no open redirect through metadata)", () => {
    expect(renewHrefFromMetadata({ checkoutPath: "https://evil.example/x" })).toBeNull();
    expect(renewHrefFromMetadata({ listingId: "../x", planId: "p1" })).toBeNull();
    expect(renewHrefFromMetadata({})).toBeNull();
    expect(renewHrefFromMetadata(null)).toBeNull();
  });

  it("shows Renew on a renewal-due notice and a failed payment, not on other notices", () => {
    const meta = { reason: "renewal_payment_due", checkoutPath: "/marketplace/listings/l1/plans/p1/checkout" };
    expect(renewHrefForNotification({ type: "SUBSCRIPTION_EXPIRED", metadata: meta })).toBe(
      "/checkout?listing=l1&plan=p1",
    );
    expect(
      renewHrefForNotification({
        type: "SUBSCRIPTION_PAYMENT_FAILED",
        metadata: { checkoutPath: "/marketplace/listings/l2/plans/p2/checkout" },
      }),
    ).toBe("/checkout?listing=l2&plan=p2");
    expect(
      renewHrefForNotification({ type: "SUBSCRIPTION_EXPIRED", metadata: { listingId: "l1", planId: "p1" } }),
    ).toBeNull();
    expect(renewHrefForNotification({ type: "SUBSCRIPTION_PAYMENT_FAILED", metadata: {} })).toBeNull();
  });
});

describe("Renew on a membership row", () => {
  it("offers Renew near the end of an active paid term", () => {
    expect(renewHrefForMembership(sub(), NOW)).toBe("/checkout?listing=l1&plan=p1");
  });

  it("doesn't offer it weeks before the term ends", () => {
    expect(
      renewHrefForMembership(sub({ end_date: new Date(NOW.getTime() + 20 * DAY).toISOString() }), NOW),
    ).toBeNull();
  });

  it("doesn't offer it when a saved card renews the membership", () => {
    expect(renewHrefForMembership(sub({ auto_renew: true, collection_method: "card_auto" }), NOW)).toBeNull();
  });

  it("offers it for past due, and for 30 days after expiry", () => {
    expect(renewHrefForMembership(sub({ status: MembershipSubscriptionStatus.PAST_DUE }), NOW)).not.toBeNull();
    const recent = new Date(NOW.getTime() - 10 * DAY).toISOString();
    const old = new Date(NOW.getTime() - 31 * DAY).toISOString();
    expect(renewHrefForMembership(sub({ status: MembershipSubscriptionStatus.EXPIRED, end_date: recent }), NOW)).not.toBeNull();
    expect(renewHrefForMembership(sub({ status: MembershipSubscriptionStatus.EXPIRED, end_date: old }), NOW)).toBeNull();
  });

  it("never for one-time, free, cancelled or listing-less memberships", () => {
    const base = sub();
    const plan = base.plan_id as Exclude<MembershipSubscription["plan_id"], string>;
    expect(renewHrefForMembership(sub({ plan_id: { ...plan, plan_type: MembershipPlanType.ONE_TIME } }), NOW)).toBeNull();
    expect(renewHrefForMembership(sub({ plan_id: { ...plan, price_minor: 0 } }), NOW)).toBeNull();
    expect(renewHrefForMembership(sub({ status: MembershipSubscriptionStatus.CANCELLED }), NOW)).toBeNull();
    expect(renewHrefForMembership(sub({ listing_id: undefined }), NOW)).toBeNull();
  });
});

describe("billing notification routing", () => {
  it.each([
    "PAYMENT_METHOD_EXPIRING",
    "PAYMENT_METHOD_UNUSABLE",
    "SUBSCRIPTION_RENEWAL_UPCOMING",
    "SUBSCRIPTION_PAYMENT_FAILED",
    "SUBSCRIPTION_PRICE_CHANGE",
  ])("%s opens the member's Billing page at the membership", (type) => {
    expect(billingNotificationTarget({ type, metadata: { subscriptionId: "abc123" } }, UserRole.USER)).toBe(
      "/dashboard/member/billing?subscriptionId=abc123",
    );
    expect(billingNotificationTarget({ type, metadata: {} }, UserRole.USER)).toBe("/dashboard/member/billing");
    // Whatever action URL it carries.
    expect(
      resolveNotificationTarget({ type, metadata: {}, actionUrl: "/dashboard/subscriptions?id=1" }, UserRole.USER),
    ).toBe("/dashboard/member/billing");
  });

  it("drops a subscription id that isn't a plain id", () => {
    expect(
      billingNotificationTarget({ type: "PAYMENT_METHOD_EXPIRING", metadata: { subscriptionId: "x&y=1" } }),
    ).toBe("/dashboard/member/billing");
  });

  it("sends a provider's final payment failure to their members", () => {
    const n = { type: "MEMBER_PAYMENT_FAILED_FINAL", metadata: {} };
    expect(billingNotificationTarget(n, UserRole.GYM_OWNER)).toBe("/dashboard/gym-owner/members");
    expect(billingNotificationTarget(n, UserRole.TRAINER)).toBe("/dashboard/trainer/clients");
    expect(billingNotificationTarget(n, UserRole.DIETITIAN)).toBe("/dashboard/dietitian/clients");
  });

  it("leaves every other notification to its action URL", () => {
    expect(billingNotificationTarget({ type: "BOOKING_CONFIRMED" })).toBeNull();
    expect(resolveNotificationTarget({ type: "BOOKING_CONFIRMED", actionUrl: "/dashboard/bookings" })).toBe(
      "/dashboard/bookings",
    );
  });
});

describe("cards", () => {
  it("labels and dates a card", () => {
    expect(cardLabel(card())).toBe("Visa •••• 4081");
    expect(cardLabel(card({ brand: null }))).toBe("Card •••• 4081");
    expect(cardExpiry(card())).toBe("09/27");
  });

  it("explains each status in plain words", () => {
    expect(cardStatusCopy(card()).label).toBe("Active");
    expect(cardStatusCopy(card({ status: "expired" })).tone).toBe("warn");
    const invalid = cardStatusCopy(card({ status: "invalid", invalid_reason: "account_changed" }));
    expect(invalid.tone).toBe("danger");
    expect(invalid.hint).toMatch(/changed their payment account/);
  });

  it("groups cards by provider", () => {
    const groups = groupCardsByProvider([
      card({ id: "a", provider_name: "Iron Temple" }),
      card({ id: "b", provider_name: "Ada Nutrition" }),
      card({ id: "c", provider_name: "Iron Temple" }),
      card({ id: "d", provider_name: null }),
    ]);
    expect(groups.map((g) => [g.provider, g.cards.map((c) => c.id)])).toEqual([
      ["Iron Temple", ["a", "c"]],
      ["Ada Nutrition", ["b"]],
      ["Provider", ["d"]],
    ]);
  });
});

describe("consent and outcome helpers", () => {
  const offered = {
    offered: true as const,
    text_version: "mbr-renew-v1",
    text: "Renew automatically. …",
    text_sha256: "f".repeat(64),
    rendered: {} as never,
  };

  it("reads a fresh consent and a reason when the API passes them through", () => {
    expect(consentFromError({ details: { consent: offered } })).toEqual(offered);
    expect(consentFromError({ details: { consent: { offered: false, reason: "disabled" } } })).toBeNull();
    expect(consentFromError({})).toBeNull();
    expect(reasonFromError({ details: { reason: "gym_managed" } })).toBe("gym_managed");
    expect(reasonFromError({})).toBeNull();
  });

  it("has plain copy for every reason, and a fallback", () => {
    for (const r of [
      "disabled",
      "no_provider_account",
      "free_plan",
      "one_time_plan",
      "gym_managed",
      "currency_not_card_chargeable",
      "plan_unavailable",
    ]) {
      expect(autoRenewUnavailableCopy(r)).not.toMatch(/_/);
    }
    expect(autoRenewUnavailableCopy("something_new")).toMatch(/isn't available/);
  });

  it("says whether the card was saved", () => {
    expect(autoRenewOutcome(false, { collection_method: "card_auto", auto_renew: true })).toBeNull();
    expect(autoRenewOutcome(true, { collection_method: "card_auto", auto_renew: true })).toBe("on");
    expect(autoRenewOutcome(true, { collection_method: "offline", auto_renew: false })).toBe("not_saved");
  });
});

describe("Record renewal payment availability", () => {
  it("is offered for active, past due and recently expired memberships", () => {
    expect(canRecordRenewalFor(sub(), NOW)).toBe(true);
    expect(canRecordRenewalFor(sub({ status: MembershipSubscriptionStatus.PAST_DUE }), NOW)).toBe(true);
    expect(
      canRecordRenewalFor(
        sub({ status: MembershipSubscriptionStatus.EXPIRED, end_date: new Date(NOW.getTime() - 3 * DAY).toISOString() }),
        NOW,
      ),
    ).toBe(true);
  });

  it("isn't offered for pending, cancelled or long-expired memberships", () => {
    expect(canRecordRenewalFor(sub({ status: MembershipSubscriptionStatus.PENDING_PAYMENT }), NOW)).toBe(false);
    expect(canRecordRenewalFor(sub({ status: MembershipSubscriptionStatus.CANCELLED }), NOW)).toBe(false);
    expect(
      canRecordRenewalFor(
        sub({ status: MembershipSubscriptionStatus.EXPIRED, end_date: new Date(NOW.getTime() - 40 * DAY).toISOString() }),
        NOW,
      ),
    ).toBe(false);
  });
});
