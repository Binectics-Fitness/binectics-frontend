import { describe, it, expect } from "vitest";
import {
  autoRenewOutcome,
  autoRenewSuccessQuery,
  cardRetryFor,
  autoRenewUnavailableCopy,
  billingNotificationTarget,
  cardNotSavedCopy,
  chargeFailureCopy,
  chargeStatusCopy,
  cardExpiry,
  cardLabel,
  cardStatusCopy,
  cancelledTermForPlan,
  consentFromError,
  groupCardsByProvider,
  reasonFromError,
  renewActionFor,
  renewalListingFor,
  renewDue,
  renewHrefForMembership,
  renewHrefForNotification,
  renewHrefFromMetadata,
  RENEW_AHEAD_DAYS,
  uncancelCheckoutLine,
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

  it("opens the window exactly RENEW_AHEAD_DAYS (7, as on mobile) before the end", () => {
    expect(RENEW_AHEAD_DAYS).toBe(7);
    const at = (days: number) => sub({ end_date: new Date(NOW.getTime() + days * DAY).toISOString() });
    expect(renewHrefForMembership(at(RENEW_AHEAD_DAYS), NOW)).toBe("/checkout?listing=l1&plan=p1");
    expect(renewHrefForMembership(at(RENEW_AHEAD_DAYS + 0.01), NOW)).toBeNull();
    expect(renewHrefForMembership(at(8), NOW)).toBeNull();
    expect(renewHrefForMembership(at(10), NOW)).toBeNull();
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

  it("sends a provider's final payment failure to Card renewals or their clients", () => {
    const n = { type: "MEMBER_PAYMENT_FAILED_FINAL", metadata: {} };
    expect(billingNotificationTarget(n, UserRole.GYM_OWNER)).toBe("/dashboard/gym-owner/card-renewals");
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

describe("why a card wasn't saved, or a renewal stopped", () => {
  it("has plain copy for the new not-saved reasons (api #205/#206)", () => {
    expect(cardNotSavedCopy("terms_mismatch")).toBe(
      "The payment didn't match the renewal terms that were agreed, so the card wasn't saved.",
    );
    expect(cardNotSavedCopy("card_unavailable")).toBe(
      "The saved card can't be used any more, so renewals are paid by link.",
    );
    for (const r of ["disabled", "not_reusable", "account_changed", "no_customer_email", "subscription_not_active"]) {
      expect(cardNotSavedCopy(r)).not.toMatch(/_/);
    }
    expect(cardNotSavedCopy("something_new")).toBe("We couldn't save this card for renewals.");
  });

  it("labels every charge status in plain words", () => {
    expect(chargeStatusCopy("failed_final")).toEqual({ label: "Failed", tone: "danger" });
    expect(chargeStatusCopy("awaiting_payment").label).toBe("Waiting for member");
    expect(chargeStatusCopy("retry_scheduled").tone).toBe("warn");
    expect(chargeStatusCopy("brand_new").label).toBe("brand new");
  });

  it("explains a charge by its closed reason, else its last attempt", () => {
    expect(chargeFailureCopy({ closed_reason: "card_unavailable", attempts: [] })).toMatch(/can't be used any more/);
    expect(chargeFailureCopy({ closed_reason: "retries_exhausted", attempts: [] })).toBe("Every retry was declined.");
    expect(chargeFailureCopy({ closed_reason: null, attempts: [{ failure_class: "hard" }, { failure_class: "soft" }] })).toMatch(/retried/);
    expect(chargeFailureCopy({ closed_reason: null, attempts: [] })).toBeNull();
    expect(chargeFailureCopy({ closed_reason: "odd_new_reason", attempts: [] })).toBe("The renewal was stopped.");
  });
});

describe("parity with mobile's memberBilling (#246 review)", () => {
  const due = { status: MembershipSubscriptionStatus.PAST_DUE };

  it("cardRetryFor without renewal_retry: past due on card_auto is pending, auto-renew on or off (mobile)", () => {
    expect(cardRetryFor(sub({ ...due, collection_method: "card_auto", auto_renew: true })).pending).toBe(true);
    expect(cardRetryFor(sub({ ...due, collection_method: "card_auto", auto_renew: false })).pending).toBe(true);
    expect(cardRetryFor(sub({ ...due, collection_method: "pay_link", auto_renew: false })).pending).toBe(false);
    expect(cardRetryFor(sub({ ...due, collection_method: undefined })).pending).toBe(false);
    // Only past due: an active card_auto membership isn't being retried.
    expect(cardRetryFor(sub({ collection_method: "card_auto", auto_renew: false })).pending).toBe(false);
    // renewal_retry, when sent, is the answer.
    expect(
      cardRetryFor(sub({ ...due, collection_method: "card_auto", renewal_retry: { pending: false, next_attempt_at: null } })).pending,
    ).toBe(false);
  });

  it("no Renew for a past-due card_auto membership with auto-renew off while the old API says nothing", () => {
    const s = sub({ ...due, collection_method: "card_auto", auto_renew: false });
    expect(renewDue(s, NOW)).toBe(false);
    expect(renewHrefForMembership(s, NOW)).toBeNull();
    expect(renewActionFor(s, NOW)).toBeNull();
  });

  it("past due needs a valid end date, as every other status does (mobile renewDue)", () => {
    expect(renewDue(sub({ ...due }), NOW)).toBe(true);
    expect(renewDue(sub({ ...due, end_date: undefined }), NOW)).toBe(false);
    expect(renewDue(sub({ ...due, end_date: "not a date" }), NOW)).toBe(false);
    expect(renewHrefForMembership(sub({ ...due, end_date: undefined }), NOW)).toBeNull();
    expect(renewDue(sub({ status: MembershipSubscriptionStatus.EXPIRED, end_date: undefined }), NOW)).toBe(false);
    expect(renewDue(sub({ end_date: undefined }), NOW)).toBe(false);
  });

  it("never due for paused, suspended, cancelled or pending memberships", () => {
    for (const status of [
      MembershipSubscriptionStatus.PAUSED,
      MembershipSubscriptionStatus.SUSPENDED,
      MembershipSubscriptionStatus.CANCELLED,
      MembershipSubscriptionStatus.PENDING_PAYMENT,
    ]) {
      const s = sub({ status, renewal_listing_id: "l1" });
      expect(renewDue(s, NOW)).toBe(false);
      expect(renewActionFor(s, NOW)).toBeNull();
      // Not even "ask the gym": nothing is due.
      expect(renewActionFor(sub({ status, listing_id: undefined, renewal_listing_id: null }), NOW)).toBeNull();
    }
  });

  it("never anything while a card retry is pending, whatever listing is named", () => {
    const retrying = { renewal_retry: { pending: true, next_attempt_at: "2026-10-12T00:00:00Z" } };
    expect(renewActionFor(sub({ ...due, ...retrying, renewal_listing_id: "l2" }), NOW)).toBeNull();
    expect(renewActionFor(sub({ ...due, ...retrying, listing_id: undefined, renewal_listing_id: null }), NOW)).toBeNull();
    expect(renewActionFor(sub({ ...retrying, renewal_listing_id: "l2" }), NOW)).toBeNull();
  });
});

describe("where Renew points (renewal_listing_id, api #258/#263/#265)", () => {
  it("renewal_listing_id when the API sends it; the own listing only on an older API", () => {
    expect(renewalListingFor(sub({ renewal_listing_id: "l2" }))).toBe("l2");
    expect(renewHrefForMembership(sub({ renewal_listing_id: "l2" }), NOW)).toBe("/checkout?listing=l2&plan=p1");
    // No field (older API): the membership's own listing.
    expect(renewalListingFor(sub())).toBe("l1");
    expect(renewalListingFor(sub({ listing_id: "l3" }))).toBe("l3");
    // A malformed id is never put in a URL, and isn't replaced by the own one.
    expect(renewalListingFor(sub({ renewal_listing_id: "a/b?c" }))).toBeNull();
  });

  it("explicit null is final, even with an own listing: the API found it can't be opened, so ask the gym", () => {
    const s = sub({ renewal_listing_id: null });
    expect(renewalListingFor(s)).toBeNull();
    expect(renewHrefForMembership(s, NOW)).toBeNull();
    expect(renewActionFor(s, NOW)).toEqual({ kind: "ask_gym", gymName: "Iron Temple", organizationId: "o1", canMessage: true });
  });

  it("pays for renewal_plan_id when the API names one, else the current plan", () => {
    expect(renewHrefForMembership(sub({ renewal_plan_id: "p2" }), NOW)).toBe("/checkout?listing=l1&plan=p2");
    expect(renewHrefForMembership(sub({ renewal_plan_id: null }), NOW)).toBe("/checkout?listing=l1&plan=p1");
    expect(renewHrefForMembership(sub({ renewal_plan_id: "x y" }), NOW)).toBe("/checkout?listing=l1&plan=p1");
    expect(renewHrefForMembership(sub({ renewal_listing_id: "gl1", renewal_plan_id: "p2" }), NOW)).toBe(
      "/checkout?listing=gl1&plan=p2",
    );
  });

  it("a gym-enrolled membership renews through the gym's listing the API names", () => {
    const enrolled = sub({ listing_id: undefined, renewal_listing_id: "gl1" });
    expect(renewActionFor(enrolled, NOW)).toEqual({ kind: "checkout", href: "/checkout?listing=gl1&plan=p1" });
  });

  it("null (the API says there is none) vs absent (an older API: not known)", () => {
    expect(renewalListingFor(sub({ listing_id: undefined, renewal_listing_id: null }))).toBeNull();
    expect(renewalListingFor(sub({ listing_id: undefined }))).toBeUndefined();
    // Not known: no Renew, and nobody is told to ask the gym.
    expect(renewActionFor(sub({ listing_id: undefined }), NOW)).toBeNull();
  });

  it("asks the gym when the API says it has no listing, with Message while a membership there opens its inbox", () => {
    const none = { listing_id: undefined, renewal_listing_id: null };
    expect(renewActionFor(sub({ ...none }), NOW)).toEqual({
      kind: "ask_gym",
      gymName: "Iron Temple",
      organizationId: "o1",
      canMessage: true,
    });
    // Expired: the gym's inbox doesn't take an ex-member...
    const lapsed = sub({ ...none, status: MembershipSubscriptionStatus.EXPIRED, end_date: new Date(NOW.getTime() - 3 * DAY).toISOString() });
    expect(renewActionFor(lapsed, NOW)).toMatchObject({ kind: "ask_gym", canMessage: false });
    // ...unless another live membership at the same gym does (per organization).
    const other = sub({ _id: "s2", status: MembershipSubscriptionStatus.PAUSED, organization_id: "o1" });
    expect(renewActionFor(lapsed, NOW, [lapsed, other])).toMatchObject({ kind: "ask_gym", canMessage: true });
    // A live membership at another gym doesn't count.
    const elsewhere = sub({ _id: "s3", organization_id: { _id: "o2", name: "Elsewhere" } });
    expect(renewActionFor(lapsed, NOW, [lapsed, elsewhere])).toMatchObject({ kind: "ask_gym", canMessage: false });
  });

  it("no gym to ask: nothing", () => {
    expect(renewActionFor(sub({ listing_id: undefined, renewal_listing_id: null, organization_id: undefined }), NOW)).toBeNull();
  });

  it("no ask for a plan that isn't due: one-time, free, negotiated, or weeks from its end", () => {
    const none = { listing_id: undefined, renewal_listing_id: null };
    const plan = sub().plan_id as Exclude<MembershipSubscription["plan_id"], string>;
    expect(renewActionFor(sub({ ...none, plan_id: { ...plan, plan_type: MembershipPlanType.ONE_TIME } }), NOW)).toBeNull();
    expect(renewActionFor(sub({ ...none, plan_id: { ...plan, price_minor: 0 } }), NOW)).toBeNull();
    expect(renewActionFor(sub({ ...none, plan_id: { ...plan, is_self_serve: false } }), NOW)).toBeNull();
    expect(renewActionFor(sub({ ...none, end_date: new Date(NOW.getTime() + 20 * DAY).toISOString() }), NOW)).toBeNull();
  });
});

describe("review fixes (SF-1, SF-2)", () => {
  it("no Renew on a failed card payment while retries remain (final: false)", () => {
    const meta = { checkoutPath: "/marketplace/listings/l1/plans/p1/checkout" };
    expect(renewHrefForNotification({ type: "SUBSCRIPTION_PAYMENT_FAILED", metadata: { ...meta, final: false } })).toBeNull();
    expect(renewHrefForNotification({ type: "SUBSCRIPTION_PAYMENT_FAILED", metadata: { ...meta, final: true } })).toBe(
      "/checkout?listing=l1&plan=p1",
    );
  });

  it("no Renew on a past-due membership whose card will be retried", () => {
    const due = { status: MembershipSubscriptionStatus.PAST_DUE };
    expect(
      renewHrefForMembership(sub({ ...due, renewal_retry: { pending: true, next_attempt_at: "2026-10-12T00:00:00Z" } }), NOW),
    ).toBeNull();
    expect(renewHrefForMembership(sub({ ...due, renewal_retry: { pending: false, next_attempt_at: null } }), NOW)).not.toBeNull();
    // Fallback without renewal_retry: still on the card means retried.
    expect(renewHrefForMembership(sub({ ...due, auto_renew: true, collection_method: "card_auto" }), NOW)).toBeNull();
    expect(cardRetryFor(sub({ ...due, auto_renew: true, collection_method: "card_auto", next_charge_at: "2026-10-12T00:00:00Z" }))).toEqual({
      pending: true,
      nextAttemptAt: "2026-10-12T00:00:00Z",
    });
    expect(cardRetryFor(sub()).pending).toBe(false);
  });

  it("no Renew on a past-due membership still on the saved card, even with no retry left (mobile renewDue)", () => {
    const onCard = { status: MembershipSubscriptionStatus.PAST_DUE, auto_renew: true, collection_method: "card_auto" as const };
    expect(renewHrefForMembership(sub({ ...onCard, renewal_retry: { pending: false, next_attempt_at: null } }), NOW)).toBeNull();
    expect(renewHrefForMembership(sub({ ...onCard, renewal_retry: null }), NOW)).toBeNull();
    // Off the card (auto-renew off, or moved to pay_link): Renew comes back.
    expect(
      renewHrefForMembership(sub({ ...onCard, auto_renew: false, renewal_retry: { pending: false, next_attempt_at: null } }), NOW),
    ).toBe("/checkout?listing=l1&plan=p1");
    expect(
      renewHrefForMembership(
        sub({ ...onCard, collection_method: "pay_link", renewal_retry: { pending: false, next_attempt_at: null } }),
        NOW,
      ),
    ).toBe("/checkout?listing=l1&plan=p1");
  });

  it("renewal_retry wins on any status: pending hides Renew, even on an active term", () => {
    const pendingActive = sub({ renewal_retry: { pending: true, next_attempt_at: "2026-10-12T00:00:00Z" } });
    expect(cardRetryFor(pendingActive)).toEqual({ pending: true, nextAttemptAt: "2026-10-12T00:00:00Z" });
    expect(renewHrefForMembership(pendingActive, NOW)).toBeNull();
    expect(renewHrefForMembership(sub({ renewal_retry: { pending: false, next_attempt_at: null } }), NOW)).not.toBeNull();
  });

  it("no Renew for a negotiated (non-self-serve) plan, as on mobile", () => {
    const plan = sub().plan_id as Exclude<MembershipSubscription["plan_id"], string>;
    expect(renewHrefForMembership(sub({ plan_id: { ...plan, is_self_serve: false } }), NOW)).toBeNull();
    expect(renewHrefForMembership(sub({ plan_id: { ...plan, is_self_serve: true } }), NOW)).not.toBeNull();
  });

  it("carries the not-saved reason code to the success page, and nothing else", () => {
    expect(autoRenewSuccessQuery(false, {})).toBe("");
    expect(autoRenewSuccessQuery(true, { collection_method: "card_auto", auto_renew: true })).toBe("&renewal=on");
    expect(autoRenewSuccessQuery(true, { card_not_saved_reason: "card_unavailable" })).toBe(
      "&renewal=not_saved&reason=card_unavailable",
    );
    expect(autoRenewSuccessQuery(true, { card_not_saved_reason: "x&y=<b>" })).toBe("&renewal=not_saved");
    expect(autoRenewSuccessQuery(true, {})).toBe("&renewal=not_saved");
  });
});

describe("renewing a membership cancelled mid-term at checkout", () => {
  const CANCELLED = "2026-10-05T10:00:00Z";
  const fmt = (iso: string) => `<${iso.slice(0, 10)}>`;
  const rendered = (over: Record<string, unknown> = {}) => ({
    rendered: {
      merchant_name: "Iron Temple",
      collected_by: "provider" as const,
      amount_minor: 2_500_000,
      currency: "NGN",
      interval_days: 30,
      first_charge_at: "2026-11-07T00:00:00.000Z",
      reminder_hours: 72,
      price_notice_days: 7,
      ...over,
    },
  });

  it("finds the running membership on this plan the member cancelled", () => {
    const s = sub({ cancel_requested_at: CANCELLED });
    expect(cancelledTermForPlan([s], "p1")).toBe(s);
  });

  it("finds it through the plan the gym scheduled next", () => {
    const s = sub({ plan_id: "p0", next_plan_id: { _id: "p1", name: "Monthly" }, cancel_requested_at: CANCELLED });
    expect(cancelledTermForPlan([s], "p1")).toBe(s);
  });

  it("finds nothing when it wasn't cancelled, is on another plan, or has ended", () => {
    expect(cancelledTermForPlan([sub()], "p1")).toBeNull();
    expect(cancelledTermForPlan([sub({ cancel_requested_at: CANCELLED })], "p2")).toBeNull();
    expect(
      cancelledTermForPlan([sub({ cancel_requested_at: CANCELLED, status: MembershipSubscriptionStatus.EXPIRED })], "p1"),
    ).toBeNull();
    expect(cancelledTermForPlan(null, "p1")).toBeNull();
  });

  it("goes by the most recent membership on the plan, the one the API renews", () => {
    const older = sub({ _id: "s0", cancel_requested_at: CANCELLED, end_date: "2026-10-01T00:00:00Z" });
    const newer = sub({ _id: "s1", end_date: "2026-11-08T00:00:00Z" });
    expect(cancelledTermForPlan([older, newer], "p1")).toBeNull();
  });

  it("says the card is charged on the terms' first charge date", () => {
    expect(uncancelCheckoutLine(rendered(), fmt)).toBe(
      "You cancelled this membership. Ticking the box to renew automatically takes that back: your membership keeps going and your card will be charged on <2026-11-07>.",
    );
  });

  it("says 'at your next renewal' without a usable date", () => {
    expect(uncancelCheckoutLine(rendered({ first_charge_at: "" }), fmt)).toMatch(/charged at your next renewal\.$/);
    expect(uncancelCheckoutLine(rendered({ first_charge_at: "not a date" }), fmt)).toMatch(/at your next renewal\.$/);
    expect(uncancelCheckoutLine(null, fmt)).toMatch(/at your next renewal\.$/);
  });

  it("promises no charge when the renewal costs nothing", () => {
    const line = uncancelCheckoutLine(rendered({ amount_minor: 0 }), fmt);
    expect(line).toBe(
      "You cancelled this membership. Ticking the box to renew automatically takes that back: your membership keeps going.",
    );
    expect(line).not.toMatch(/charge/);
  });
});
