import {
  MembershipSubscriptionStatus,
  isEntitlingMembershipStatus,
  type MembershipSubscription,
} from "@/lib/types";

/**
 * Pause (the member's own break) and suspend (the gym's block), as the API
 * decides them (marketplace.service.ts, SEAT_MODEL.md §4.9). Pure functions so
 * every state can be tested without a page.
 *
 * - Pause: the member, or the gym for them (api #282), from `active` while
 *   the term is still running. Access stops; the days are credited back on
 *   resume, so `end_date` moves later by exactly how long the pause lasted.
 *   Either side may resume it, whoever started it. Auto-renew stays on but
 *   nothing is charged while paused. No limit on length or how often.
 * - Suspend: the gym only, from `active` or `past_due`. Access stops; the
 *   days are NOT credited back. A saved-card auto-renew is switched off.
 * - Both keep the member's seat, and neither cancels bookings already made.
 */

const DAY_MS = 86_400_000;

const time = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
};

/** The member (or the gym, for them) may pause: active, with a term that hasn't ended. */
export function canPause(sub: MembershipSubscription, now: Date = new Date()): boolean {
  if (sub.status !== MembershipSubscriptionStatus.ACTIVE) return false;
  const end = time(sub.end_date);
  return end === null || end >= now.getTime();
}

/** Either side resumes a pause, whoever started it. */
export function canResume(sub: MembershipSubscription): boolean {
  return sub.status === MembershipSubscriptionStatus.PAUSED;
}

/** The gym may suspend: active or past due. */
export function canSuspend(sub: MembershipSubscription): boolean {
  return (
    sub.status === MembershipSubscriptionStatus.ACTIVE ||
    sub.status === MembershipSubscriptionStatus.PAST_DUE
  );
}

export function canUnsuspend(sub: MembershipSubscription): boolean {
  return sub.status === MembershipSubscriptionStatus.SUSPENDED;
}

/** Whole days paused so far (0 on the first day). */
export function daysPaused(sub: MembershipSubscription, now: Date = new Date()): number {
  const since = time(sub.paused_at);
  if (since === null) return 0;
  return Math.max(0, Math.floor((now.getTime() - since) / DAY_MS));
}

/**
 * When the membership would end if it were resumed at `now`: the end date
 * plus the time paused so far, which is exactly what resume credits. Null
 * when there is no end date or the row isn't paused.
 */
export function endIfResumedAt(sub: MembershipSubscription, now: Date = new Date()): Date | null {
  if (sub.status !== MembershipSubscriptionStatus.PAUSED) return null;
  const end = time(sub.end_date);
  if (end === null) return null;
  const since = time(sub.paused_at);
  const frozen = since === null ? 0 : Math.max(0, now.getTime() - since);
  return new Date(end + frozen);
}

/** The card renews this membership automatically. */
export function renewsByCard(sub: MembershipSubscription): boolean {
  return sub.auto_renew && sub.collection_method === "card_auto";
}

/** The gym's (or provider's) name as the member knows it. */
export function providerNameOf(sub: MembershipSubscription): string {
  if (typeof sub.organization_id === "object" && sub.organization_id?.name) {
    return sub.organization_id.name;
  }
  if (typeof sub.listing_id === "object" && sub.listing_id?.headline) {
    return sub.listing_id.headline;
  }
  return "your gym";
}

/** What pausing will do, for the confirm dialog, in order. */
export function pauseEffectLines(
  sub: MembershipSubscription,
  fmt: (d: string | Date) => string,
): string[] {
  const lines = [
    "Your membership pauses today. You can't check in or book classes while it's paused.",
    sub.end_date
      ? `It's due to end on ${fmt(sub.end_date)}. That date moves later by the days you're paused.`
      : "The days you're paused are credited back when you resume.",
  ];
  if (renewsByCard(sub)) {
    lines.push("Auto-renew won't charge your card while paused. It carries on for the new end date once you resume.");
  }
  lines.push("Resume it here any time.");
  return lines;
}

/** The gym started this pause. Older pauses carry no paused_by: the member's. */
export function pausedByGym(sub: MembershipSubscription): boolean {
  return sub.paused_by === "gym";
}

