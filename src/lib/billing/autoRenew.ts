import type { ApiResponse, MembershipSubscription } from "@/lib/types";
import {
  MembershipPlanType,
  MembershipSubscriptionStatus,
  UserRole,
} from "@/lib/types";
import type {
  AutoRenewConsentOffer,
  OfferedConsent,
  PaymentMethodView,
} from "@/lib/api/memberBilling";

/**
 * Plain-words helpers for card auto-renew (api #204) and renew-in-place
 * (api #196). Pure functions so every state can be tested without a page.
 */

/** Plain copy for each reason the API gives for not offering auto-renew. */
const UNAVAILABLE_COPY: Record<string, string> = {
  disabled: "Automatic renewal isn't switched on yet. You can renew by paying for each term.",
  no_provider_account:
    "This provider doesn't take automatic card payments yet. You can renew by paying for each term.",
  free_plan: "This plan is free, so there's nothing to charge.",
  one_time_plan: "This is a one-time plan, so it doesn't renew.",
  gym_managed: "Your gym manages renewals for this membership. Pay your gym to renew it.",
  currency_not_card_chargeable:
    "Cards can't be charged automatically in this plan's currency. You can renew by paying for each term.",
  plan_unavailable: "This plan isn't offered any more, so it can't renew automatically.",
};

export function autoRenewUnavailableCopy(reason: string | null | undefined): string {
  return (
    (reason && UNAVAILABLE_COPY[reason]) ||
    "Automatic renewal isn't available for this membership."
  );
}

export function isOfferedConsent(
  offer: AutoRenewConsentOffer | null | undefined,
): offer is OfferedConsent {
  return !!offer && offer.offered === true && typeof offer.text === "string";
}

/**
 * The fresh consent a 409 CONSENT_TEXT_CHANGED or 400 CONSENT_REQUIRED
 * carries, when the API passes it through. Callers re-fetch the consent
 * endpoint when this is null, so the flow works either way.
 */
export function consentFromError(
  res: Pick<ApiResponse<unknown>, "details">,
): OfferedConsent | null {
  const consent = res.details?.consent as AutoRenewConsentOffer | undefined;
  return isOfferedConsent(consent) ? consent : null;
}

/** The `reason` a 400 AUTO_RENEW_NOT_AVAILABLE carries, if passed through. */
export function reasonFromError(
  res: Pick<ApiResponse<unknown>, "details">,
): string | null {
  const reason = res.details?.reason;
  return typeof reason === "string" ? reason : null;
}

// ─── Renew in place ──────────────────────────────────────────────────────────

const CHECKOUT_PATH = /\/marketplace\/listings\/([A-Za-z0-9_-]+)\/plans\/([A-Za-z0-9_-]+)\/checkout\/?$/;
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

function checkoutHref(listingId: string, planId: string): string {
  return `/checkout?listing=${encodeURIComponent(listingId)}&plan=${encodeURIComponent(planId)}`;
}

/**
 * The web checkout that renews a membership in place, from a notification's
 * metadata. The API's `checkoutPath` is its own POST route
 * (/marketplace/listings/:l/plans/:p/checkout); the page that opens it is
 * /checkout?listing=&plan=. Falls back to `listingId` + `planId`. Null when
 * the notice names no plan to pay for.
 */
export function renewHrefFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata) return null;
  const path = metadata.checkoutPath;
  if (typeof path === "string") {
    const m = CHECKOUT_PATH.exec(path.split("?")[0]);
    if (m) return checkoutHref(m[1], m[2]);
  }
  const listingId = metadata.listingId;
  const planId = metadata.planId;
  if (
    typeof listingId === "string" &&
    typeof planId === "string" &&
    SAFE_ID.test(listingId) &&
    SAFE_ID.test(planId)
  ) {
    return checkoutHref(listingId, planId);
  }
  return null;
}

/**
 * A notification that asks the member to pay for their next term. A failed
 * card payment counts only once it is final (`metadata.final !== false`):
 * while the card will be retried, paying another way could charge the
 * member twice, so no Renew is offered.
 */
