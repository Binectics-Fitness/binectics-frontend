import { MembershipSubscriptionStatus } from "@/lib/types";
import {
  isEntitlingMembershipStatus,
  isSeatBearingMembershipStatus,
  type MembershipSubscription,
} from "@/lib/types";

/**
 * One description of every membership state — label, pill colours, and the two
 * facts the UI keeps getting wrong about it.
 *
 * It lives in one place because four surfaces render this pill (member billing,
 * gym overview, gym members, single member) and each had its own hand-written
 * Record. Three of them agreed and one didn't, and adding `paused`,
 * `suspended` and `past_due` to four separate maps is how they drift again.
 *
 * The two facts, kept separate on purpose:
 *
 *   - `hasAccess` — may this member get in? `active` and `past_due` only.
 *   - `bearsSeat` — does the org pay for them? every non-terminal state.
 *
 * A `past_due` member is the reason not to collapse those: they are in a grace
 * window, they still have access, and treating "not active" as "gone" tells the
 * gym their paying customer has churned and tells the member they have been
 * locked out. Neither is true.
 *
 * Pill colours are the design system's, not invented here:
 *   - active / paused / past-due: binectics-design-system/binectics/gym-members.html:85-87
 *   - pending (the `.status.new` treatment): gym-members.html:88
 *   - suspended (muted WITH a border, so it reads as imposed rather than
 *     chosen, and is distinguishable from paused): admin-users.html:62
 * gym-members.html:204-210 already carries "Paused" and "Past-due" filter
 * pills, so the roster's filter row is design-led rather than a new invention.
 */
export interface MembershipStatusMeta {
  /** Sentence-case label for a pill or a table cell. */
  label: string;
  color: string;
  background: string;
  /** Only `suspended` carries one — see above. */
  border?: string;
  /** True when the member may enter / book right now. */
  hasAccess: boolean;
  /** True when the subscription occupies a billable seat. */
  bearsSeat: boolean;
  /** One line the operator or member can act on. */
  hint: string;
}

export const MEMBERSHIP_STATUS_META: Record<
  MembershipSubscriptionStatus,
  MembershipStatusMeta
> = {
  [MembershipSubscriptionStatus.ACTIVE]: {
    label: "Active",
    color: "var(--signal-ink)",
    background: "var(--signal-soft)",
    hasAccess: true,
    bearsSeat: true,
    hint: "Paid and running.",
  },
  [MembershipSubscriptionStatus.PENDING_PAYMENT]: {
    label: "Pending payment",
    color: "oklch(0.42 0.13 75)",
    background: "var(--trainer-soft)",
    hasAccess: false,
    bearsSeat: true,
    hint: "Enrolled but not paid — no access until payment settles.",
  },
  [MembershipSubscriptionStatus.PAUSED]: {
    label: "Paused",
    color: "var(--fg-3)",
    background: "var(--bg-2)",
    hasAccess: false,
    bearsSeat: true,
    hint: "On their own break. Frozen days are credited back on resume, so they are coming back — not churned.",
  },
  [MembershipSubscriptionStatus.SUSPENDED]: {
    label: "Suspended",
    color: "var(--fg-3)",
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    hasAccess: false,
    bearsSeat: true,
    hint: "Blocked by the gym. Unlike a pause, the paid time keeps running down.",
  },
  [MembershipSubscriptionStatus.PAST_DUE]: {
    label: "Past due",
    color: "var(--danger)",
    background: "var(--danger-soft)",
    // Still has access — the grace window is the whole point of the state.
    hasAccess: true,
    bearsSeat: true,
    hint: "Renewal has not completed. Access continues until the grace window lapses.",
  },
  [MembershipSubscriptionStatus.EXPIRED]: {
    label: "Expired",
    color: "var(--fg-3)",
    background: "var(--bg-2)",
    hasAccess: false,
    bearsSeat: false,
    hint: "Term ended. Only a new payment revives it.",
  },
  [MembershipSubscriptionStatus.CANCELLED]: {
    label: "Cancelled",
    color: "var(--fg-3)",
    background: "var(--bg-2)",
    hasAccess: false,
    bearsSeat: false,
    hint: "Ended by the member or the gym.",
  },
};

/**
 * Meta for a status, tolerant of one the API adds before this repo knows it.
 *
 * The fallback is `expired`'s neutral pill with the raw value as its label,
 * rather than a crash or a blank cell: an unknown state is better shown as
 * itself than mislabelled as something the reader might act on.
 */
export function membershipStatusMeta(
  status: MembershipSubscriptionStatus | string | undefined,
): MembershipStatusMeta {
  const known = MEMBERSHIP_STATUS_META[status as MembershipSubscriptionStatus];
  if (known) return known;
  return {
    label: String(status ?? "Unknown"),
    color: "var(--fg-3)",
    background: "var(--bg-2)",
    hasAccess: isEntitlingMembershipStatus(status),
    bearsSeat: isSeatBearingMembershipStatus(status),
    hint: "Unrecognised status — refresh, or contact support if it persists.",
  };
}

/** The plan id a subscription points at, populated or not. */
export function subscriptionPlanId(
  sub: MembershipSubscription,
): string | null {
  if (typeof sub.plan_id === "string") return sub.plan_id;
  return sub.plan_id?._id ?? null;
}

/**
 * Members per plan, derived from the org's own subscriptions.
 *
 * This replaces `MembershipPlan.active_members`, a denormalised counter the API
 * deleted with no successor field. Deriving it needs no new endpoint — the
 * roster is already fetched (or one call away) on every surface that shows the
 * number — and it cannot drift from the subscriptions the way a counter can.
 *
 * Counts SEAT-BEARING subscriptions, not merely `active` ones. That is the
 * number the plan card means: a paused member is still on that plan, still
 * occupies a seat, and is still a reason not to delete the plan out from under
 * them. Terminal subscriptions (expired, cancelled) are excluded — those
 * members are gone, which is what the old counter also meant.
 */
export function countMembersByPlan(
  subs: readonly MembershipSubscription[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const sub of subs) {
    if (!isSeatBearingMembershipStatus(sub.status)) continue;
    const planId = subscriptionPlanId(sub);
    if (!planId) continue;
    counts.set(planId, (counts.get(planId) ?? 0) + 1);
  }
  return counts;
}

/**
 * The roster filter row, in the order gym-members.html:204-210 shows it: all,
 * then the states an operator acts on, then the terminal ones.
 */
export const MEMBERSHIP_STATUS_FILTER_ORDER: readonly MembershipSubscriptionStatus[] =
  [
    MembershipSubscriptionStatus.ACTIVE,
    MembershipSubscriptionStatus.PENDING_PAYMENT,
    MembershipSubscriptionStatus.PAST_DUE,
    MembershipSubscriptionStatus.PAUSED,
    MembershipSubscriptionStatus.SUSPENDED,
    MembershipSubscriptionStatus.EXPIRED,
    MembershipSubscriptionStatus.CANCELLED,
  ];
