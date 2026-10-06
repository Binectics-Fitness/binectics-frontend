"use client";

/**
 * The body of a coach's Today page, shared by the trainer and dietitian
 * dashboards (each wraps it in its own shell). Follows the desktop coach
 * mock (DashboardMosaic) and dashboard-trainer.html: a "Today, {name}"
 * header, real KPIs, today's time-gutter schedule, what's coming up and the
 * active clients.
 *
 * Left out of the mock for want of data: slot utilisation, the 30-day
 * rating, the "forecast" and the per-row Check-in / Join buttons.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AsyncSpinner,
  BookingStatusBadge,
  DSCard,
  DSCardHead,
  DSStatCard,
  EmptySlate,
  Eyebrow,
  IconTile,
  ListRow,
  PageHeader,
} from "@/components/ds";
import type { TitleParts } from "@/components/ds";
import OnboardingBanner from "@/components/OnboardingBanner";
import { bookingPaymentState } from "@/lib/bookings/paymentState";
import { progressService, type ClientProfile } from "@/lib/api/progress";
import { consultationsService, type ConsultationBooking } from "@/lib/api/consultations";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { useClientNow } from "@/lib/ui/useClientNow";
import {
  bookingClientName,
  coachSchedule,
  durationMinutes,
  gapAnchors,
  initials,
  isLiveBooking,
} from "./coachSchedule";
import { ScheduleGap, ScheduleList, ScheduleRow } from "./ScheduleRow";
import { useSettledThisMonth } from "./useSettledThisMonth";

export interface CoachTodayProps {
  /** "session" for trainers, "consult" for dietitians. */
  noun: "session" | "consult";
  /** Where a session row opens; omit when the role has no detail page. */
  sessionHref?: (bookingId: string) => string;
  calendarHref: string;
  clientsHref: string;
  clientHref: (profileId: string) => string;
  /** Extra real KPI cards after the standard ones (the dietitian's practice stats). */
  extraStats?: ReactNode[];
}

function clientName(c: ClientProfile): string {
  if (typeof c.client_id === "object" && c.client_id !== null) {
    return `${c.client_id.first_name} ${c.client_id.last_name}`.trim();
  }
  return "Client";
}

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

/** lg column count for N cards: 3 or 4 per row, never a ragged 4+1. */
const GRID_COLS: Record<number, string> = {
  1: "lg:grid-cols-3",
  2: "lg:grid-cols-3",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-3",
  6: "lg:grid-cols-3",
};

