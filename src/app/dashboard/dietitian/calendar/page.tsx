"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { AsyncSpinner, EmptySlate, ActionModal } from "@/components/ds";
import { toast } from "@/components/Toast";
import {
  consultationsService,
  ConsultationBookingStatus,
  AvailabilityExceptionType,
  type ConsultationBooking,
  type AvailabilityRule,
  type AvailabilityException,
} from "@/lib/api/consultations";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  startOfWeek,
  addDays,
  localIsoDate,
  buildWeekBuckets,
  hoursSinceMidnight,
} from "./weekGrid";

/* ─── Grid geometry ─────────────────────────────────────── */

const GRID_START_HOUR = 6;
const GRID_END_HOUR = 20; // exclusive — last row is 19:00–20:00
const ROW_H = 56; // px per hour (matches h-14)
const HOURS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR },
  (_, i) => `${String(GRID_START_HOUR + i).padStart(2, "0")}:00`,
);

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  [ConsultationBookingStatus.CONFIRMED]: { bg: "var(--signal-soft)", color: "var(--signal-ink)", label: "Confirmed" },
  [ConsultationBookingStatus.PENDING]: { bg: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)", label: "Pending" },
  [ConsultationBookingStatus.COMPLETED]: { bg: "var(--bg-3)", color: "var(--fg-2)", label: "Completed" },
  [ConsultationBookingStatus.CANCELLED]: { bg: "var(--danger-soft)", color: "var(--danger)", label: "Cancelled" },
  [ConsultationBookingStatus.NO_SHOW]: { bg: "var(--danger-soft)", color: "var(--danger)", label: "No-show" },
};

function bookingClientName(b: ConsultationBooking): string {
  const name = [b.clientFirstName, b.clientLastName].filter(Boolean).join(" ");
  return name || "Client";
}

/** Vertical placement for a booking block, clamped to the visible hours. */
function blockGeometry(b: ConsultationBooking): { top: number; height: number } | null {
  const startH = hoursSinceMidnight(b.startsAt);
  const endH = Math.max(startH + 0.25, hoursSinceMidnight(b.endsAt));
  if (endH <= GRID_START_HOUR || startH >= GRID_END_HOUR) return null; // outside the window
  const top = Math.max(0, (startH - GRID_START_HOUR) * ROW_H);
  const bottom = Math.min((GRID_END_HOUR - GRID_START_HOUR) * ROW_H, (endH - GRID_START_HOUR) * ROW_H);
  return { top, height: Math.max(18, bottom - top) };
}

/* ─── Page ───────────────────────────────────────────────── */

