import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar",
  description: "View and manage your upcoming sessions, bookings, and events.",
};

/**
 * Calendar — calendar.html prototype.
 * 3-column layout: 232px trainer sidebar + main weekly calendar + 320px rail.
 * Calendar: header with week number, nav, today, view toggle.
 * Days row with counts. Grid: hour column (06:00-19:00), 7 day columns
 * with availability blocks, session events, now-line.
 * Rail: this-week stats, working hours, booking rules, mini month, color key, synced cals.
 */

const DAYS = [
  { dow: "Mon", d: 18, count: "5 sessions", today: false },
  { dow: "Tue", d: 19, count: "4 sessions", today: true },
  { dow: "Wed", d: 20, count: "6 sessions", today: false },
  { dow: "Thu", d: 21, count: "5 sessions", today: false },
  { dow: "Fri", d: 22, count: "4 sessions", today: false },
  { dow: "Sat", d: 23, count: "2 classes", today: false },
  { dow: "Sun", d: 24, count: "off", today: false },
];

const HOURS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
];

/** Events data - positioned with top/height in hour-cell units (56px per hour) */
type Ev = { time: string; name: string; sub?: string; col: number; top: number; height: number; type?: string };

const EVENTS: Ev[] = [
  // Monday (col 0)
  { time: "06:30 · 60 min", name: "Jamal Chen", col: 0, top: 30, height: 60, type: "held" },
  { time: "08:00 · 60 min", name: "Linda Mokoena", col: 0, top: 114, height: 60, type: "held" },
  { time: "09:30 · 90 min", name: "Wei Chen", sub: "Olympic basics", col: 0, top: 198, height: 90, type: "held" },
  { time: "11:30 · 30 min · Zoom", name: "Aisha A.", col: 0, top: 308, height: 30, type: "online held" },
  { time: "15:30 · 60 min", name: "Thandi Nkosi", col: 0, top: 534, height: 60, type: "held" },
  { time: "17:00 · 60 min", name: "Mike Khumalo", col: 0, top: 618, height: 60, type: "held" },
  // Tuesday (col 1)
  { time: "07:00 · 60 min", name: "Rashid Jansen", col: 1, top: 56, height: 60, type: "held" },
  { time: "09:00 · 60 min", name: "Pam Adler", col: 1, top: 168, height: 60, type: "held" },
  { time: "11:00 · 60 min", name: "Linda Mokoena", sub: "Sea Point · upper body", col: 1, top: 280, height: 60 },
  { time: "15:30 · 90 min", name: "Olu Bankole", sub: "Powerlifting prep", col: 1, top: 504, height: 90 },
  { time: "17:00 · 75 min", name: "Nthabiseng K. · first", sub: "Intake + movement", col: 1, top: 618, height: 75, type: "first" },
  // Wednesday (col 2)
  { time: "06:00 · 60 min", name: "Mike Khumalo", col: 2, top: 0, height: 60, type: "held" },
  { time: "08:00 · 60 min", name: "Jamal Chen", col: 2, top: 112, height: 60 },
  { time: "09:30 · 90 min", name: "Tunde Adebayo", sub: "First session", col: 2, top: 196, height: 90, type: "first" },
  { time: "15:00 · 60 min", name: "Linda Mokoena", col: 2, top: 504, height: 60 },
  { time: "16:30 · 60 min", name: "Wei Chen", col: 2, top: 588, height: 60 },
  { time: "17:30 · 60 min", name: "Rashid Jansen", col: 2, top: 644, height: 60 },
  // Thursday (col 3)
  { time: "07:00 · 60 min", name: "Pam Adler", col: 3, top: 56, height: 60 },
  { time: "09:00 · 90 min", name: "Group class", sub: "Barbell basics · 6/8", col: 3, top: 168, height: 90, type: "class" },
  { time: "15:00 · 60 min", name: "Aisha A.", sub: "Online · Zoom", col: 3, top: 504, height: 60, type: "online" },
  { time: "16:30 · 60 min", name: "Thandi Nkosi", col: 3, top: 588, height: 60 },
  { time: "17:30 · 60 min", name: "Mike Khumalo", col: 3, top: 644, height: 60 },
  // Friday (col 4)
  { time: "06:30 · 60 min", name: "Jamal Chen", col: 4, top: 28, height: 60 },
  { time: "08:00 · 60 min", name: "Wei Chen", col: 4, top: 112, height: 60 },
  { time: "10:00 · 45 min", name: "Nthabiseng K.", col: 4, top: 224, height: 45 },
  { time: "15:00 · 60 min", name: "Olu Bankole", col: 4, top: 504, height: 60 },
  // Saturday (col 5)
  { time: "08:00 · 90 min", name: "Saturday strength", sub: "Group · 12/16", col: 5, top: 112, height: 90, type: "class" },
  { time: "10:00 · 60 min", name: "Open gym coaching", sub: "Drop-in", col: 5, top: 224, height: 60, type: "class" },
];