export function isRenewalNotice(input: {
  type?: string | null;
  metadata?: Record<string, unknown> | null;
}): boolean {
  if (input.type === "SUBSCRIPTION_PAYMENT_FAILED") return input.metadata?.final !== false;
  return input.metadata?.reason === "renewal_payment_due";
}

/** The "Renew" link for a notification, or null when it isn't a renewal notice. */
export function renewHrefForNotification(input: {
  type?: string | null;
  metadata?: Record<string, unknown> | null;
}): string | null {
  return isRenewalNotice(input) ? renewHrefFromMetadata(input.metadata) : null;
}

/**
 * Whether the API will try the saved card again for a past-due membership.
 * Uses `renewal_retry` when the API sends it. Without it, a past-due
 * membership still renewing by card is treated as pending: a second payment
 * while the card is retried could charge the member twice.
 */
export function cardRetryFor(
  sub: MembershipSubscription,
): { pending: boolean; nextAttemptAt: string | null } {
  if (sub.status !== MembershipSubscriptionStatus.PAST_DUE) return { pending: false, nextAttemptAt: null };
  if (sub.renewal_retry) {
    return {
      pending: sub.renewal_retry.pending === true,
      nextAttemptAt: sub.renewal_retry.next_attempt_at ?? null,
    };
  }
  const byCard = sub.auto_renew && sub.collection_method === "card_auto";
  return { pending: byCard, nextAttemptAt: byCard ? (sub.next_charge_at ?? null) : null };
}

/** How long after expiry the API still renews the same membership (api #196). */
export const RENEWABLE_AFTER_EXPIRY_DAYS = 30;
/**
 * Offer paying ahead this close to the end of an active term. The same
 * window as mobile (#93): change both together.
 */
export const RENEW_AHEAD_DAYS = 7;

const DAY = 86_400_000;

/**
 * The checkout that renews this membership, or null when "Renew" shouldn't
 * show. Shown for a paid, recurring, self-serve plan bought from a listing
 * (a negotiated plan, `is_self_serve: false`, never; as on mobile) when:
 *  - it is past due, or expired within the last 30 days (renew in place);
 *  - it is active and ends within RENEW_AHEAD_DAYS (7), and no saved card
 *    will renew it.
 */
export function renewHrefForMembership(
  sub: MembershipSubscription,
  now: Date = new Date(),
): string | null {
  const plan = typeof sub.plan_id === "object" ? sub.plan_id : null;
  const listingId =
    typeof sub.listing_id === "object" ? sub.listing_id?._id : sub.listing_id;
  if (!plan || !listingId) return null;
  if (plan.plan_type === MembershipPlanType.ONE_TIME) return null;
  if (!(plan.price_minor > 0)) return null;
  if (plan.is_self_serve === false) return null;
  const end = sub.end_date ? new Date(sub.end_date).getTime() : NaN;
  const t = now.getTime();
  const renewsByCard = sub.auto_renew && sub.collection_method === "card_auto";

  switch (sub.status) {
    case MembershipSubscriptionStatus.PAST_DUE:
      // Not while the card will be tried again (double charge).
      if (cardRetryFor(sub).pending) return null;
      return checkoutHref(listingId, plan._id);
    case MembershipSubscriptionStatus.EXPIRED:
      if (Number.isNaN(end) || t - end > RENEWABLE_AFTER_EXPIRY_DAYS * DAY) return null;
      return checkoutHref(listingId, plan._id);
    case MembershipSubscriptionStatus.ACTIVE:
      if (renewsByCard || Number.isNaN(end)) return null;
      if (end - t > RENEW_AHEAD_DAYS * DAY) return null;
      return checkoutHref(listingId, plan._id);
    default:
      return null;
  }
}

// ─── Notification routing ────────────────────────────────────────────────────

/** Member-facing billing notifications: they all open the Billing page. */
export const MEMBER_BILLING_NOTIFICATION_TYPES = [
  "PAYMENT_METHOD_EXPIRING",
  "PAYMENT_METHOD_UNUSABLE",
  "SUBSCRIPTION_RENEWAL_UPCOMING",
  "SUBSCRIPTION_PAYMENT_FAILED",
  "SUBSCRIPTION_PRICE_CHANGE",
] as const;

