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

/** A notification that asks the member to pay for their next term. */
export function isRenewalNotice(input: {
  type?: string | null;
  metadata?: Record<string, unknown> | null;
}): boolean {
  if (input.type === "SUBSCRIPTION_PAYMENT_FAILED") return true;
  return input.metadata?.reason === "renewal_payment_due";
}

/** The "Renew" link for a notification, or null when it isn't a renewal notice. */
export function renewHrefForNotification(input: {
  type?: string | null;
  metadata?: Record<string, unknown> | null;
}): string | null {
  return isRenewalNotice(input) ? renewHrefFromMetadata(input.metadata) : null;
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
 * show. Shown for a paid, recurring plan bought from a listing when:
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
  const end = sub.end_date ? new Date(sub.end_date).getTime() : NaN;
  const t = now.getTime();
  const renewsByCard = sub.auto_renew && sub.collection_method === "card_auto";

  switch (sub.status) {
    case MembershipSubscriptionStatus.PAST_DUE:
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
  [UserRole.GYM_OWNER]: "/dashboard/gym-owner/members",
  [UserRole.TRAINER]: "/dashboard/trainer/clients",
  [UserRole.DIETITIAN]: "/dashboard/dietitian/clients",
};

/**
 * Where a billing notification opens, or null when it isn't one (the caller
 * then resolves its action URL as usual).
 *  - The member's card and renewal notices open Billing, scrolled to the
 *    membership when the notice names one.
 *  - MEMBER_PAYMENT_FAILED_FINAL goes to the provider: it opens their members
 *    (or clients) list, where the lapsed member is.
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