export default function DietitianCalendarPage() {
  const { fmtDate, fmtTime, weekStartsOn } = useOrgFormat();

  const [anchor, setAnchor] = useState(() => new Date());
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const weekStart = useMemo(() => startOfWeek(anchor, weekStartsOn), [anchor, weekStartsOn]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  // ── Bookings for the visible week ──────────────────────────
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingBookings(true);
      try {
        // Real instants, not date-only strings: the backend parses dates
        // with new Date(), so "2026-08-02" means midnight UTC — which
        // silently dropped every booking later on the week's last day
        // (and the first hours of day 1 in UTC+ timezones).
        // buildWeekBuckets discards out-of-week rows, so the window can
        // safely cover the full local week.
        const res = await consultationsService.getProviderBookings({
          from: weekStart.toISOString(),
          to: addDays(weekStart, 7).toISOString(),
        });
        if (!mounted) return;
        if (res.success && res.data) {
          setBookings(res.data);
          setBookingsError(null);
        } else {
          setBookingsError(res.message ?? "We couldn't load this week's bookings.");
        }
      } catch {
        if (mounted) setBookingsError("We couldn't load this week's bookings.");
      }
      if (mounted) setLoadingBookings(false);
    };
    const kick = window.setTimeout(() => void load(), 0);
    return () => {
      mounted = false;
      window.clearTimeout(kick);
    };
  }, [weekStart, weekEnd]);

  // ── Availability rules + exceptions ────────────────────────
  const loadSchedule = useCallback(async () => {
    const [rulesRes, excRes] = await Promise.allSettled([
      consultationsService.getMyAvailability(),
      consultationsService.getMyExceptions(),
    ]);
    let anyOk = false;
    if (rulesRes.status === "fulfilled" && rulesRes.value.success && rulesRes.value.data) {
      setRules(rulesRes.value.data);
      anyOk = true;
    }
    if (excRes.status === "fulfilled" && excRes.value.success && excRes.value.data) {
      setExceptions(excRes.value.data);
      anyOk = true;
    }
    setScheduleError(anyOk ? null : "We couldn't load your availability.");
  }, []);

  useEffect(() => {
    const kick = window.setTimeout(() => void loadSchedule(), 0);
    return () => window.clearTimeout(kick);
  }, [loadSchedule]);

  // ── Derived ────────────────────────────────────────────────
  const buckets = useMemo(
    () => buildWeekBuckets(bookings, anchor, weekStartsOn),
    [bookings, anchor, weekStartsOn],
  );

  const exceptionsByDate = useMemo(() => {
    const map = new Map<string, AvailabilityException[]>();
    for (const exc of exceptions) {
      const key = exc.date.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), exc]);
    }
    return map;
  }, [exceptions]);

  const rulesByDow = useMemo(() => {
    const map = new Map<number, AvailabilityRule[]>();
    for (const rule of rules.filter((r) => r.isActive)) {
      map.set(rule.dayOfWeek, [...(map.get(rule.dayOfWeek) ?? []), rule]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [rules]);

  const todayIso = localIsoDate(new Date());

  const stats = useMemo(() => {
    const upcoming = bookings.filter(
      (b) =>
        b.status === ConsultationBookingStatus.PENDING ||
        b.status === ConsultationBookingStatus.CONFIRMED,
    );
    const completed = bookings.filter((b) => b.status === ConsultationBookingStatus.COMPLETED);
    const totalMinutes = completed.reduce((sum, b) => {
      return sum + Math.max(0, Math.round((new Date(b.endsAt).getTime() - new Date(b.startsAt).getTime()) / 60000));
    }, 0);
    const noShows = bookings.filter((b) => b.status === ConsultationBookingStatus.NO_SHOW).length;

    return [
      { label: "Sessions", value: String(bookings.length), delta: `${upcoming.length} upcoming` },
      { label: "Completed", value: String(completed.length), delta: "This week" },
      { label: "No-shows", value: String(noShows), delta: noShows > 0 ? "Follow up needed" : "None" },
      { label: "Hours coached", value: (totalMinutes / 60).toFixed(1), delta: "Completed sessions" },
    ];
  }, [bookings]);

  const upcomingToday = useMemo(() => {
    const today = new Date().toDateString();
    return bookings
      .filter((b) => new Date(b.startsAt).toDateString() === today)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, 4);
  }, [bookings]);

  // The bookings state only holds the VISIBLE week — when the user pages
  // to another week, "today's bookings" would falsely read as empty.
  const todayInVisibleWeek = useMemo(() => {
    const today = new Date();
    return today >= weekStart && today < addDays(weekStart, 7);
  }, [weekStart]);

  const upcomingExceptions = useMemo(() => {
    return [...exceptions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter((e) => e.date.slice(0, 10) >= todayIso)
      .slice(0, 8);
  }, [exceptions, todayIso]);

  // ── Block-off modal ────────────────────────────────────────
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(todayIso);
  const [blockAllDay, setBlockAllDay] = useState(true);
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("12:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockBusy, setBlockBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openBlockModal = () => {
    setBlockDate(todayIso);
    setBlockAllDay(true);
    setBlockStart("09:00");
    setBlockEnd("12:00");
    setBlockReason("");
    setBlockOpen(true);
  };

  const submitBlock = async () => {
    if (!blockDate) {
      toast.error("Pick a date to block off.");
      return;
    }
    if (!blockAllDay && blockEnd <= blockStart) {
      toast.error("End time must be after the start time.");
      return;
    }
    setBlockBusy(true);
    try {
      const res = await consultationsService.createException({
        date: blockDate,
        type: blockAllDay ? AvailabilityExceptionType.UNAVAILABLE : AvailabilityExceptionType.CUSTOM_HOURS,
        ...(blockAllDay
          ? {}
          : {
              startTime: blockStart,
              endTime: blockEnd,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }),
        reason: blockReason.trim() || undefined,
      });
      if (res.success) {
        toast.success(blockAllDay ? "Day blocked off." : "Custom hours saved.");
        setBlockOpen(false);
        await loadSchedule();
      } else {
        toast.error(res.message ?? "Couldn't block that time off.");
      }
    } catch {
      toast.error("Couldn't block that time off.");
    }
    setBlockBusy(false);
  };

  const removeException = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await consultationsService.deleteException(id);
      if (res.success) {
        toast.success("Blocked time removed.");
        await loadSchedule();
      } else {
        toast.error(res.message ?? "Couldn't remove that block.");
      }
    } catch {
      toast.error("Couldn't remove that block.");
    }
    setDeletingId(null);
  };

  // Ordered day indexes for the working-hours panel (respects week start).
  const orderedDows = useMemo(
    () => Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7),
    [weekStartsOn],
  );

  return (
    <DietitianDashboardShell activeItem="Calendar" crumb="Calendar">
      {/* Calendar header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex items-center gap-3.5 flex-wrap">
          <h1 className="text-[22px] font-medium tracking-[-0.018em]" style={{ color: "var(--ink)" }}>
            {fmtDate(weekStart)} <span className="font-normal" style={{ color: "var(--fg-3)" }}>&ndash; {fmtDate(weekEnd)}</span>
          </h1>
          <div className="inline-flex rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
            <button
              aria-label="Previous week"
              onClick={() => setAnchor((a) => addDays(a, -7))}
              className="w-7 h-7 flex items-center justify-center cursor-pointer"
              style={{ background: "var(--bg)", border: "none", borderRight: "1px solid var(--border)", color: "var(--fg-2)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              aria-label="Next week"
              onClick={() => setAnchor((a) => addDays(a, 7))}
              className="w-7 h-7 flex items-center justify-center cursor-pointer"
              style={{ background: "var(--bg)", border: "none", color: "var(--fg-2)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
          <button
            onClick={() => setAnchor(new Date())}
            className="h-7 px-3 font-mono text-[11px] uppercase tracking-[0.04em] rounded-(--r-2) cursor-pointer"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
          >
            Today
          </button>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
            Clients book from your{" "}
            <Link href="/dashboard/dietitian/profile" className="underline" style={{ color: "var(--ink)" }}>marketplace listing</Link>
          </span>
          <button
            onClick={openBlockModal}
            className="px-3.5 py-1.5 rounded-(--r-2) text-[13px] cursor-pointer"
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}
          >
            Block off
          </button>
        </div>
      </div>

      {bookingsError && (
        <div className="rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
          {bookingsError}
        </div>
      )}

      {/* Today's bookings — only when today is actually on screen */}
      {todayInVisibleWeek && (
      <div className="rounded-(--r-3) p-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          {loadingBookings ? "Loading today's bookings..." : "Today's bookings"}
        </div>
        <div className="mt-2.5 grid gap-2">
          {upcomingToday.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between rounded-(--r-2) px-3 py-2" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <span className="font-mono text-[12px]" style={{ color: "var(--ink)" }}>
                {fmtTime(booking.startsAt)}
              </span>
              <span className="text-[12.5px]" style={{ color: "var(--fg-2)" }}>
                {bookingClientName(booking)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: STATUS_COLORS[booking.status]?.color ?? "var(--signal-ink)" }}>
                {booking.status.toLowerCase().replace("_", " ")}
              </span>
            </div>
          ))}
          {!loadingBookings && upcomingToday.length === 0 && (
            <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              No bookings scheduled for today.
            </div>
          )}
        </div>
      </div>
      )}

      {/* Week grid */}
      <div className="rounded-(--r-3) overflow-x-auto" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {/* Days header row */}
        <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "64px repeat(7, 1fr)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ borderRight: "1px solid var(--border)" }} />
          {buckets.map((day) => {
            const isToday = day.iso === todayIso;
            const count = day.bookings.length;
            return (
              <div key={day.iso} className="px-3 py-2.5 flex flex-col gap-0.5" style={{ borderRight: "1px solid var(--border)" }}>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: isToday ? "var(--ink)" : "var(--fg-3)" }}>{DOW[day.date.getDay()]}</div>
                <div className="text-[18px] font-medium tracking-[-0.022em] tabular-nums leading-none" style={{ color: "var(--ink)" }}>
                  {isToday
                    ? <span className="px-1.5 py-0.5 rounded-[4px]" style={{ background: "var(--ink)", color: "var(--bg)" }}>{day.date.getDate()}</span>
                    : day.date.getDate()}
                </div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-4)" }}>
                  {count === 0 ? "-" : `${count} session${count === 1 ? "" : "s"}`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hour grid */}
        {loadingBookings && bookings.length === 0 ? (
          <AsyncSpinner size="page" label="Loading this week's bookings" />
        ) : (
          <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
            {/* Hour column */}
            <div style={{ borderRight: "1px solid var(--border)" }}>
              {HOURS.map((h) => (
                <div key={h} className="h-14 relative" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="absolute -top-2 right-2 font-mono text-[10px] px-1" style={{ color: "var(--fg-3)", background: "var(--bg)" }}>{h}</span>
                </div>
              ))}
            </div>
            {/* Day columns */}
            {buckets.map((day) => {
              const dayExceptions = exceptionsByDate.get(day.iso) ?? [];
              const fullDayBlock = dayExceptions.find((e) => e.type === AvailabilityExceptionType.UNAVAILABLE);
              const customHours = dayExceptions.find((e) => e.type === AvailabilityExceptionType.CUSTOM_HOURS);
              return (
                <div
                  key={day.iso}
                  className="relative"
                  style={{
                    borderRight: "1px solid var(--border)",
                    background: fullDayBlock
                      ? "repeating-linear-gradient(135deg, oklch(0.96 0.005 80) 0 8px, oklch(0.97 0.004 80) 8px 16px)"
                      : undefined,
                  }}
                >
                  {HOURS.map((h) => (
                    <div key={h} className="h-14" style={{ borderBottom: "1px solid var(--border)" }} />
                  ))}
                  {fullDayBlock && (
                    <div className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-4)" }}>
                      Blocked{fullDayBlock.reason ? ` · ${fullDayBlock.reason}` : ""}
                    </div>
                  )}
                  {customHours && !fullDayBlock && (
                    <div className="absolute top-1 left-1 right-1 rounded-(--r-1) px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.04em]" style={{ background: "var(--bg-2)", border: "1px dashed var(--border-2)", color: "var(--fg-3)" }}>
                      Custom hours {customHours.startTime}&ndash;{customHours.endTime}
                    </div>
                  )}
                  {day.bookings.map((b) => {
                    const geo = blockGeometry(b);
                    if (!geo) return null;
                    const st = STATUS_COLORS[b.status];
                    return (
                      <div
                        key={b.id}
                        title={`${fmtTime(b.startsAt)}–${fmtTime(b.endsAt)} · ${bookingClientName(b)} · ${st?.label ?? b.status}`}
                        className="absolute left-1 right-1 rounded-(--r-1) px-1.5 py-1 overflow-hidden"
                        style={{
                          top: geo.top,
                          height: geo.height,
                          background: st?.bg ?? "var(--bg-2)",
                          border: `1px solid ${st?.color ?? "var(--border-2)"}`,
                        }}
                      >
                        <div className="font-mono text-[10px] leading-tight" style={{ color: st?.color ?? "var(--fg-2)" }}>{fmtTime(b.startsAt)}</div>
                        <div className="text-[11px] font-medium leading-tight truncate" style={{ color: "var(--ink)" }}>{bookingClientName(b)}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Side info */}
      <div className="grid lg:grid-cols-3 gap-3.5">
        {/* This week stats */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>This week</div>
          <div className="rounded-(--r-3) overflow-hidden grid grid-cols-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {stats.map((s, i) => (
              <div key={s.label} className="p-3 px-3.5 flex flex-col gap-0.5" style={{ borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.label}</div>
                <div className="text-[18px] font-medium tracking-[-0.018em] tabular-nums leading-none mt-0.5" style={{ color: "var(--ink)" }}>{s.value}</div>
                <div className="font-mono text-[10px] mt-1" style={{ color: "var(--signal-ink)" }}>{s.delta}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Working hours (real availability rules) */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Working hours</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {scheduleError ? (
              <div className="px-3.5 py-3 text-[12.5px]" style={{ color: "var(--danger)" }}>{scheduleError}</div>
            ) : rules.length === 0 ? (
              <div className="px-3.5 py-3">
                <EmptySlate message="No weekly availability set yet." hint="Set your bookable hours in Settings." mt="mt-0" />
              </div>
            ) : (
              orderedDows.map((dow) => {
                const dayRules = rulesByDow.get(dow) ?? [];
                return (
                  <div key={dow} className="grid items-center gap-2 px-3.5 py-2.5 text-[12.5px]" style={{ gridTemplateColumns: "36px 1fr", borderBottom: "1px solid var(--border)" }}>
                    <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--ink)" }}>{DOW[dow]}</div>
                    <div className="font-mono text-[12px] tabular-nums" style={{ color: dayRules.length > 0 ? "var(--ink)" : "var(--fg-4)" }}>
                      {dayRules.length > 0
                        ? dayRules
                            .map((r) => {
                              const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
                              // The grid buckets bookings in browser-local
                              // time; if a rule lives in a different zone,
                              // say so instead of letting the two halves of
                              // the page silently disagree.
                              const tz = r.timezone && r.timezone !== local ? ` (${r.timezone})` : "";
                              return `${r.startTime} – ${r.endTime}${tz}`;
                            })
                            .join(" · ")
                        : "Off"}
                    </div>
                  </div>
                );
              })
            )}
            <div className="px-3.5 py-2.5">
              <Link href="/dashboard/dietitian/settings" className="font-mono text-[11px] uppercase tracking-[0.04em] underline" style={{ color: "var(--fg-2)" }}>
                Edit availability in Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Blocked dates + status key */}
        <div className="flex flex-col gap-3.5">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Blocked dates</div>
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {upcomingExceptions.length === 0 ? (
                <div className="px-3.5 py-3">
                  <EmptySlate message="No upcoming blocked time." hint="Use “Block off” to mark days you're unavailable." mt="mt-0" />
                </div>
              ) : (
                upcomingExceptions.map((exc) => (
                  <div key={exc.id} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px]" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[12px] tabular-nums" style={{ color: "var(--ink)" }}>
                        {fmtDate(exc.date)}
                        <span className="ml-2" style={{ color: "var(--fg-3)" }}>
                          {exc.type === AvailabilityExceptionType.UNAVAILABLE
                            ? "All day"
                            : `${exc.startTime ?? ""} – ${exc.endTime ?? ""}`}
                        </span>
                      </div>
                      {exc.reason && <div className="text-[11.5px] truncate mt-0.5" style={{ color: "var(--fg-3)" }}>{exc.reason}</div>}
                    </div>
                    <button
                      aria-label={`Remove block on ${exc.date}`}
                      disabled={deletingId === exc.id}
                      onClick={() => void removeException(exc.id)}
                      className="font-mono text-[10.5px] uppercase tracking-[0.04em] cursor-pointer"
                      style={{ background: "none", border: "none", color: "var(--danger)" }}
                    >
                      {deletingId === exc.id ? "…" : "Remove"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Status key</div>
            <div className="rounded-(--r-3) py-1" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {Object.entries(STATUS_COLORS).map(([status, s]) => (
                <div key={status} className="flex items-center gap-2 px-3.5 py-2 text-[12px]" style={{ color: "var(--fg-2)" }}>
                  <span className="w-2.5 h-2.5 rounded-[1px]" style={{ background: s.bg, border: `1px solid ${s.color}` }} />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Block-off modal */}
      <ActionModal
        open={blockOpen}
        onClose={() => !blockBusy && setBlockOpen(false)}
        title="Block off time"
        description="Blocked time is removed from your bookable availability. Existing bookings are not cancelled."
        footer={
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost-v2 sm" disabled={blockBusy} onClick={() => setBlockOpen(false)}>Cancel</button>
            <button className="btn-primary-v2 sm" disabled={blockBusy} onClick={() => void submitBlock()}>
              {blockBusy ? "Saving…" : "Block off"}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Date</span>
            <input
              type="date"
              value={blockDate}
              min={todayIso}
              onChange={(e) => setBlockDate(e.target.value)}
              className="rounded-(--r-2) px-3 py-2 text-[13px]"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)" }}
            />
          </label>

          <div className="flex gap-1">
            {([true, false] as const).map((allDay) => (
              <button
                key={String(allDay)}
                onClick={() => setBlockAllDay(allDay)}
                className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
                style={{
                  background: blockAllDay === allDay ? "var(--ink)" : "var(--bg)",
                  color: blockAllDay === allDay ? "var(--bg)" : "var(--fg-3)",
                  border: blockAllDay === allDay ? "1px solid var(--ink)" : "1px solid var(--border)",
                }}
              >
                {allDay ? "All day" : "Custom hours"}
              </button>
            ))}
          </div>

          {!blockAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Available from</span>
                <input
                  type="time"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="rounded-(--r-2) px-3 py-2 text-[13px]"
                  style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)" }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Until</span>
                <input
                  type="time"
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  className="rounded-(--r-2) px-3 py-2 text-[13px]"
                  style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)" }}
                />
              </label>
              <p className="col-span-2 text-[12px] -mt-1" style={{ color: "var(--fg-3)" }}>
                Custom hours replace your usual availability on that date.
              </p>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Reason (optional)</span>
            <input
              type="text"
              value={blockReason}
              maxLength={200}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Conference, leave"
              className="rounded-(--r-2) px-3 py-2 text-[13px]"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)" }}
            />
          </label>
        </div>
      </ActionModal>
    </DietitianDashboardShell>
  );
}