const MEMBER_BILLING = "/dashboard/member/billing";

const PROVIDER_MEMBERS: Partial<Record<string, string>> = {
  // The owner's list of card renewals names the failed one.
  [UserRole.GYM_OWNER]: "/dashboard/gym-owner/card-renewals",
  [UserRole.TRAINER]: "/dashboard/trainer/clients",
  [UserRole.DIETITIAN]: "/dashboard/dietitian/clients",
};

/**
 * Where a billing notification opens, or null when it isn't one (the caller
 * then resolves its action URL as usual).
 *  - The member's card and renewal notices open Billing, scrolled to the
 *    membership when the notice names one.
 *  - MEMBER_PAYMENT_FAILED_FINAL goes to the provider: a gym owner opens
 *    Card renewals, a trainer or dietitian their clients list.
 */
export function billingNotificationTarget(
  input: { type?: string | null; metadata?: Record<string, unknown> | null },
  role?: UserRole | string | null,
): string | null {
  const type = input.type ?? "";
  if ((MEMBER_BILLING_NOTIFICATION_TYPES as readonly string[]).includes(type)) {
    const id = input.metadata?.subscriptionId;
    return typeof id === "string" && SAFE_ID.test(id)
      ? `${MEMBER_BILLING}?subscriptionId=${id}`
      : MEMBER_BILLING;
  }
  if (type === "MEMBER_PAYMENT_FAILED_FINAL") {
    return (role && PROVIDER_MEMBERS[role]) || "/dashboard/notifications";
  }
  return null;
}

// ─── Cards ───────────────────────────────────────────────────────────────────

/** "Visa •••• 4081". */
export function cardLabel(card: Pick<PaymentMethodView, "brand" | "last4">): string {
  const brand = card.brand
    ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1).toLowerCase()
    : "Card";
  return `${brand} •••• ${card.last4}`;
}

/** "Expires 09/27". */
export function cardExpiry(card: Pick<PaymentMethodView, "exp_month" | "exp_year">): string {
  const mm = String(card.exp_month).padStart(2, "0");
  const yy = String(card.exp_year).slice(-2);
  return `${mm}/${yy}`;
}

const INVALID_COPY: Record<string, string> = {
  account_changed:
    "This provider changed their payment account, so this card can't be charged any more. Pay your next renewal by card to save it again.",
  gateway_rejected: "The bank declined to keep this card for renewals.",
  needs_customer: "Your bank needs you to approve the next payment yourself.",
};

export function cardStatusCopy(
  card: Pick<PaymentMethodView, "status" | "invalid_reason">,
): { label: string; tone: "success" | "warn" | "danger"; hint: string | null } {
  if (card.status === "active") return { label: "Active", tone: "success", hint: null };
  if (card.status === "expired") {
    return {
      label: "Expired",
      tone: "warn",
      hint: "This card has expired. Pay your next renewal with a new card to keep auto-renew on.",
    };
  }
  return {
    label: "Can't be used",
    tone: "danger",
    hint: (card.invalid_reason && INVALID_COPY[card.invalid_reason]) || "This card can't be charged.",
  };
}

/** Cards grouped by provider, in the order the API listed them. */
export function groupCardsByProvider(
  cards: PaymentMethodView[],
): Array<{ provider: string; cards: PaymentMethodView[] }> {
  const groups = new Map<string, PaymentMethodView[]>();
  for (const card of cards) {
    const key = card.provider_name || "Provider";
    const list = groups.get(key);
    if (list) list.push(card);
    else groups.set(key, [card]);
  }
  return [...groups.entries()].map(([provider, list]) => ({ provider, cards: list }));
}

/**
 * Whether the subscribe response shows the card was saved. Used only to
 * word the success page; the Billing page re-reads the real state.
 */
export function autoRenewOutcome(
  ticked: boolean,
  sub: Partial<MembershipSubscription> | null | undefined,
): "on" | "not_saved" | null {
  if (!ticked) return null;
  return sub?.collection_method === "card_auto" && sub.auto_renew ? "on" : "not_saved";
}

const REASON_CODE = /^[a-z_]{1,40}$/;

