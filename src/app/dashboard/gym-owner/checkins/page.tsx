"use client";

import { useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

const KPIS = [
  { label: "Check-ins today", value: "412", delta: "+ 8% vs avg Tue" },
  { label: "Currently on floor", value: "78", delta: "Sea Point at 92%" },
  { label: "Avg session", value: "68", unit: "min", delta: "↑ 4 min MoM" },
  { label: "Streaks broken today", value: "14", delta: "Auto-nudge sent", warn: true },
];

const HOUR_DATA = [
  { hour: "4am", count: 4, pct: 10 },
  { hour: "5am", count: 32, pct: 24 },
  { hour: "6am", count: 68, pct: 62 },
  { hour: "7am", count: 102, pct: 88 },
  { hour: "8am", count: 58, pct: 52 },
  { hour: "9am", count: 32, pct: 32 },
  { hour: "10am", count: 18, pct: 22 },
  { hour: "11am", count: 24, pct: 28 },
  { hour: "12pm", count: 38, pct: 42 },
  { hour: "1pm", count: 42, pct: 48 },
  { hour: "2pm", count: 28, pct: 34 },
  { hour: "3pm", count: 22, pct: 38, now: true },
  { hour: "4pm", count: 0, pct: 0 },
  { hour: "5pm", count: 0, pct: 0 },
  { hour: "6pm", count: 0, pct: 0 },
  { hour: "7pm", count: 0, pct: 0 },
];

const LOCATIONS = [
  { name: "Sea Point", capacity: 60, current: 55, level: "over", pct: 92 },
  { name: "Foreshore", capacity: 80, current: 61, level: "warn", pct: 76 },
  { name: "Camps Bay", capacity: 40, current: 17, level: "high", pct: 42 },
  { name: "Woodstock", capacity: 50, current: 16, level: "", pct: 32 },
];

const STREAM = [
  { time: "14:42:18", initials: "LM", name: "Linda Mokoena", meta: "Sea Point · day 32 streak · pro plan", pill: "ok", pillText: "✓ in", avaClass: "streak" },
  { time: "14:41:02", initials: "WC", name: "Wei Chen", meta: "Foreshore · studio plan", pill: "ok", pillText: "✓ in", avaClass: "" },
  { time: "14:40:44", initials: "JS", name: "Jamal Sutherland", meta: "Sea Point · first session · pro monthly", pill: "new", pillText: "★ first", avaClass: "new" },
  { time: "14:39:18", initials: "AA", name: "Aisha Adams", meta: "Sea Point · annual", pill: "ok", pillText: "✓ in", avaClass: "" },
  { time: "14:38:42", initials: "MK", name: "Mike Khumalo", meta: "Foreshore · past-due plan", pill: "warn", pillText: "⚠ pay", avaClass: "" },
  { time: "14:37:18", initials: "TN", name: "Thandi Nkosi", meta: "Camps Bay · studio plan", pill: "ok", pillText: "✓ in", avaClass: "" },
  { time: "14:36:02", initials: "RJ", name: "Rashid Jansen", meta: "Woodstock · 24-pack · 18 / 24 used", pill: "ok", pillText: "✓ in", avaClass: "" },
  { time: "14:35:18", initials: "FA", name: "Folake Adebayo", meta: "Foreshore · day 88 streak · pro monthly", pill: "ok", pillText: "✓ in", avaClass: "streak" },
  { time: "14:34:08", initials: "PB", name: "Pier Botha", meta: "Woodstock · day pass", pill: "ok", pillText: "✓ in", avaClass: "" },
  { time: "14:32:48", initials: "SO", name: "Sofia Almeida", meta: "Sea Point · annual · returning after 3 weeks", pill: "ok", pillText: "✓ in", avaClass: "" },
];

const DEVICES = [
  { name: "Sea Point kiosk", meta: "Online · last scan 14:42:18", color: "var(--signal)" },
  { name: "Foreshore kiosk", meta: "Online · last scan 14:41:02", color: "var(--signal)" },
  { name: "Camps Bay kiosk", meta: "Online · battery 18%", color: "oklch(0.65 0.18 75)" },
  { name: "Foreshore floor scanner", meta: "Offline · 4h 12m", color: "var(--danger)", danger: true },
];

const BROKEN = [
  { name: "Adaora T.", meta: "Day 92 → broken · nudge sent" },
  { name: "Kemi Eze", meta: "Day 64 → broken · checked into Cape Town airport instead" },
  { name: "Marcus B.", meta: "Day 38 → broken · plan paused 3 days ago" },
];

const MILESTONES = [
  { name: "★ Folake A. · day 88", meta: "Personal best · auto-celebrated" },
  { name: "★ Linda M. · day 32", meta: "Half-marathon prep streak" },
  { name: "★ Pier B. · 100 visits", meta: "Lifetime · Woodstock day pass" },
];

const TIME_FILTERS = ["Now", "Today", "7D", "30D"];

function pillColor(pill: string) {
  if (pill === "ok") return { background: "var(--signal-soft)", color: "var(--signal-ink)" };
  if (pill === "new") return { background: "var(--gym-soft)", color: "var(--gym)" };
  if (pill === "warn") return { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" };
  return {};
}

function avaColor(cls: string) {
  if (cls === "new") return { background: "var(--gym-soft)", color: "var(--gym)" };
  if (cls === "streak") return { background: "var(--signal-soft)", color: "var(--signal-ink)" };
  return { background: "var(--bg-3)", color: "var(--fg-2)" };
}

function fillClass(level: string) {
  if (level === "over") return "var(--danger)";
  if (level === "warn") return "oklch(0.65 0.18 75)";
  if (level === "high") return "var(--signal)";
  return "var(--ink)";
}

export default function GymCheckinsPage() {
  const [activeFilter, setActiveFilter] = useState("Today");

  return (
    <GymDashboardShell
      activeItem="Check‑ins"
      crumb="Check-ins"
      actions={
        <div className="flex gap-2.5 items-center">
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.04em] px-2.5 py-1 rounded-full"
            style={{ color: "var(--signal-ink)", background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--signal)" }} />
            Live &middot; 4 locations
          </span>
          <div className="inline-flex rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
            {TIME_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] cursor-pointer"
                style={{
                  background: activeFilter === f ? "var(--ink)" : "var(--bg)",
                  color: activeFilter === f ? "var(--bg)" : "var(--fg-2)",
                  border: "none",
                  borderRight: "1px solid var(--border)",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* Page head */}
      <div>
        <h1 className="text-[30px] font-medium tracking-[-0.022em]" style={{ color: "var(--ink)" }}>Check-ins</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Today &middot; 412 check-ins so far across 4 locations &middot; peak hour was 7am</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-(--r-3) p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[26px] font-medium tracking-[-0.02em] tabular-nums leading-none mt-1.5" style={{ color: k.warn ? "oklch(0.45 0.16 75)" : "var(--ink)" }}>
              {k.value}
              {k.unit && <span className="font-mono text-[13px] font-normal ml-0.5" style={{ color: "var(--fg-3)" }}>{k.unit}</span>}
            </div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: k.warn ? "var(--fg-3)" : "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Chart + Floor occupancy */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-3.5">
        {/* Hour chart */}
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="flex justify-between items-center px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
              Check-ins by hour <span className="font-mono text-[11px] font-normal uppercase tracking-[0.04em] ml-2" style={{ color: "var(--fg-3)" }}>today</span>
            </h3>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>All locations</span>
          </div>
          <div className="flex items-end gap-1 px-5.5 h-[200px] pt-4.5">
            {HOUR_DATA.map((h) => (
              <div
                key={h.hour}
                className="flex-1 rounded-t-[3px] relative group cursor-pointer"
                style={{
                  height: `${Math.max(h.pct, 2)}%`,
                  background: h.now ? "var(--brand, oklch(0.62 0.13 47))" : "var(--ink)",
                  minHeight: h.pct > 0 ? 4 : 0,
                }}
              >
                <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 font-mono text-[9.5px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--ink)" }}>
                  {h.hour} &middot; {h.count}{h.now ? " · now" : ""}
                </span>
              </div>
            ))}
          </div>
          <div className="flex px-5.5 py-1.5 pb-4 font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
            <span className="flex-1 text-center">4am</span>
            <span className="flex-1 text-center">8am</span>
            <span className="flex-1 text-center">12pm</span>
            <span className="flex-1 text-center">4pm</span>
            <span className="flex-1 text-center">8pm</span>
          </div>
        </div>

        {/* Floor occupancy */}
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="flex justify-between items-center px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Floor occupancy</h3>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Live</span>
          </div>
          <div>
            {LOCATIONS.map((l) => (
              <div key={l.name} className="flex gap-3 items-center px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex-1">
                  <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{l.name}</div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>Capacity {l.capacity}</div>
                  <div className="h-1.5 rounded-[3px] mt-1.5 overflow-hidden" style={{ background: "var(--bg-3)" }}>
                    <div className="h-full rounded-[3px]" style={{ width: `${l.pct}%`, background: fillClass(l.level) }} />
                  </div>
                </div>
                <div className="font-mono text-[14px] tabular-nums" style={{ color: "var(--ink)" }}>
                  {l.current} <span className="font-mono text-[11px] font-normal" style={{ color: "var(--fg-3)" }}>/ {l.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live stream */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex justify-between items-center px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium flex items-center gap-2.5" style={{ color: "var(--ink)" }}>
            Live stream
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--signal)" }} />
          </h3>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>412 today &middot; streaming</span>
        </div>
        <div className="max-h-[460px] overflow-y-auto">
          {STREAM.map((s, i) => (
            <div key={i} className="grid items-center gap-3 px-4.5 py-3" style={{ gridTemplateColumns: "60px 30px 1fr auto", borderBottom: "1px solid var(--border)" }}>
              <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{s.time}</span>
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold" style={avaColor(s.avaClass)}>{s.initials}</span>
              <div>
                <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{s.name}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{s.meta}</div>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={pillColor(s.pill)}>{s.pillText}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side info: devices, broken streaks, milestones */}
      <div className="grid lg:grid-cols-3 gap-3.5">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Device health</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {DEVICES.map((d) => (
              <div key={d.name} className="flex gap-3 items-center px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex-1">
                  <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{d.name}</div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: d.danger ? "var(--danger)" : "var(--fg-3)" }}>{d.meta}</div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Recently broken streaks</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {BROKEN.map((b) => (
              <div key={b.name} className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{b.name}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{b.meta}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5" style={{ color: "var(--fg-3)" }}>Today&apos;s milestones</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {MILESTONES.map((m) => (
              <div key={m.name} className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{m.name}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{m.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GymDashboardShell>
  );
}