const STATS = [
  { label: "Sessions", value: "26", sub: "/32", delta: "+3 vs last week" },
  { label: "Forecast", value: "R31.2k", delta: "+8% vs avg" },
  { label: "First sessions", value: "2", delta: "" },
  { label: "Hours", value: "29.5", delta: "" },
];

const WORK_HOURS = [
  { day: "Mon", hours: "06:00 – 18:00", on: true },
  { day: "Tue", hours: "06:00 – 18:00", on: true },
  { day: "Wed", hours: "06:00 – 18:00", on: true },
  { day: "Thu", hours: "06:00 – 18:00", on: true },
  { day: "Fri", hours: "06:00 – 16:00", on: true },
  { day: "Sat", hours: "08:00 – 12:00", on: true },
  { day: "Sun", hours: "Off", on: false },
];

const MINI_CAL_DAYS = [
  [28,29,30,1,2,3,4],
  [5,6,7,8,9,10,11],
  [12,13,14,15,16,17,18],
  [19,20,21,22,23,24,25],
  [26,27,28,29,30,31,1],
];

const COLOR_KEY = [
  { color: "var(--ink)", label: "In-person" },
  { color: "var(--gym)", label: "Online" },
  { color: "var(--signal)", label: "First session" },
  { color: "var(--trainer)", label: "Group class" },
  { color: "var(--fg-3)", label: "Blocked" },
];

function eventBorderColor(type?: string) {
  if (type?.includes("first")) return "var(--signal)";
  if (type?.includes("online")) return "var(--gym)";
  if (type?.includes("class")) return "var(--trainer)";
  if (type?.includes("block")) return "var(--fg-3)";
  return "var(--ink)";
}

function eventBg(type?: string) {
  if (type?.includes("online")) return "var(--gym-soft)";
  if (type?.includes("class")) return "var(--trainer-soft)";
  return "var(--bg)";
}

