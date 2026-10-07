/**
 * Pure derivations for the member home (src/app/dashboard/member/page.tsx).
 * Every number they return comes from an API record; when the records can't
 * support a figure (one weight log, no bookings) they return null and the
 * page leaves that element out instead of inventing one.
 */
import { ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";
import type { ClassBooking } from "@/lib/api/classBookings";
import type { WeightLog } from "@/lib/api/progress";
import { MembershipSubscriptionStatus, type MembershipSubscription } from "@/lib/types";

const DAY_MS = 86_400_000;

/**
 * The gyms this member can check in at: one entry per ACTIVE, unexpired
 * membership whose organization came back populated. Enrolled members have
 * no listing on their subscription, so the org is the only gym identity.
 */
export function activeGyms(subs: MembershipSubscription[], now: number): { orgId: string; name: string }[] {
  const seen = new Set<string>();
  const gyms: { orgId: string; name: string }[] = [];
  for (const sub of subs) {
    if (sub.status !== MembershipSubscriptionStatus.ACTIVE) continue;
    if (sub.end_date && new Date(sub.end_date).getTime() < now) continue;
    const org = sub.organization_id;
    if (!org || typeof org !== "object" || !org._id) continue;
    if (seen.has(org._id)) continue;
    seen.add(org._id);
    gyms.push({ orgId: org._id, name: org.name || "My gym" });
  }
  return gyms;
}

/** "Wed 8 Oct" */
function shortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function clock(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export interface NextUpItem {
  kind: "consultation" | "class";
  id: string;
  /** Start, for ordering. */
  at: number;
  title: string;
  /** Mono meta line, e.g. "Wed 8 Oct · 08:30 · 45 min". */
  meta: string;
  /** The consultation, for its payment/status pill. */
  booking?: ConsultationBooking;
}

function consultationItem(b: ConsultationBooking): NextUpItem | null {
  const start = new Date(b.startsAt);
  const end = new Date(b.endsAt);
  if (Number.isNaN(start.getTime())) return null;
  const minutes = Number.isNaN(end.getTime()) ? null : Math.round((end.getTime() - start.getTime()) / 60000);
  return {
    kind: "consultation",
    id: b.id,
    at: start.getTime(),
    // The list read doesn't carry the provider's name, so the session type
    // is the title; nothing is guessed.
    title: b.consultationTypeName || "Consultation",
    meta: [shortDate(start), clock(start), minutes && minutes > 0 ? `${minutes} min` : null]
      .filter(Boolean)
      .join(" · "),
    booking: b,
  };
}

function classItem(b: ClassBooking): NextUpItem | null {
  const c = typeof b.class_id === "object" ? b.class_id : null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b.booking_date);
  if (!m) return null;
  const [hh, mm] = (c?.start_time ?? "00:00").split(":").map(Number);
  // booking_date + start_time are the gym's wall clock. Read as the viewer's
  // local time, which is right whenever the member is in the gym's zone (the
  // usual case); it is only used to order rows, and the row shows the gym's
  // own "HH:mm" rather than a converted time.
  const start = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hh || 0, mm || 0);
  return {
    kind: "class",
    id: b._id,
    at: start.getTime(),
    title: c?.name ?? "Class",
    meta: [
      shortDate(start),
      c?.start_time ?? null,
      c?.duration_minutes ? `${c.duration_minutes} min` : null,
      c?.instructor_name ?? null,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

/**
 * The soonest thing the member has booked: a confirmed or held consultation,
 * or a confirmed gym class (a waitlist place isn't a plan yet). Anything that
 * already started is skipped.
 */
export function nextUp(
  consultations: readonly ConsultationBooking[],
  classes: readonly ClassBooking[],
  now: number,
): NextUpItem | null {
  const items: NextUpItem[] = [];
  for (const b of consultations) {
    if (b.status !== ConsultationBookingStatus.CONFIRMED && b.status !== ConsultationBookingStatus.PENDING) continue;
    const item = consultationItem(b);
    if (item) items.push(item);
  }
  for (const b of classes) {
    if (b.status !== "confirmed") continue;
    const item = classItem(b);
    if (item) items.push(item);
  }
  return items.filter((i) => i.at >= now).sort((a, b) => a.at - b.at)[0] ?? null;
}

export interface WeightSummary {
  kg: number;
  /** "↓ 1.8 kg since 6 Sep" with ≥2 logs in the last 30 days, else "Logged 2 Oct". */
  delta: string;
}

function kg(n: number): string {
  return String(Math.round(n * 10) / 10);
}

/**
 * The latest weight and, only when there are two or more logs in the last 30
 * days, the change since the oldest of them. The change is labelled with its
 * real start date, and the caller shows it in a neutral colour: down is not
 * good for everyone.
 */
export function weightSummary(logs: readonly WeightLog[], now: number): WeightSummary | null {
  const dated = logs
    .map((l) => ({ kg: l.weight_kg, at: new Date(l.recorded_at).getTime() }))
    .filter((l) => Number.isFinite(l.kg) && Number.isFinite(l.at))
    .sort((a, b) => b.at - a.at);
  const latest = dated[0];
  if (!latest) return null;
  const window = dated.filter((l) => l.at >= now - 30 * DAY_MS);
  const since = window.length >= 2 ? window[window.length - 1] : null;
  const sinceDate = (at: number) => new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  if (!since || latest === since) {
    return { kg: latest.kg, delta: `Logged ${sinceDate(latest.at)}` };
  }
  const diff = Math.round((latest.kg - since.kg) * 10) / 10;
  const change = diff === 0 ? "No change" : `${diff < 0 ? "↓" : "↑"} ${kg(Math.abs(diff))} kg`;
  return { kg: latest.kg, delta: `${change} since ${sinceDate(since.at)}` };
}

/** "Today", "Yesterday", "3 days ago", "2 Oct"; by local calendar day. */
export function lastCheckInLabel(iso: string | undefined, now: Date): string {
  if (!iso) return "No check-ins yet";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "No check-ins yet";
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
