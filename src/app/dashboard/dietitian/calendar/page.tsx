"use client";

import { useEffect, useMemo, useState } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";

const DAYS = [
  { dow: "Mon", d: "18", count: "5 sessions", today: false },
  { dow: "Tue", d: "19", count: "4 sessions", today: true },
  { dow: "Wed", d: "20", count: "6 sessions", today: false },
  { dow: "Thu", d: "21", count: "5 sessions", today: false },
  { dow: "Fri", d: "22", count: "4 sessions", today: false },
  { dow: "Sat", d: "23", count: "2 classes", today: false },
  { dow: "Sun", d: "24", count: "off", today: false, off: true },
];

const HOURS = ["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];

const WORKING_HOURS = [
  { day: "Mon", hours: "06:30 – 12:30 · 15:00 – 18:30", on: true },
  { day: "Tue", hours: "07:00 – 12:30 · 15:00 – 18:30", on: true },
  { day: "Wed", hours: "06:30 – 12:30 · 15:00 – 18:30", on: true },
  { day: "Thu", hours: "07:00 – 12:30 · 15:00 – 18:30", on: true },
  { day: "Fri", hours: "06:30 – 12:30 · 15:30 – 18:30", on: true },
  { day: "Sat", hours: "07:30 – 11:00 only", on: true },
  { day: "Sun", hours: "Off", on: false },
];

const BOOKING_RULES = [
  { key: "Min notice", value: "6 hours" },
  { key: "Max booking horizon", value: "8 weeks" },
  { key: "Buffer between sessions", value: "15 min" },
  { key: "Max bookings per day", value: "8" },
  { key: "Auto-confirm", value: "Returning only" },
  { key: "Cancellation window", value: "24h free" },
];

const COLOR_KEY = [
  { color: "var(--ink)", label: "In-person session" },
  { color: "var(--gym)", label: "Online · Zoom" },
  { color: "var(--signal)", label: "First session · onboarding" },
  { color: "var(--trainer)", label: "Group class" },
  { color: "var(--fg-3)", label: "Personal block · no clients" },
];

const SYNCED = [
  { name: "Google · sarah@gmail.com", sub: "2-way · last sync 4m ago", status: "Synced" },
  { name: "Iron Lab roster", sub: "Read-only · daily", status: "Synced" },
];

type ViewMode = "Day" | "Week" | "Month";

export default function DietitianCalendarPage() {
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [view, setView] = useState<ViewMode>("Week");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoadingBookings(true);
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const res = await consultationsService.getProviderBookings({
        from: weekStart.toISOString().slice(0, 10),
        to: weekEnd.toISOString().slice(0, 10),
      });

      if (!mounted) return;
      if (res.success && res.data) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
      setLoadingBookings(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const upcoming = bookings.filter(
      (b) =>
        b.status === ConsultationBookingStatus.PENDING ||
        b.status === ConsultationBookingStatus.CONFIRMED,
    );
    const completed = bookings.filter(
      (b) => b.status === ConsultationBookingStatus.COMPLETED,
    );
    const totalMinutes = completed.reduce((sum, b) => {
      return (
        sum +
        Math.max(
          0,
          Math.round(
            (new Date(b.endsAt).getTime() - new Date(b.startsAt).getTime()) /
              60000,
          ),
        )
      );
    }, 0);
    const noShows = bookings.filter(
      (b) => b.status === ConsultationBookingStatus.NO_SHOW,
    ).length;

    return [
      { label: "Sessions", value: String(bookings.length), unit: "", delta: `${upcoming.length} upcoming` },
      { label: "Completed", value: String(completed.length), delta: "This week" },
      { label: "No-shows", value: String(noShows), delta: "Follow up needed" },
      { label: "Hours coached", value: (totalMinutes / 60).toFixed(1), delta: "Completed sessions" },
    ];
  }, [bookings]);

  const upcomingToday = useMemo(() => {
    const today = new Date().toDateString();
    return bookings
      .filter((b) => new Date(b.startsAt).toDateString() === today)
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )
      .slice(0, 4);
  }, [bookings]);

  return (
    <DietitianDashboardShell activeItem="Consultations" crumb="Calendar">
      {/* Calendar header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex items-center gap-3.5">
          <h1 className="text-[22px] font-medium tracking-[-0.018em]" style={{ color: "var(--ink)" }}>
            Week 21 <span className="font-normal" style={{ color: "var(--fg-3)" }}>&middot; May 2026</span>
          </h1>
          <div className="inline-flex rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
            <button className="w-7 h-7 flex items-center justify-center cursor-pointer" style={{ background: "var(--bg)", border: "none", borderRight: "1px solid var(--border)", color: "var(--fg-2)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button className="w-7 h-7 flex items-center justify-center cursor-pointer" style={{ background: "var(--bg)", border: "none", color: "var(--fg-2)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
          <button className="h-7 px-3 font-mono text-[11px] uppercase tracking-[0.04em] rounded-(--r-2) cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}>Today</button>
        </div>
        <div className="flex gap-2.5 items-center">
          <div className="inline-flex rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
            {(["Day", "Week", "Month"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 h-7 font-mono text-[11px] uppercase tracking-[0.04em] cursor-pointer"
                style={{
                  background: view === v ? "var(--ink)" : "var(--bg)",
                  color: view === v ? "var(--bg)" : "var(--fg-2)",
                  border: "none",
                  borderRight: "1px solid var(--border)",
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="px-3.5 py-1.5 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>Block off</button>
          <button className="px-3.5 py-1.5 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>+ New session</button>
        </div>
      </div>

      <div className="rounded-(--r-3) p-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          {loadingBookings ? "Loading today's bookings..." : "Today's bookings"}
        </div>
        <div className="mt-2.5 grid gap-2">
          {upcomingToday.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between rounded-(--r-2) px-3 py-2" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <span className="font-mono text-[12px]" style={{ color: "var(--ink)" }}>
                {new Date(booking.startsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-[12.5px]" style={{ color: "var(--fg-2)" }}>
                Client {booking.clientUserId.slice(-6).toUpperCase()}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--signal-ink)" }}>
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

      {/* Days header row */}
      <div className="overflow-x-auto" style={{ border: "1px solid var(--border)", borderRadius: "var(--r-3)", background: "var(--bg)" }}>
      <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
        <div style={{ borderRight: "1px solid var(--border)" }} />
        {DAYS.map((day) => (
          <div key={day.dow} className="px-3 py-2.5 flex flex-col gap-0.5" style={{ borderRight: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: day.today ? "var(--ink)" : "var(--fg-3)" }}>{day.dow}</div>
            <div className="text-[18px] font-medium tracking-[-0.022em] tabular-nums leading-none" style={{ color: day.today ? "var(--bg)" : "var(--ink)" }}>
              {day.today ? <span className="px-1.5 py-0.5 rounded-[4px]" style={{ background: "var(--ink)", color: "var(--bg)" }}>{day.d}</span> : day.d}
            </div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: day.off ? "var(--fg-4)" : "var(--fg-4)" }}>{day.count}</div>
          </div>
        ))}
      </div>
      </div>

      {/* Calendar grid placeholder */}
      <div className="rounded-(--r-3) overflow-x-auto" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
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
          {DAYS.map((day) => (
            <div key={day.dow} className="relative" style={{ borderRight: "1px solid var(--border)", background: day.off ? "repeating-linear-gradient(135deg, oklch(0.96 0.005 80) 0 8px, oklch(0.97 0.004 80) 8px 16px)" : undefined }}>
              {HOURS.map((h) => (
                <div key={h} className="h-14" style={{ borderBottom: "1px solid var(--border)" }} />
              ))}
              {day.off && (
                <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-4)" }}>Day off &middot; rest</div>
              )}
            </div>
          ))}
        </div>
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
                <div className="text-[18px] font-medium tracking-[-0.018em] tabular-nums leading-none mt-0.5" style={{ color: "var(--ink)" }}>
                  {s.value}{s.unit && <span className="font-mono text-[11px] font-normal ml-1" style={{ color: "var(--fg-3)" }}>{s.unit}</span>}
                </div>
                <div className="font-mono text-[10px] mt-1" style={{ color: "var(--signal-ink)" }}>{s.delta}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Working hours */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Working hours</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {WORKING_HOURS.map((w) => (
              <div key={w.day} className="grid items-center gap-2 px-3.5 py-2.5 text-[12.5px]" style={{ gridTemplateColumns: "36px 1fr 28px", borderBottom: "1px solid var(--border)" }}>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--ink)" }}>{w.day}</div>
                <div className="font-mono text-[12px] tabular-nums" style={{ color: w.on ? "var(--ink)" : "var(--fg-4)" }}>{w.hours}</div>
                <div className="w-7 h-4 rounded-full relative cursor-pointer" style={{ background: w.on ? "var(--ink)" : "var(--border-2)" }}>
                  <span className="absolute w-3 h-3 rounded-full top-0.5" style={{ background: "var(--bg)", left: w.on ? "14px" : "2px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking rules + Color key + Synced calendars */}
        <div className="flex flex-col gap-3.5">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Booking rules</div>
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {BOOKING_RULES.map((r) => (
                <div key={r.key} className="flex justify-between items-center px-3.5 py-2.5 text-[12.5px] gap-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--fg-3)" }}>{r.key}</span>
                  <span className="font-mono tabular-nums" style={{ color: "var(--ink)" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Color key</div>
            <div className="rounded-(--r-3) py-1" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {COLOR_KEY.map((c) => (
                <div key={c.label} className="flex items-center gap-2 px-3.5 py-2 text-[12px]" style={{ color: "var(--fg-2)" }}>
                  <span className="w-2.5 h-2.5 rounded-[1px]" style={{ background: c.color }} />
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Synced calendars</div>
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {SYNCED.map((s) => (
                <div key={s.name} className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--fg-2)", flexShrink: 0 }}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18" /></svg>
                  <div className="flex-1">
                    <div className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>{s.name}</div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{s.sub}</div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: "var(--signal-ink)" }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
