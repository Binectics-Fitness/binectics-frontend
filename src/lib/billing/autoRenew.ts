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

/**
 * Whether a checkout for `planId` renews a membership the member cancelled
 * mid-term: their own, on this plan (or with it scheduled next), still
 * running (active or past due) and with `cancel_requested_at` set. Ticking
 * "renew automatically" on that checkout takes the cancellation back (the
 * API clears it when it saves the card), so the page says so first.
 */
export function cancelledTermForPlan(
  subs: MembershipSubscription[] | null | undefined,
  planId: string,
): MembershipSubscription | null {
  const idOf = (v: unknown): string | null =>
    typeof v === "string" ? v : v && typeof v === "object" && "_id" in v ? String((v as { _id: unknown })._id) : null;
  const running = (subs ?? [])
    .filter(
      (s) =>
        (idOf(s.plan_id) === planId || idOf(s.next_plan_id) === planId) &&
        (s.status === MembershipSubscriptionStatus.ACTIVE ||
          s.status === MembershipSubscriptionStatus.PAST_DUE),
    )
    // The API renews the most recent one; only that one's state counts.
    .sort((a, b) => new Date(b.end_date ?? 0).getTime() - new Date(a.end_date ?? 0).getTime());
  return running[0]?.cancel_requested_at ? running[0] : null;
}

/**
 * The line above the renewal terms at checkout for a membership cancelled
 * mid-term (web PR 228, mobile PR 107). The date is the terms' own first
 * charge, never one computed here; without it, "at your next renewal".
 * A renewal that charges nothing promises no charge.
 */
export function uncancelCheckoutLine(
  consent: Pick<OfferedConsent, "rendered"> | null | undefined,
  fmt: (iso: string) => string,
): string {
  const lead =
    "You cancelled this membership. Ticking the box to renew automatically takes that back: your membership keeps going";
  // Nothing to charge, nothing promised (a free plan never gets here today).
  const amount = consent?.rendered?.amount_minor;
  if (typeof amount === "number" && !(amount > 0)) return `${lead}.`;
  const raw = consent?.rendered?.first_charge_at;
  const valid = typeof raw === "string" && !Number.isNaN(new Date(raw).getTime());
  const when = valid ? `on ${fmt(raw)}` : "at your next renewal";
  return `${lead} and your card will be charged ${when}.`;
}

// ─── Renew in place ──────────────────────────────────────────────────────────

const CHECKOUT_PATH = /\/marketplace\/listings\/([A-Za-z0-9_-]+)\/plans\/([A-Za-z0-9_-]+)\/checkout\/?$/;
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
/** binectics-api RENEWAL_PAYMENT_DUE: a lapsed term's renewal notice. */
const RENEWAL_PAYMENT_DUE = "renewal_payment_due";

function checkoutHref(listingId: string, planId: string): string {
  return `/checkout?listing=${encodeURIComponent(listingId)}&plan=${encodeURIComponent(planId)}`;
}

/**
 * The web checkout that renews a membership in place, from a notification's
 * metadata. The API's `checkoutPath` is its own POST route
 * (/marketplace/listings/:l/plans/:p/checkout); the page that opens it is
 * /checkout?listing=&plan=. Falls back to `listingId` + `planId`, except on
 * a renewal-due notice (`reason: "renewal_payment_due"`), which counts only
 * with `checkoutPath`: the API sends one only when the listing sells the
 * renewal plan (api #267), and notices stored before that carry a pair the
 * listing may refuse. Such a notice opens Billing instead
 * (billingNotificationTarget). Mobile's `resolveRenewalCheckout`. Null when
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
  if (metadata.reason === RENEWAL_PAYMENT_DUE) return null;
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
  return input.metadata?.reason === RENEWAL_PAYMENT_DUE;
}

/** The "Renew" link for a notification, or null when it isn't a renewal notice. */
export function renewHrefForNotification(input: {
  type?: string | null;
  metadata?: Record<string, unknown> | null;
}): string | null {
  return isRenewalNotice(input) ? renewHrefFromMetadata(input.metadata) : null;
}

/**
 * Whether a saved-card charge for the current term is scheduled for retry
 * or in flight (my-subscriptions `renewal_retry`, api #206). While it is, a
 * second payment could charge the member twice, so Renew isn't offered.
 * An older API without the field: a past-due membership still collected by
 * card (`card_auto`) is treated as pending, whether or not auto-renew is
 * still on (when retries run out the API moves it to `pay_link`). The same
 * pending rule as mobile's `cardRetryFor`; for the date, web falls back to
 * `next_charge_at` where mobile says "soon".
 */