export function CoachToday({
  noun,
  sessionHref,
  calendarHref,
  clientsHref,
  clientHref,
  extraStats = [],
}: CoachTodayProps) {
  const { user } = useAuth();
  const { fmtDate, fmtTime } = useOrgFormat();
  const today = useClientNow();
  const settled = useSettledThisMonth();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  // When the bookings were read: "still to come" is measured against it.
  const [loadedAt, setLoadedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const [clientsRes, bookingsRes] = await Promise.allSettled([
        progressService.getMyClientProfiles(),
        consultationsService.getProviderBookings(),
      ]);
      if (!active) return;

      let anyOk = false;
      if (clientsRes.status === "fulfilled" && clientsRes.value.success && clientsRes.value.data) {
        setClients(clientsRes.value.data);
        anyOk = true;
      }
      if (bookingsRes.status === "fulfilled" && bookingsRes.value.success && bookingsRes.value.data) {
        setBookings(bookingsRes.value.data);
        anyOk = true;
      }
      setLoadedAt(Date.now());
      setError(anyOk ? null : "We couldn't load your dashboard. Try again shortly.");
      setLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, []);

  const schedule = useMemo(
    () => (today && loadedAt ? coachSchedule(bookings, today, loadedAt) : null),
    [bookings, today, loadedAt],
  );
  const gaps = useMemo(() => (schedule ? gapAnchors(schedule.today) : new Map()), [schedule]);
  const activeClients = useMemo(() => clients.filter((c) => c.is_active), [clients]);

  const first = user?.first_name?.trim().split(/\s+/)[0];
  const title: TitleParts = first ? { before: "Today, ", emphasis: first } : { emphasis: "Today" };
  const nouns = noun === "session" ? "sessions" : "consults";
  const Noun = noun === "session" ? "Session" : "Consult";

  const next = schedule?.upcoming[0];
  const stats: ReactNode[] = schedule
    ? [
        <DSStatCard
          key="today"
          label={`${Noun}s · today`}
          value={schedule.liveToday}
          delta={schedule.liveToday === 0 ? "Nothing scheduled" : `${schedule.stillToCome} still to come`}
        />,
        <DSStatCard key="clients" label="Active clients" value={activeClients.length} delta={`${clients.length} total`} />,
        <DSStatCard
          key="upcoming"
          label={`Upcoming ${nouns}`}
          value={schedule.upcoming.length}
          delta={next ? `Next ${fmtDate(next.startsAt)} · ${fmtTime(next.startsAt)}` : "None scheduled"}
        />,
        ...(settled != null
          ? [<DSStatCard key="earnings" label="Earnings · this month" value={settled} delta="Settled" />]
          : []),
        ...extraStats,
      ]
    : [];

  return (
    <>
      <OnboardingBanner />

      {/* The shell's <main> already spaces its children (gap-5). */}
      <PageHeader
        className="mb-0!"
        eyebrow={today ? format(today, "EEEE · d MMM") : undefined}
        title={title}
        subtitle={
          schedule
            ? `${plural(schedule.liveToday, noun)} today · ${plural(activeClients.length, "active client")}`
            : undefined
        }
      />

      {error ? (
        <div
          role="alert"
          className="rounded-(--r-3) p-4 text-[13px]"
          style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}
        >
          <div className="font-medium">Couldn&apos;t load dashboard</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      ) : null}

      {(loading && clients.length === 0 && bookings.length === 0) || !schedule ? (
        <AsyncSpinner size="page" label="Loading your dashboard" />
      ) : (
        <>
          <div className={`grid grid-cols-2 gap-3 ${GRID_COLS[stats.length] ?? "lg:grid-cols-4"}`}>{stats}</div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3 items-start">
            <div className="flex flex-col gap-3 min-w-0">
              <DSCard>
                <DSCardHead
                  title="Today's schedule"
                  subtitle={
                    schedule.today.length === 0
                      ? `No ${nouns} today`
                      : [
                          plural(schedule.liveToday, noun),
                          schedule.today.length > schedule.liveToday
                            ? `${schedule.today.length - schedule.liveToday} cancelled or missed`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                  }
                  action={
                    <Link href={calendarHref} className="text-[12.5px] whitespace-nowrap" style={{ color: "var(--fg-2)" }}>
                      Open calendar →
                    </Link>
                  }
                />
                {schedule.today.length === 0 ? (
                  <div className="px-4.5 py-4">
                    <EmptySlate
                      message="Nothing on today."
                      hint={next ? `Your next ${noun} is ${fmtDate(next.startsAt)} at ${fmtTime(next.startsAt)}.` : "New bookings will show up here."}
                      mt="mt-0"
                    />
                  </div>
                ) : (
                  <ScheduleList label={`Today's ${nouns}`}>
                    {schedule.today.map((b) => {
                      const name = bookingClientName(b);
                      const gap = gaps.get(b.id);
                      return (
                        <ScheduleRowWithGap
                          key={b.id}
                          booking={b}
                          name={name}
                          time={fmtTime(b.startsAt)}
                          href={sessionHref?.(b.id)}
                          gapLabel={gap ? `${fmtTime(gap.from)} – ${fmtTime(gap.to)} · ${gap.minutes} min` : undefined}
                        />
                      );
                    })}
                  </ScheduleList>
                )}
              </DSCard>

              {schedule.later.length > 0 && (
                <DSCard>
                  <DSCardHead title="Coming up" subtitle={`Next ${plural(Math.min(schedule.later.length, 8), noun)} after today`} />
                  <ScheduleList label={`Upcoming ${nouns}`}>
                    {schedule.later.slice(0, 8).map((b) => (
                      <ScheduleRowWithGap
                        key={b.id}
                        booking={b}
                        name={bookingClientName(b)}
                        time={fmtTime(b.startsAt)}
                        timeSub={fmtDate(b.startsAt)}
                        href={sessionHref?.(b.id)}
                      />
                    ))}
                  </ScheduleList>
                </DSCard>
              )}
            </div>

            <section aria-labelledby="coach-active-clients" className="flex flex-col gap-2 min-w-0">
              <div className="flex items-baseline justify-between px-0.5">
                <Eyebrow as="h2" id="coach-active-clients">
                  Active clients · {activeClients.length}
                </Eyebrow>
                <Link href={clientsHref} className="text-[12.5px]" style={{ color: "var(--fg-2)" }}>
                  All clients →
                </Link>
              </div>
              {activeClients.length === 0 ? (
                <DSCard>
                  <div className="px-4.5 py-4">
                    <EmptySlate message="No active clients yet." mt="mt-0" />
                  </div>
                </DSCard>
              ) : (
                activeClients.slice(0, 6).map((c) => {
                  const name = clientName(c);
                  return (
                    <ListRow
                      key={c._id}
                      href={clientHref(c._id)}
                      leading={<IconTile initials={initials(name)} size="sm" />}
                      title={name}
                      meta={c.goals?.length ? c.goals.slice(0, 2).join(" · ") : `Since ${format(new Date(c.created_at), "MMM yyyy")}`}
                    />
                  );
                })
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}

function ScheduleRowWithGap({
  booking,
  name,
  time,
  timeSub,
  href,
  gapLabel,
}: {
  booking: ConsultationBooking;
  name: string;
  time: string;
  timeSub?: string;
  href?: string;
  gapLabel?: string;
}) {
  const live = isLiveBooking(booking);
  const meta = [booking.consultationTypeName, `${durationMinutes(booking)} min`, booking.notes].filter(Boolean).join(" · ");
  return (
    <>
      <ScheduleRow
        time={time}
        timeSub={timeSub}
        title={name}
        meta={meta}
        leading={<IconTile initials={initials(name)} size="sm" />}
        trailing={
          <BookingStatusBadge
            status={booking.status}
            awaitingPayment={bookingPaymentState(booking) === "awaiting_payment"}
          />
        }
        muted={!live}
        href={href}
      />
      {gapLabel && <ScheduleGap label={gapLabel} />}
    </>
  );
}
