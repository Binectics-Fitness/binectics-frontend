"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, ChevronRight, Dumbbell } from "lucide-react";
import { DSCard, IconTile, StatusPill } from "@/components/ds";
import { SessionLogCard } from "@/components/coachSessions/SessionLogCard";
import { coachSessionsService, type CoachSessionLog } from "@/lib/api/coachSessions";
import { ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { dayLabel, sessionLength, trainerRowMeta } from "@/lib/coachSessions/format";
import type { Tone } from "@/lib/ui/tones";

const ink = { color: "var(--ink)" } as const;
const muted = { color: "var(--fg-3)" } as const;

/** Rows shown before "All". */
export const ROWS_SHOWN = 4;

export const coachSessionsKey = (clientProfileId: string) => ["coach-sessions", clientProfileId] as const;

type Item =
  | { kind: "log"; id: string; at: string; log: CoachSessionLog }
  | { kind: "booking"; id: string; at: string; booking: ConsultationBooking };

const BOOKING_CHIP: Record<string, { label: string; tone: Tone }> = {
  [ConsultationBookingStatus.COMPLETED]: { label: "Done", tone: "neutral" },
  [ConsultationBookingStatus.NO_SHOW]: { label: "No-show", tone: "danger" },
  [ConsultationBookingStatus.CONFIRMED]: { label: "Open", tone: "warn" },
  [ConsultationBookingStatus.PENDING]: { label: "Awaiting payment", tone: "warn" },
  [ConsultationBookingStatus.CANCELLED]: { label: "Cancelled", tone: "neutral" },
};

/**
 * "Sessions" on the trainer's client page: ONE merged timeline (board
 * coach-session-canvas 09, WEB1, owner ruling 27 Nov 2026). A booking that
 * has a log shows as the log with its stats; a booking without one shows its
 * status (Done, No-show, Open) and opens the session; ad hoc logs sit in the
 * same list. "All" shows the rest. The open log expands below the list as a
 * read-only table. Live logging is on the phone.
 *
 * A failed log read says so and offers a retry; it never reads as "no
 * sessions".
 */
export function SessionLogsSection({
  clientProfileId,
  clientFirstName,
  bookings,
  now,
}: {
  clientProfileId: string;
  clientFirstName: string;
  /** This client's bookings with the trainer. Only ones that have started are listed. */
  bookings: ConsultationBooking[];
  /** Wall-clock ms, fixed when the page opened. */
  now: number;
}) {
  const query = useQuery({
    queryKey: coachSessionsKey(clientProfileId),
    queryFn: async () => {
      const res = await coachSessionsService.listForClient(clientProfileId, 50);
      if (!res.success) throw new Error(res.message ?? "Couldn't load session logs.");
      return (res.data?.items ?? []).filter((l) => l.status === "completed");
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const { prefs, fmtTime, fmtNumber } = useOrgFormat();
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const [all, setAll] = useState(false);

  const items = useMemo<Item[]>(() => {
    const logs = query.data ?? [];
    const logged = new Set(logs.map((l) => l.booking_id).filter(Boolean));
    const rows: Item[] = [
      ...logs.map((log): Item => ({ kind: "log", id: log.id, at: log.started_at, log })),
      ...bookings
        .filter((b) => Date.parse(b.startsAt) <= now && !logged.has(b.id))
        .map((booking): Item => ({ kind: "booking", id: booking.id, at: booking.startsAt, booking })),
    ];
    return rows.sort((a, b) => b.at.localeCompare(a.at));
  }, [query.data, bookings, now]);

  // The newest log is open until the trainer picks another (or closes it).
  const firstLog = items.find((i) => i.kind === "log");
  const openId = picked === undefined ? (firstLog?.id ?? null) : picked;
  const openLog = openId ? (items.find((i) => i.kind === "log" && i.id === openId) as Extract<Item, { kind: "log" }> | undefined) : undefined;
  const shown = all ? items : items.slice(0, ROWS_SHOWN);
  const typeNameFor = (bookingId: string | null) => (bookingId ? bookings.find((b) => b.id === bookingId)?.consultationTypeName : null);

  return (
    <section aria-labelledby="session-logs-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="session-logs-heading" className="text-[15px] font-medium" style={ink}>Sessions</h2>
        <span className="flex items-baseline gap-4">
          <span className="text-[12.5px]" style={muted}>Live logging is on the phone</span>
          {items.length > ROWS_SHOWN && (
            <button type="button" className="text-[12.5px] underline underline-offset-2" style={ink} aria-expanded={all} onClick={() => setAll((v) => !v)}>
              {all ? "Fewer" : "All"}
            </button>
          )}
        </span>
      </div>

      {query.isPending && (
        <div role="status" aria-label="Loading session logs" className="rounded-(--r-3)" style={{ background: "var(--bg-3)", height: 220 }} />
      )}

      {query.isError && (
        <DSCard className="px-4.5 py-4">
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px]" style={{ color: "var(--danger-ink)" }}>Couldn&apos;t load the session logs.</p>
            <button type="button" className="btn-ghost-v2 sm" onClick={() => void query.refetch()}>Try again</button>
          </div>
        </DSCard>
      )}

      {query.isSuccess && items.length === 0 && (
        <DSCard className="px-4.5 py-4">
          <p className="text-[13.5px]" style={muted}>{`No session logs with ${clientFirstName} yet. Logs are made in the coach app.`}</p>
        </DSCard>
      )}

      {query.isSuccess && items.length > 0 && (
        <DSCard>
          <ul>
            {shown.map((item, i) => {
              const border = { borderTop: i ? "1px solid var(--border)" : "none" };
              if (item.kind === "log") {
                const l = item.log;
                const open = openId === l.id;
                const when = [dayLabel(l.started_at, prefs.timeZone), l.booking_id ? fmtTime(l.started_at) : "ad hoc", sessionLength(l)].filter(Boolean).join(" · ");
                return (
                  <li key={item.id} style={border}>
                    <button
                      type="button"
                      className="flex w-full min-h-14 items-center gap-3 px-3.5 py-2.5 text-left"
                      aria-expanded={open}
                      aria-controls="open-session-log"
                      onClick={() => setPicked(open ? null : l.id)}
                    >
                      <IconTile icon={Dumbbell} tone="move" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium" style={ink}>{when}</span>
                        <span className="block text-[12px]" style={muted}>{trainerRowMeta(l, fmtNumber)}</span>
                      </span>
                      {open ? (
                        <ChevronDown size={14} aria-hidden="true" className="shrink-0" style={{ color: "var(--fg-4)" }} />
                      ) : (
                        <ChevronRight size={14} aria-hidden="true" className="shrink-0" style={{ color: "var(--fg-4)" }} />
                      )}
                    </button>
                  </li>
                );
              }
              const b = item.booking;
              const chip = BOOKING_CHIP[b.status] ?? { label: b.status, tone: "neutral" as Tone };
              const sub = [b.consultationTypeName, b.status === ConsultationBookingStatus.NO_SHOW ? null : "no log"].filter(Boolean).join(" · ");
              return (
                <li key={item.id} style={border}>
                  <Link href={`/dashboard/trainer/sessions/${b.id}`} className="flex min-h-14 items-center gap-3 px-3.5 py-2.5 hover:bg-[var(--bg-2)]">
                    <IconTile icon={CalendarDays} tone="neutral" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-medium" style={ink}>{`${dayLabel(b.startsAt, prefs.timeZone)} · ${fmtTime(b.startsAt)}`}</span>
                      {sub && <span className="block text-[12px]" style={muted}>{sub}</span>}
                    </span>
                    <StatusPill tone={chip.tone} label={chip.label} dot={false} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </DSCard>
      )}

      {openLog && (
        <div id="open-session-log">
          <SessionLogCard log={openLog.log} firstName={clientFirstName} typeName={typeNameFor(openLog.log.booking_id)} />
        </div>
      )}
    </section>
  );
}
