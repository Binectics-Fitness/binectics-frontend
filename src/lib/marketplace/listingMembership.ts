/**
 * The plan choice and the member's membership on a provider's public profile.
 *
 * Ported from binectics-mobile src/utils/planChoice.ts (mobile PR #304):
 * heldPlanIds, isPurchasable, chosenPlan, membershipHere, membershipLine and
 * profileCta follow the same rules, so web and mobile agree on who is a
 * member here and what the buy area offers them. Keep the two in step.
 */

import {
  MembershipSubscriptionStatus,
  TERMINAL_MEMBERSHIP_STATUSES,
  isEntitlingMembershipStatus,
  type MembershipSubscription,
} from "@/lib/types";

export const PLAN_CHOICE_COPY = {
  checkout: "Continue to checkout →",
  currentPlan: "Your current plan",
  add: "Add",
  manage: "Manage membership",
  yourMembership: "Your membership",
  addHint: "Pick another plan to add it.",
} as const;

/** The fields of a public plan these rules read. */
export interface ChoicePlan {
  _id: string;
  name: string;
  is_self_serve?: boolean;
}

const idOf = (v: unknown): string | null => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "_id" in (v as Record<string, unknown>)) {
    const id = (v as { _id?: unknown })._id;
    return id ? String(id) : null;
  }
  return null;
};

/** Running, past due, paused or suspended: not waiting for a first payment, not ended. */
function isHeldStatus(status: MembershipSubscriptionStatus | string): boolean {
  return (
    status !== MembershipSubscriptionStatus.PENDING_PAYMENT &&
    !TERMINAL_MEMBERSHIP_STATUSES.includes(status as MembershipSubscriptionStatus)
  );
}

/**
 * The plan ids the member already holds: a membership still running, past
 * due, paused or suspended. One waiting for payment is not held (they may be
 * retrying), nor is one that ended.
 */
export function heldPlanIds(subs: readonly MembershipSubscription[] | null | undefined): Set<string> {
  const held = new Set<string>();
  for (const sub of subs ?? []) {
    const planId = idOf(sub.plan_id);
    if (planId && isHeldStatus(sub.status)) held.add(planId);
  }
  return held;
}

/** Payable in the app (not a negotiated, off-app plan) and not already theirs. */
export function isPurchasable(plan: ChoicePlan, held: Set<string>): boolean {
  return plan.is_self_serve !== false && !held.has(plan._id);
}

/**
 * The plan the buy button buys: the one picked, while it is still
 * purchasable. Without a pick, only a newcomer facing a single buyable plan
 * gets it ready (there is nothing to choose between). A member who already
 * holds one of this provider's plans never has another picked for them.
 * Never "the first plan", never "the cheapest".
 */
export function chosenPlan<P extends ChoicePlan>(plans: readonly P[], pickedId: string | null, held: Set<string>): P | undefined {
  const purchasable = plans.filter((p) => isPurchasable(p, held));
  const picked = pickedId ? purchasable.find((p) => p._id === pickedId) : undefined;
  if (picked) return picked;
  const holdsOneHere = plans.some((p) => held.has(p._id));
  return !holdsOneHere && purchasable.length === 1 ? purchasable[0] : undefined;
}

/**
 * The member's membership with this provider: one running, past due, paused
 * or suspended. Matched by the listing it was bought through, the listing
 * that renews it (a gym enrolment has none of its own), or the gym's
 * organization. One that opens the door wins over a paused or suspended one.
 */
export function membershipHere(
  subs: readonly MembershipSubscription[] | null | undefined,
  provider: { listingId?: string | null; organizationId?: string | null },
): MembershipSubscription | undefined {
  const { listingId, organizationId } = provider;
  const here = (subs ?? []).filter((s) => {
    if (!isHeldStatus(s.status)) return false;
    const byListing = !!listingId && (idOf(s.listing_id) === listingId || s.renewal_listing_id === listingId);
    const byOrg = !!organizationId && idOf(s.organization_id) === organizationId;
    return byListing || byOrg;
  });
  return here.find((s) => isEntitlingMembershipStatus(s.status)) ?? here[0];
}

const STATUS_LABELS: Record<string, string> = {
  [MembershipSubscriptionStatus.PAUSED]: "Paused",
  [MembershipSubscriptionStatus.SUSPENDED]: "Suspended",
  [MembershipSubscriptionStatus.PAST_DUE]: "Payment due",
};

const formatDay = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "All-Access Monthly · Active · renews 23 Dec 2026": the membership in one line. */
export function membershipLine(sub: MembershipSubscription, fmt: (d: string | Date) => string = formatDay): string {
  const plan = typeof sub.plan_id === "object" && sub.plan_id ? sub.plan_id : null;
  const name = plan?.name?.trim() || "Membership";
  if (sub.status !== MembershipSubscriptionStatus.ACTIVE) {
    return `${name} · ${STATUS_LABELS[sub.status] ?? String(sub.status).replace(/_/g, " ")}`;
  }
  const end = sub.end_date ? fmt(sub.end_date) : "";
  const renews = sub.auto_renew && !sub.cancel_requested_at && plan?.plan_type !== "one_time";
  return `${name} · ${end ? `Active · ${renews ? "renews" : "until"} ${end}` : "Active"}`;
}

/** Billing, opened at this membership. */
export const manageMembershipHref = (sub: MembershipSubscription) =>
  `/dashboard/member/billing?subscriptionId=${encodeURIComponent(sub._id)}`;

/** "Add · Day Pass · ₦5,000": a member buying a second plan here, not checking out a first. */
export function addPlanLabel(plan: ChoicePlan, price: string): string {
  return `${PLAN_CHOICE_COPY.add} · ${plan.name} · ${price}`;
}

/**
 * What the profile's buy area shows. A member sees their membership and
 * "Manage membership" first; another plan is something they add on purpose
 * ("Add · …"), never "Continue to checkout". A newcomer chooses: with several
 * plans nothing is picked. Nothing buyable: no buy button at all.
 */
export type ProfileCta<P extends ChoicePlan = ChoicePlan> =
  | { kind: "member"; membership: MembershipSubscription; add: P | undefined }
  | { kind: "choose" }
  | { kind: "checkout"; plan: P }
  | { kind: "none" };

export function profileCta<P extends ChoicePlan>(input: {
  membership: MembershipSubscription | undefined;
  selectedPlan: P | undefined;
  hasPurchasable: boolean;
}): ProfileCta<P> {
  if (input.membership) return { kind: "member", membership: input.membership, add: input.selectedPlan };
  if (!input.hasPurchasable) return { kind: "none" };
  return input.selectedPlan ? { kind: "checkout", plan: input.selectedPlan } : { kind: "choose" };
}