/**
 * The success-page query for a ticked checkout: `&renewal=on`, or
 * `&renewal=not_saved` plus the API's `card_not_saved_reason` when it gave
 * one (a code only; anything else is dropped).
 */
export function autoRenewSuccessQuery(
  ticked: boolean,
  sub: Partial<MembershipSubscription> | null | undefined,
): string {
  const outcome = autoRenewOutcome(ticked, sub);
  if (!outcome) return "";
  const reason = sub?.card_not_saved_reason;
  return outcome === "not_saved" && typeof reason === "string" && REASON_CODE.test(reason)
    ? `&renewal=not_saved&reason=${reason}`
    : `&renewal=${outcome}`;
}

// ─── Why a card wasn't saved, or a renewal didn't go through ─────────────────

/**
 * Plain copy for the reasons the API gives when a card couldn't be saved
 * after a checkout (SaveCardOutcome) or a card renewal was stopped or
 * closed (a charge's closed_reason). Shown to members and providers, so it
 * names no internal states.
 */
const REASON_COPY: Record<string, string> = {
  disabled: "Automatic renewal is switched off for now.",
  not_reusable: "The bank didn't allow this card to be saved for renewals.",
  account_changed: "The provider changed their payment account, so the saved card can't be used.",
  no_customer_email: "The payment didn't come back with the details needed to save the card.",
  subscription_not_active: "The membership wasn't active when the payment finished.",
  terms_mismatch:
    "The payment didn't match the renewal terms that were agreed, so the card wasn't saved.",
  card_unavailable: "The saved card can't be used any more, so renewals are paid by link.",
  card_expired: "The card expired.",
  card_removed: "The member removed the card.",
  card_rejected: "The bank declined the card, so renewals are paid by link.",
  needs_customer: "The bank asked the member to approve the payment themselves.",
  retries_exhausted: "Every retry was declined.",
  grace_ended: "The grace period ended before the renewal was paid.",
  term_paid_another_way: "This term was paid another way.",
  auto_renew_off: "The member turned auto-renew off.",
  no_consent: "There's no agreement in force to charge this card.",
  member_suspended: "The member's account is suspended.",
  membership_not_live: "The membership had already ended.",
  cancelled: "The membership was cancelled.",
  no_provider_account: "There's no Paystack account connected to charge the card on.",
  amount_not_disclosed: "The new price hadn't been announced to the member in time.",
};

/** Why a card wasn't saved after checkout, in plain words. */
export function cardNotSavedCopy(reason: string | null | undefined): string {
  return (reason && REASON_COPY[reason]) || "We couldn't save this card for renewals.";
}

const CHARGE_STATUS: Record<string, { label: string; tone: "neutral" | "warn" | "danger" | "success" }> = {
  scheduled: { label: "Scheduled", tone: "neutral" },
  in_flight: { label: "Charging", tone: "neutral" },
  retry_scheduled: { label: "Retrying", tone: "warn" },
  awaiting_payment: { label: "Waiting for member", tone: "warn" },
  failed_final: { label: "Failed", tone: "danger" },
  succeeded: { label: "Paid", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  superseded: { label: "Paid another way", tone: "neutral" },
};

export function chargeStatusCopy(status: string): { label: string; tone: "neutral" | "warn" | "danger" | "success" } {
  return CHARGE_STATUS[status] ?? { label: status.replace(/_/g, " "), tone: "neutral" };
}

const FAILURE_CLASS_COPY: Record<string, string> = {
  soft: "Declined for now (for example, not enough funds). It will be retried.",
  hard: "The bank declined the card.",
  needs_customer: "The bank asked the member to approve the payment themselves.",
  unknown: "The payment didn't go through.",
};

/** Why a renewal charge stopped or failed: its closed reason, else its last attempt. */
export function chargeFailureCopy(charge: {
  closed_reason: string | null;
  attempts: Array<{ failure_class: string | null }>;
}): string | null {
  if (charge.closed_reason) {
    return REASON_COPY[charge.closed_reason] ?? "The renewal was stopped.";
  }
  const last = charge.attempts[charge.attempts.length - 1];
  return last?.failure_class ? (FAILURE_CLASS_COPY[last.failure_class] ?? null) : null;
}