/**
 * One line for a paused row: who paused it and since when, and the end date
 * if resumed now. `who` is the reader: the member, or the gym.
 */
export function pausedLine(
  sub: MembershipSubscription,
  fmt: (d: string | Date) => string,
  now: Date = new Date(),
  who: "member" | "gym" = "member",
): string {
  const head =
    who === "gym"
      ? pausedByGym(sub)
        ? "Paused by the gym"
        : "Paused by the member"
      : pausedByGym(sub)
        ? `Paused by ${providerNameOf(sub)}`
        : "Paused";
  const since = sub.paused_at ? `${head} since ${fmt(sub.paused_at)}` : head;
  const days = daysPaused(sub, now);
  const span = sub.paused_at ? ` (${days} day${days === 1 ? "" : "s"})` : "";
  const end = endIfResumedAt(sub, now);
  const endPart = end
    ? who === "member"
      ? `. Resume today and it runs to ${fmt(end)}.`
      : `. Ends ${fmt(end)} if it resumes today.`
    : ".";
  return `${since}${span}${endPart}`;
}

/** One line for a suspended row, for the member. */
export function suspendedLine(sub: MembershipSubscription, fmt: (d: string | Date) => string): string {
  const gym = providerNameOf(sub);
  const when = sub.suspended_at ? ` on ${fmt(sub.suspended_at)}` : "";
  const reason = sub.suspension_reason?.trim();
  return reason
    ? `${gym} suspended this membership${when}: “${reason}”. Contact ${gym} to restore your access.`
    : `${gym} suspended this membership${when}. Contact ${gym} to find out why and restore your access.`;
}

/** Whether a populated or bare id reference points at `id`. */
const refIs = (ref: unknown, id: string | null | undefined): boolean => {
  if (!id || ref == null) return false;
  if (typeof ref === "string") return ref === id;
  return String((ref as { _id?: unknown })._id) === id;
};

export interface MembershipHold {
  kind: "paused" | "suspended";
  sub: MembershipSubscription;
}

/**
 * Why the door said no at this gym, when it is a hold: the member has no
 * membership there that gets them in, and has a paused or suspended one.
 * Null when there is no hold to explain (no membership at all, or one that
 * does get them in, so the refusal was about something else).
 *
 * The gym is matched by organization id or listing id: the check-in QR
 * carries the org (or a legacy listing), the class booking a listing.
 */
export function holdAtGym(
  subs: readonly MembershipSubscription[],
  gym: { organizationId?: string | null; listingId?: string | null },
): MembershipHold | null {
  const here = subs.filter(
    (s) =>
      refIs(s.organization_id, gym.organizationId) ||
      refIs(s.listing_id, gym.listingId) ||
      // A legacy QR carries a listing id where the org id would be.
      refIs(s.listing_id, gym.organizationId),
  );
  if (here.some((s) => isEntitlingMembershipStatus(s.status))) return null;
  const suspended = here.find((s) => s.status === MembershipSubscriptionStatus.SUSPENDED);
  if (suspended) return { kind: "suspended", sub: suspended };
  const paused = here.find((s) => s.status === MembershipSubscriptionStatus.PAUSED);
  if (paused) return { kind: "paused", sub: paused };
  return null;
}

/** Title and body for a refused check-in or booking caused by a hold. */
export function holdRefusalCopy(
  hold: MembershipHold,
  fmt: (d: string | Date) => string,
  action: "check in" | "book classes",
): { title: string; body: string } {
  if (hold.kind === "suspended") {
    return { title: "Your membership is suspended.", body: suspendedLine(hold.sub, fmt) };
  }
  const end = endIfResumedAt(hold.sub);
  return {
    title: "Your membership is paused.",
    body: `${pausedByGym(hold.sub) ? `${providerNameOf(hold.sub)} paused it` : "You paused it"}${hold.sub.paused_at ? ` on ${fmt(hold.sub.paused_at)}` : ""}, so you can't ${action} at ${providerNameOf(hold.sub)} until you resume it.${end ? ` Resume today and it runs to ${fmt(end)}.` : ""}`,
  };
}