export default function CalendarPage() {
  return (
    <div className="grid h-screen overflow-hidden grid-cols-1 lg:grid-cols-[232px_1fr_320px]" style={{ background: "var(--bg-2)" }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside className="hidden lg:flex flex-col gap-6 h-screen overflow-y-auto" style={{ background: "var(--bg)", borderRight: "1px solid var(--border)", padding: "18px 14px" }}>
        <Link href="/"><BinecticsLockup /></Link>
        <div className="flex items-center gap-2.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)", padding: "8px 10px", background: "var(--bg)" }}>
          <span className="w-6.5 h-6.5 rounded-full flex items-center justify-center font-semibold text-[11px]" style={{ background: "var(--trainer)", color: "oklch(0.2 0.05 75)" }}>SO</span>
          <div style={{ flex: 1 }}>
            <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Sarah Okafor</div>
            <div className="font-mono text-[11px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>Trainer &middot; Cape Town</div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          <div className="font-mono text-[10.5px] uppercase px-2 py-1 mb-1" style={{ color: "var(--fg-4)", letterSpacing: "0.06em" }}>Work</div>
          {[
            { href: "/dashboard", label: "Today" },
            { href: "/dashboard/calendar", label: "Calendar", on: true },
            { href: "/dashboard/messages", label: "Inbox", badge: "7" },
          ].map((n) => (
            <Link key={n.label} href={n.href} className={`flex items-center gap-2.5 px-2 py-1.75 rounded-(--r-2) text-[13.5px] ${n.on ? "bg-bg-3 font-medium" : "hover:bg-bg-2"}`} style={{ color: n.on ? "var(--ink)" : "var(--fg-2)" }}>
              {n.label}
              {n.badge && <span className="ml-auto font-mono text-[11px] px-1.5 rounded-full" style={{ color: "var(--fg-3)", background: "var(--bg-2)" }}>{n.badge}</span>}
            </Link>
          ))}
          <div className="font-mono text-[10.5px] uppercase px-2 py-1 mt-3 mb-1" style={{ color: "var(--fg-4)", letterSpacing: "0.06em" }}>Practice</div>
          {[
            { href: "/dashboard/dietitian/earnings", label: "Earnings" },
            { href: "/dashboard/profile-edit", label: "My profile" },
            { href: "/dashboard/settings", label: "Settings" },
          ].map((n) => (
            <Link key={n.label} href={n.href} className="flex items-center gap-2.5 px-2 py-1.75 rounded-(--r-2) text-[13.5px] hover:bg-bg-2" style={{ color: "var(--fg-2)" }}>{n.label}</Link>
          ))}
        </nav>
      </aside>

      {/* ═══ CALENDAR ═══ */}
      <main className="flex flex-col min-w-0 h-screen" style={{ background: "var(--bg)" }}>
        {/* Header */}
        <div className="flex items-center justify-between shrink-0" style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3.5">
            <h1 className="text-[22px] font-medium" style={{ letterSpacing: "-0.018em", color: "var(--ink)" }}>
              Week 21 <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>&middot; May 2026</span>
            </h1>
            <div className="inline-flex border border-border rounded-(--r-2)">
              <button className="w-7 h-7 flex items-center justify-center hover:bg-bg-2" style={{ borderRight: "1px solid var(--border)", color: "var(--fg-2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button className="w-7 h-7 flex items-center justify-center hover:bg-bg-2" style={{ color: "var(--fg-2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
            <button className="h-7 px-3 border border-border rounded-(--r-2) font-mono text-[11px] uppercase hover:bg-bg-2" style={{ color: "var(--ink)", letterSpacing: "0.04em" }}>Today</button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="inline-flex border border-border rounded-(--r-2)">
              {["Day", "Week", "Month"].map((v) => (
                <button key={v} className="h-7 px-3 font-mono text-[11px] uppercase" style={{ color: v === "Week" ? "var(--bg)" : "var(--fg-2)", background: v === "Week" ? "var(--ink)" : "var(--bg)", letterSpacing: "0.04em", borderRight: v !== "Month" ? "1px solid var(--border)" : "none" }}>{v}</button>
              ))}
            </div>
            <button className="btn-ghost-v2 sm">Block off</button>
            <button className="btn-primary-v2 sm">+ New session</button>
          </div>
        </div>

        {/* Days row */}
        <div className="grid shrink-0" style={{ gridTemplateColumns: "64px repeat(7, 1fr)", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
          <div style={{ borderRight: "1px solid var(--border)" }} />
          {DAYS.map((day) => (
            <div key={day.dow} className="flex flex-col gap-0.5" style={{ padding: "10px 12px", borderRight: "1px solid var(--border)" }}>
              <div className="font-mono text-[10.5px] uppercase" style={{ color: day.today ? "var(--ink)" : "var(--fg-3)", letterSpacing: "0.06em" }}>{day.dow}</div>
              {day.today ? (
                <div className="text-[18px] font-medium leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <span className="inline-block rounded-[4px] px-1.75 py-0.5" style={{ background: "var(--ink)", color: "var(--bg)" }}>{day.d}</span>
                </div>
              ) : (
                <div className="text-[18px] font-medium leading-none" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.022em", color: "var(--ink)" }}>{day.d}</div>
              )}
              <div className="font-mono text-[10.5px] uppercase mt-0.5" style={{ color: day.count === "off" ? "var(--fg-4)" : "var(--fg-4)", letterSpacing: "0.04em" }}>{day.count}</div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid relative" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
            {/* Hour column */}
            <div style={{ borderRight: "1px solid var(--border)" }}>
              {HOURS.map((h) => (
                <div key={h} className="relative" style={{ height: 56, borderBottom: "1px solid var(--border)" }}>
                  <span className="absolute font-mono text-[10px] px-1" style={{ top: -8, right: 8, color: "var(--fg-3)", background: "var(--bg)" }}>{h}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {Array.from({ length: 7 }, (_, colIdx) => (
              <div key={colIdx} className="relative" style={{ borderRight: colIdx < 6 ? "1px solid var(--border)" : "none" }}>
                {/* Grid lines */}
                {HOURS.map((h) => (
                  <div key={h} style={{ height: 56, borderBottom: "1px solid var(--border)" }} />
                ))}

                {/* Availability blocks (Mon-Fri morning/afternoon, Sat morning only) */}
                {colIdx < 5 && (
                  <>
                    <div className="absolute" style={{ top: 56, height: 280, left: 4, right: 4, background: "repeating-linear-gradient(135deg, oklch(0.95 0.02 148) 0 6px, oklch(0.97 0.015 148) 6px 12px)", borderLeft: "2px solid var(--signal)", borderRadius: "var(--r-2)", pointerEvents: "none" }} />
                    <div className="absolute" style={{ top: 504, height: 224, left: 4, right: 4, background: "repeating-linear-gradient(135deg, oklch(0.95 0.02 148) 0 6px, oklch(0.97 0.015 148) 6px 12px)", borderLeft: "2px solid var(--signal)", borderRadius: "var(--r-2)", pointerEvents: "none" }} />
                  </>
                )}
                {colIdx === 5 && (
                  <div className="absolute" style={{ top: 112, height: 168, left: 4, right: 4, background: "repeating-linear-gradient(135deg, oklch(0.95 0.02 148) 0 6px, oklch(0.97 0.015 148) 6px 12px)", borderLeft: "2px solid var(--signal)", borderRadius: "var(--r-2)", pointerEvents: "none" }} />
                )}

                {/* Now line on Tuesday */}
                {colIdx === 1 && (
                  <div className="absolute" style={{ top: 472, left: 0, right: 0, height: 1, background: "var(--danger)", zIndex: 4, pointerEvents: "none" }}>
                    <span className="absolute w-2.75 h-2.75 rounded-full" style={{ left: -6, top: -5, background: "var(--danger)" }} />
                  </div>
                )}

                {/* Events for this column */}
                {EVENTS.filter((e) => e.col === colIdx).map((e, i) => (
                  <div
                    key={`${e.name}-${i}`}
                    className="absolute cursor-pointer overflow-hidden"
                    style={{
                      top: e.top,
                      height: e.height,
                      left: 6,
                      right: 6,
                      background: eventBg(e.type),
                      border: "1px solid var(--border)",
                      borderLeft: `3px solid ${eventBorderColor(e.type)}`,
                      borderRadius: "var(--r-2)",
                      padding: "6px 10px",
                      zIndex: 2,
                      opacity: e.type?.includes("held") ? 0.55 : 1,
                    }}
                  >
                    <div className="font-mono text-[10px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.04em", marginBottom: 2 }}>{e.time}</div>
                    <div className="text-[12.5px] font-medium truncate" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>
                      {e.name} {e.type?.includes("held") ? "✓" : ""}
                    </div>
                    {e.sub && e.height >= 60 && (
                      <div className="font-mono text-[10px] uppercase mt-0.5" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>{e.sub}</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ═══ RIGHT RAIL ═══ */}
      <aside className="hidden lg:flex flex-col gap-4.5 h-screen overflow-y-auto" style={{ background: "var(--bg-2)", borderLeft: "1px solid var(--border)", padding: "18px" }}>
        {/* Stats */}
        <div>
          <div className="font-mono text-[10.5px] uppercase mb-2.5" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>This week</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-2">
              {STATS.map((s, i) => (
                <div key={s.label} className="flex flex-col gap-0.5" style={{ padding: "12px 14px", borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                  <div className="font-mono text-[10px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>{s.label}</div>
                  <div className="text-[18px] font-medium leading-none mt-0.5" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.018em" }}>{s.value}{s.sub && <small className="font-mono text-[11px] font-normal ml-0.5" style={{ color: "var(--fg-3)" }}>{s.sub}</small>}</div>
                  {s.delta && <div className="font-mono text-[10px] mt-1" style={{ color: "var(--signal-ink)" }}>{s.delta}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Working hours */}
        <div>
          <div className="font-mono text-[10.5px] uppercase mb-2.5" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Working hours</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {WORK_HOURS.map((w, i) => (
              <div key={w.day} className="grid items-center" style={{ gridTemplateColumns: "36px 1fr 28px", gap: 8, padding: "9px 14px", borderBottom: i < WORK_HOURS.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span className="font-mono text-[11px] uppercase" style={{ color: "var(--ink)", letterSpacing: "0.04em" }}>{w.day}</span>
                <span className="font-mono text-[12px]" style={{ color: w.on ? "var(--ink)" : "var(--fg-4)", fontVariantNumeric: "tabular-nums" }}>{w.hours}</span>
                <span className="w-7 h-4 rounded-full relative" style={{ background: w.on ? "var(--ink)" : "var(--border-2)" }}>
                  <span className="absolute w-3 h-3 rounded-full top-0.5" style={{ background: "var(--bg)", left: w.on ? 14 : 2 }} />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking rules */}
        <div>
          <div className="font-mono text-[10.5px] uppercase mb-2.5" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Booking rules</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {[
              { k: "Min notice", v: "4h" },
              { k: "Max horizon", v: "30 days" },
              { k: "Buffer between", v: "15 min" },
            ].map((r, i) => (
              <div key={r.k} className="flex justify-between items-center text-[12.5px]" style={{ padding: "10px 14px", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                <span style={{ color: "var(--fg-3)" }}>{r.k}</span>
                <span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mini month calendar */}
        <div>
          <div className="font-mono text-[10.5px] uppercase mb-2.5" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>May 2026</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "12px 14px" }}>
            <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <span key={i} className="font-mono text-[9.5px] uppercase text-center py-1" style={{ color: "var(--fg-4)" }}>{d}</span>
              ))}
              {MINI_CAL_DAYS.flat().map((d, i) => {
                const isMuted = (i < 3) || (i === MINI_CAL_DAYS.flat().length - 1);
                const isToday = d === 19 && !isMuted;
                const hasEvent = [18,19,20,21,22,23].includes(d) && !isMuted;
                return (
                  <span key={i} className="aspect-square flex items-center justify-center font-mono text-[10.5px] rounded-(--r-2) relative cursor-pointer" style={{ color: isToday ? "var(--bg)" : isMuted ? "var(--fg-4)" : "var(--ink)", background: isToday ? "var(--ink)" : "transparent", fontVariantNumeric: "tabular-nums" }}>
                    {d}
                    {hasEvent && !isToday && <span className="absolute bottom-1 w-0.75 h-0.75 rounded-full" style={{ background: "var(--ink)" }} />}
                    {hasEvent && isToday && <span className="absolute bottom-1 w-0.75 h-0.75 rounded-full" style={{ background: "var(--bg)" }} />}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Color key */}
        <div>
          <div className="font-mono text-[10.5px] uppercase mb-2.5" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Color key</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {COLOR_KEY.map((c, i) => (
              <div key={c.label} className="flex items-center gap-2 text-[12px]" style={{ padding: "8px 14px", borderBottom: i < COLOR_KEY.length - 1 ? "1px solid var(--border)" : "none", color: "var(--fg-2)" }}>
                <span className="w-2.5 h-2.5 rounded-[1px]" style={{ borderLeft: `3px solid ${c.color}` }} />
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* Synced calendars */}
        <div>
          <div className="font-mono text-[10.5px] uppercase mb-2.5" style={{ color: "var(--fg-3)", letterSpacing: "0.06em" }}>Synced calendars</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {[
              { name: "Google Calendar", sub: "2-way sync · last refresh 4m ago", status: "Synced" },
              { name: "Apple Calendar", sub: "Read-only · last refresh 2h ago", status: "Synced" },
            ].map((c, i) => (
              <div key={c.name} className="flex items-center gap-2.5" style={{ padding: "10px 14px", borderBottom: i < 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>{c.name}</div>
                  <div className="font-mono text-[10.5px] uppercase mt-0.5" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>{c.sub}</div>
                </div>
                <span className="font-mono text-[10px] uppercase" style={{ color: "var(--signal-ink)", letterSpacing: "0.05em" }}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