export function cardRetryFor(
  sub: MembershipSubscription,
): { pending: boolean; nextAttemptAt: string | null } {
  if (sub.renewal_retry) {
    return {
      pending: sub.renewal_retry.pending === true,
      nextAttemptAt: sub.renewal_retry.next_attempt_at ?? null,
    };
  }
  const byCard =
    sub.status === MembershipSubscriptionStatus.PAST_DUE && sub.collection_method === "card_auto";
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
 * Whether renewing is the member's next step for this membership, wherever
 * they pay. True for a paid, recurring, self-serve plan (a negotiated plan,
 * `is_self_serve: false`, never) with a valid end date when:
 *  - it is past due and no longer on the saved card (auto-renew off, or
 *    collected by pay link);
 *  - it expired within the last 30 days (renew in place);
 *  - it is active and ends within RENEW_AHEAD_DAYS (7), and no saved card
 *    will renew it.
 * Never while a card charge for the term is retrying or in flight, and
 * never for a paused, suspended, cancelled or pending membership.
 *
 * The same rule as mobile's `renewDue` (binectics-mobile
 * src/utils/memberBilling.ts). In particular, a past-due membership still on
 * the saved card gets no Renew even when no retry is scheduled: the member
 * turns auto-renew off first (which ends the grace), then renews, never both
 * at once. Change both apps together.
 *
 * The plan judged is the one the member would renew onto. When the API
 * names it (`renewal_plan_id` is an id, api #267), that plan: the API names
 * only a paid, recurring plan the renewal listing sells, so a member on a
 * free or one-time plan whose gym scheduled a paid next plan is due too.
 * Otherwise (null, or an older API that sends no field) the membership's
 * own plan.
 */
export function renewDue(sub: MembershipSubscription, now: Date = new Date()): boolean {
  // Never while a card charge for this term is retrying or in flight.
  if (cardRetryFor(sub).pending) return false;
  if (typeof namedRenewalPlan(sub) !== "string") {
    const plan = typeof sub.plan_id === "object" ? sub.plan_id : null;
    if (!plan?._id) return false;
    if (plan.plan_type === MembershipPlanType.ONE_TIME) return false;
    if (!(plan.price_minor > 0)) return false;
    if (plan.is_self_serve === false) return false;
  }
  const end = sub.end_date ? new Date(sub.end_date).getTime() : NaN;
  if (Number.isNaN(end)) return false;
  const t = now.getTime();
  const renewsByCard = sub.auto_renew && sub.collection_method === "card_auto";

  switch (sub.status) {
    case MembershipSubscriptionStatus.PAST_DUE:
      // Still on the saved card: auto-renew goes off first, then Renew.
      return !renewsByCard;
    case MembershipSubscriptionStatus.EXPIRED:
      return t - end <= RENEWABLE_AFTER_EXPIRY_DAYS * DAY;
    case MembershipSubscriptionStatus.ACTIVE:
      return !renewsByCard && end - t <= RENEW_AHEAD_DAYS * DAY;
    default:
      return false;
  }
}

const idOf = (v: unknown): string | null =>
  typeof v === "string" && v
    ? v
    : v && typeof v === "object" && "_id" in v && (v as { _id: unknown })._id
      ? String((v as { _id: unknown })._id)
      : null;

/**
 * The listing a membership renews through:
 *  - when the API sends `renewal_listing_id` (my-subscriptions, api
 *    #258/#263/#265), its answer is final: the openable listing that sells
 *    the plan, else the membership's own if still openable, else its gym's
 *    newest. Null means none of those can be opened (the own listing may be
 *    unpublished or suspended, so its checkout would 404), and the member
 *    is asked to go to the gym instead;
 *  - on an older API that sends no field, the membership's own listing;
 *    without one, undefined: whether the gym has a listing isn't known, so
 *    nobody is told to ask the gym.
 *
 * Not quite mobile's `gymListingFor`: mobile tries the membership's own
 * listing before `renewal_listing_id`, and on an older API looks for the
 * gym's listing among the member's providers. Web trusts the API's answer
 * because it names the listing that sells the plan (api #263) and has
 * already checked that the own listing can still be opened.
 */
export function renewalListingFor(sub: MembershipSubscription): string | null | undefined {
  const named = sub.renewal_listing_id;
  if (named !== undefined) return typeof named === "string" && SAFE_ID.test(named) ? named : null;
  const own = idOf(sub.listing_id);
  return own && SAFE_ID.test(own) ? own : undefined;
}

/**
 * The API's `renewal_plan_id` (api #267): the id when it names one, null
 * when it sends null (or an id unsafe to put in a URL), undefined on an
 * older API that sends no field.
 */
function namedRenewalPlan(sub: MembershipSubscription): string | null | undefined {
  const named = sub.renewal_plan_id;
  if (named === undefined) return undefined;
  return typeof named === "string" && SAFE_ID.test(named) ? named : null;
}

/**
 * The plan a renewal checkout pays for:
 *  - when the API sends `renewal_plan_id` (api #267), its answer is final:
 *    the plan the renewal will be on (e.g. a gym's scheduled next plan), or
 *    null when the renewal listing sells no plan the member can buy, and
 *    the member is asked to go to the gym. Never the current plan in place
 *    of a null;
 *  - on an older API that sends no field, the membership's current plan.
 *
 * Mobile's `renewalPlanFor` (binectics-mobile src/utils/memberBilling.ts).
 */
export function renewalPlanFor(sub: MembershipSubscription): string | null {
  const named = namedRenewalPlan(sub);
  if (named !== undefined) return named;
  const plan = typeof sub.plan_id === "object" ? sub.plan_id : null;
  return plan?._id ?? null;
}

/**
 * Statuses the gym's inbox takes a member in: binectics-api's
 * SEAT_BEARING_STATUSES, the messaging gate (per organization). Mobile's
 * SEAT_BEARING.
 */
const SEAT_BEARING: readonly MembershipSubscriptionStatus[] = [
  MembershipSubscriptionStatus.PENDING_PAYMENT,
  MembershipSubscriptionStatus.ACTIVE,
  MembershipSubscriptionStatus.PAUSED,
  MembershipSubscriptionStatus.SUSPENDED,
  MembershipSubscriptionStatus.PAST_DUE,
];

/**
 * What renewing means for a membership that is due (renewDue):
 *  - checkout: renewalPlanFor's plan, through renewalListingFor's listing;
 *  - ask_gym: the API says there is no listing to pay through, or no plan
 *    to pay for there (`renewal_plan_id: null`), so the member asks the gym. `canMessage` when any of the member's memberships at that
 *    gym still opens its inbox (the API's gate is per organization).
 * Null when renewing is not due, where to renew is not known, or there is
 * no gym to ask. Mobile's `renewActionFor`, except that mobile returns
 * `{ kind: 'unknown' }` where this returns null, and finds the listing as
 * renewalListingFor describes.
 */
export type RenewAction =
  | { kind: "checkout"; href: string }
  | { kind: "ask_gym"; gymName: string; organizationId: string; canMessage: boolean };

export function renewActionFor(
  sub: MembershipSubscription,
  now: Date = new Date(),
  /** All the member's memberships, for whether the gym's inbox takes them. */
  memberships: readonly Pick<MembershipSubscription, "status" | "organization_id">[] = [],
): RenewAction | null {
  if (!renewDue(sub, now)) return null;
  const listingId = renewalListingFor(sub);
  if (listingId === undefined) return null;
  const planId = renewalPlanFor(sub);
  if (listingId && planId) return { kind: "checkout", href: checkoutHref(listingId, planId) };
  const organizationId = idOf(sub.organization_id);
  if (!organizationId) return null;
  const orgName =
    typeof sub.organization_id === "object" ? sub.organization_id.name?.trim() : "";
  return {
    kind: "ask_gym",
    gymName: orgName || "your gym",
    organizationId,
    canMessage: [sub, ...memberships].some(
      (m) => idOf(m.organization_id) === organizationId && SEAT_BEARING.includes(m.status),
    ),
  };
}

/**
 * The checkout that renews this membership, or null when "Renew" shouldn't
 * show (renewDue), or there is no listing to renew through
 * (renewalListingFor) or no plan to pay for (renewalPlanFor). Mobile's `renewCheckoutFor`, with the listing order
 * renewalListingFor describes.
 */
export function renewHrefForMembership(
  sub: MembershipSubscription,
  now: Date = new Date(),
): string | null {
  const action = renewActionFor(sub, now);
  return action?.kind === "checkout" ? action.href : null;
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
  // A renewal-due notice (a SUBSCRIPTION_EXPIRED with no action URL) opens
  // the membership on Billing, as mobile's opens the membership list; its
  // Renew button is the checkout, when it names one.
  if (
    (MEMBER_BILLING_NOTIFICATION_TYPES as readonly string[]).includes(type) ||
    input.metadata?.reason === RENEWAL_PAYMENT_DUE
  ) {
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
