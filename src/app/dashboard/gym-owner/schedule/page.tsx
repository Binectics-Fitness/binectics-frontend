import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Manage class schedules and booking availability.",
};

const HOURS = ["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];

const DAYS = [
  { dow: "Mon", d: "18", count: "8 classes · 96/112" },
  { dow: "Tue", d: "19", count: "7 classes · 80/98", today: true },
  { dow: "Wed", d: "20", count: "9 classes" },
  { dow: "Thu", d: "21", count: "8 classes" },
  { dow: "Fri", d: "22", count: "7 classes" },
  { dow: "Sat", d: "23", count: "5 classes" },
  { dow: "Sun", d: "24", count: "2 classes", muted: true },
];

type CLS = "strength" | "hiit" | "yoga" | "olympic" | "cancelled";
const CLS_BG: Record<CLS, string> = { strength: "var(--gym-soft)", hiit: "var(--trainer-soft)", yoga: "var(--dietitian-soft)", olympic: "var(--signal-soft)", cancelled: "var(--bg-2)" };
const CLS_BORDER: Record<CLS, string> = { strength: "var(--gym)", hiit: "var(--trainer)", yoga: "var(--dietitian)", olympic: "var(--signal)", cancelled: "var(--fg-4)" };

interface Ev { type: CLS; time: string; name: string; cap: string; top: number; h: number; full?: boolean; open?: boolean }

const EVENTS: Record<number, Ev[]> = {
  0: [
    { type: "strength", time: "06:00 · 60", name: "Strength · lower", cap: "14/14", top: 0, h: 52, full: true },
    { type: "hiit", time: "07:30 · 45", name: "HIIT full body", cap: "11/14", top: 78, h: 40 },
    { type: "yoga", time: "12:15 · 30", name: "Mobility flow", cap: "4/12", top: 324, h: 26, open: true },
    { type: "strength", time: "17:00 · 60", name: "Strength · upper", cap: "12/14", top: 572, h: 52 },
    { type: "olympic", time: "18:00 · 60", name: "Olympic basics", cap: "12/12", top: 624, h: 52, full: true },
    { type: "hiit", time: "19:15 · 45", name: "Conditioning", cap: "7/16", top: 685, h: 40 },
  ],
  1: [
    { type: "strength", time: "07:00 · 60", name: "Strength · lower", cap: "14/14", top: 52, h: 52, full: true },
    { type: "hiit", time: "09:00 · 45", name: "HIIT · interval", cap: "10/14", top: 156, h: 40 },
    { type: "yoga", time: "12:00 · 40", name: "Yoga · vinyasa", cap: "9/12", top: 312, h: 32 },
    { type: "cancelled", time: "14:00 · 45", name: "Recovery class", cap: "Cancelled", top: 416, h: 40 },
    { type: "olympic", time: "17:00 · 75", name: "Olympic intermediate", cap: "8/10", top: 572, h: 75 },
    { type: "strength", time: "19:00 · 60", name: "Strength · upper", cap: "11/14", top: 676, h: 52 },
  ],
  2: [
    { type: "strength", time: "06:00 · 60", name: "Strength · lower", cap: "12/14", top: 0, h: 52 },
    { type: "hiit", time: "07:30 · 45", name: "HIIT full body", cap: "13/14", top: 78, h: 40 },
    { type: "olympic", time: "09:00 · 75", name: "Olympic basics", cap: "8/10", top: 156, h: 75 },
    { type: "yoga", time: "12:00 · 30", name: "Mobility quick", cap: "3/12", top: 312, h: 26, open: true },
    { type: "strength", time: "17:00 · 60", name: "Strength · upper", cap: "11/14", top: 572, h: 52 },
    { type: "olympic", time: "18:00 · 60", name: "Olympic basics", cap: "9/12", top: 624, h: 52 },
  ],
  3: [
    { type: "strength", time: "07:00 · 60", name: "Strength · lower", cap: "10/14", top: 52, h: 52 },
    { type: "hiit", time: "09:00 · 45", name: "HIIT · steady", cap: "12/14", top: 156, h: 40 },
    { type: "yoga", time: "10:30 · 40", name: "Yoga · vinyasa", cap: "10/12", top: 220, h: 32 },
    { type: "strength", time: "14:00 · 60", name: "PT block · open", cap: "3/14", top: 416, h: 52, open: true },
    { type: "olympic", time: "17:00 · 75", name: "Olympic intermediate", cap: "9/10", top: 572, h: 75 },
    { type: "hiit", time: "19:00 · 60", name: "Conditioning", cap: "10/16", top: 676, h: 52 },
  ],
  4: [
    { type: "strength", time: "06:00 · 60", name: "Strength · full", cap: "13/14", top: 0, h: 52 },
    { type: "hiit", time: "07:30 · 45", name: "HIIT full body", cap: "14/14", top: 78, h: 40, full: true },
    { type: "olympic", time: "09:00 · 75", name: "PR Friday", cap: "8/10", top: 156, h: 75 },
    { type: "yoga", time: "12:00 · 30", name: "Mobility flow", cap: "7/12", top: 312, h: 26 },
    { type: "strength", time: "17:00 · 60", name: "Strength · upper", cap: "11/14", top: 572, h: 52 },
  ],
  5: [
    { type: "strength", time: "07:30 · 90", name: "Weekend warrior", cap: "12/14", top: 78, h: 90 },
    { type: "hiit", time: "09:30 · 75", name: "Open conditioning", cap: "11/16", top: 180, h: 75 },
    { type: "yoga", time: "11:00 · 60", name: "Yoga · sat flow", cap: "9/12", top: 260, h: 60 },
  ],
  6: [
    { type: "yoga", time: "09:00 · 60", name: "Slow Sunday yoga", cap: "8/12", top: 156, h: 60 },
    { type: "strength", time: "14:00 · 75", name: "Open gym social", cap: "6/16", top: 416, h: 75 },
  ],
};

const ROSTER = [
  { init: "LM", name: "Linda Mokoena", meta: "Booked 4 days ago", status: "Confirmed", confirmed: true },
  { init: "WC", name: "Wei Chen", meta: "Booked yesterday", status: "Confirmed", confirmed: true },
  { init: "JS", name: "Jamal Sutherland", meta: "Booked 2 days ago", status: "Confirmed", confirmed: true },
  { init: "RJ", name: "Rashid Jansen", meta: "Booked 12h ago", status: "Confirmed", confirmed: true },
  { init: "TN", name: "Thandi Nkosi", meta: "Booked yesterday", status: "Confirmed", confirmed: true },
  { init: "AA", name: "Aisha Adams", meta: "Booked 3 days ago", status: "Confirmed", confirmed: true },
  { init: "MK", name: "Mike Khumalo", meta: "Booked today", status: "Confirmed", confirmed: true },
  { init: "FA", name: "Folake Adebayo", meta: "Booked 5 days ago", status: "Confirmed", confirmed: true },
  { init: "NK", name: "Nthabiseng K.", meta: "Waitlist · since 09:18", status: "Wait 1", waitlist: true },
  { init: "OK", name: "Olu Bankole", meta: "Waitlist · since 10:42", status: "Wait 2", waitlist: true },
];

export default function GymSchedulePage() {
  return (
    <GymDashboardShell
      activeItem="Schedule"
      crumb="Schedule"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-(--r-2) overflow-hidden">
            {["Day", "Week", "Month"].map((v, i) => (
              <button key={v} className={`px-3 py-1.5 text-[12px] ${i < 2 ? "border-r border-border" : ""} ${v === "Week" ? "bg-bg-3 font-medium" : ""}`} style={{ color: v === "Week" ? "var(--ink)" : "var(--fg-3)" }}>{v}</button>
            ))}
          </div>
          <button className="btn-ghost-v2 sm">Bulk edit</button>
          <Link href="/dashboard/gym-owner/classes/new" className="btn-primary-v2 sm">+ New class</Link>
        </div>
      }
    >
      {/* Week header */}
      <div className="flex items-center gap-3 mb-1">
        <button className="w-10 h-10 sm:w-7 sm:h-7 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "var(--bg)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Week 21 · May 2026</span>
        <button className="w-10 h-10 sm:w-7 sm:h-7 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "var(--bg)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button className="px-2.5 py-1 rounded-(--r-2) text-[12px] font-medium" style={{ border: "1px solid var(--border)", color: "var(--ink)", background: "var(--bg)" }}>Today</button>
      </div>

      <div className="flex gap-0" style={{ alignItems: "stretch" }}>
        {/* Calendar */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div className="grid rounded-(--r-3) overflow-hidden min-w-[800px]" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", background: "var(--bg)", border: "1px solid var(--border)" }}>
            {/* Day headers */}
            <div style={{ borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }} />
            {DAYS.map((d) => (
              <div key={d.dow} className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{d.dow}</div>
                <div className={`text-[17px] font-medium mt-0.5 ${d.today ? "inline-block px-1.75 py-px rounded-[4px]" : ""}`} style={{ color: d.today ? "var(--bg)" : "var(--ink)", background: d.today ? "var(--ink)" : "transparent", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{d.d}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: d.muted ? "var(--fg-4)" : "var(--fg-4)" }}>{d.count}</div>
              </div>
            ))}

            {/* Time column */}
            <div className="flex flex-col" style={{ borderRight: "1px solid var(--border)" }}>
              {HOURS.map((h) => (
                <div key={h} className="relative" style={{ height: "52px", borderBottom: "1px solid var(--border)" }}>
                  <span className="absolute -top-[7px] right-1.5 font-mono text-[9.5px] px-1" style={{ color: "var(--fg-3)", background: "var(--bg)" }}>{h}</span>
                </div>
              ))}
            </div>

            {/* Day columns with events */}
            {DAYS.map((d, di) => (
              <div key={d.dow} className="relative" style={{ borderRight: "1px solid var(--border)", background: di === 6 ? "repeating-linear-gradient(135deg, oklch(0.97 0.005 80) 0 10px, oklch(0.98 0.004 80) 10px 20px)" : "transparent" }}>
                {HOURS.map((_, hi) => (
                  <div key={hi} style={{ height: "52px", borderBottom: "1px solid var(--border)" }} />
                ))}
                {/* Now line on Tuesday */}
                {d.today && <div className="absolute left-0 right-0" style={{ top: "432px", height: "1px", background: "var(--danger)", zIndex: 4, pointerEvents: "none" }}><span className="absolute -left-[5px] -top-[4px] w-2.5 h-2.5 rounded-full" style={{ background: "var(--danger)" }} /></div>}
                {(EVENTS[di] || []).map((ev, ei) => (
                  <div
                    key={ei}
                    className="absolute left-1 right-1 rounded-(--r-2) px-2 py-1 overflow-hidden cursor-pointer"
                    style={{
                      top: `${ev.top}px`,
                      height: `${ev.h}px`,
                      background: ev.type === "cancelled" ? "var(--bg-2)" : CLS_BG[ev.type],
                      borderLeft: `3px solid ${CLS_BORDER[ev.type]}`,
                      zIndex: 2,
                      opacity: ev.type === "cancelled" ? 0.5 : 1,
                    }}
                  >
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{ev.time}</div>
                    <div className="text-[12px] font-medium truncate" style={{ color: ev.type === "cancelled" ? "var(--fg-3)" : "var(--ink)", letterSpacing: "-0.005em", lineHeight: 1.2, textDecoration: ev.type === "cancelled" ? "line-through" : "none" }}>{ev.name}</div>
                    {ev.h > 30 && <div className="font-mono text-[9.5px] uppercase tracking-[0.04em]" style={{ color: ev.full ? "var(--danger)" : ev.open ? "var(--signal-ink)" : "var(--fg-3)" }}>{ev.cap}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Detail rail */}
        <aside className="hidden xl:flex flex-col gap-3.5 ml-3.5" style={{ width: "320px", flexShrink: 0 }}>
          {/* Selected class */}
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Selected class</div>
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Olympic intermediate</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>Tue 17:00 · today</span>
              </div>
              {[
                { k: "Coach", v: "Themba M." },
                { k: "Duration", v: "75 min" },
                { k: "Location", v: "Sea Point · platform A" },
                { k: "Capacity", v: "8 / 10 · 2 spots" },
                { k: "Waitlist", v: "3 members" },
                { k: "Recurrence", v: "Weekly · Tue 17:00" },
                { k: "Plan access", v: "Studio · Pro" },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between px-3.5 py-2.75 text-[13px]" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{r.k}</span>
                  <span style={{ color: "var(--ink)" }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mt-2.5">
              <button className="btn-ghost-v2 sm flex-1">Edit</button>
              <button className="btn-ghost-v2 sm flex-1">Duplicate</button>
              <button className="btn-ghost-v2 sm flex-1" style={{ color: "var(--danger)" }}>Cancel</button>
            </div>
          </div>

          {/* Roster */}
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Roster · 8 confirmed</div>
            <div className="rounded-(--r-3) overflow-hidden overflow-y-auto" style={{ background: "var(--bg)", border: "1px solid var(--border)", maxHeight: "280px" }}>
              {ROSTER.map((r, i) => (
                <div key={r.init} className="flex items-center gap-2.5 px-3.5 py-2.25" style={{ borderBottom: i < ROSTER.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9.5px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{r.init}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>{r.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{r.meta}</div>
                  </div>
                  <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded-full uppercase tracking-[0.04em]" style={{ background: r.confirmed ? "var(--signal-soft)" : "oklch(0.96 0.06 75)", color: r.confirmed ? "var(--signal-ink)" : "oklch(0.45 0.16 75)" }}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Color key */}
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Color key</div>
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {[
                { label: "Strength", color: "var(--gym)" },
                { label: "HIIT / conditioning", color: "var(--trainer)" },
                { label: "Olympic lifting", color: "var(--signal)" },
                { label: "Yoga / mobility", color: "var(--dietitian)" },
              ].map((ck) => (
                <div key={ck.label} className="flex items-center gap-2 px-3.5 py-2 text-[12px]" style={{ color: "var(--fg-2)" }}>
                  <span className="w-2 h-2 rounded-[2px]" style={{ background: ck.color }} />{ck.label}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </GymDashboardShell>
  );
}
