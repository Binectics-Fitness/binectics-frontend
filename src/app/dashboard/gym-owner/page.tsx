import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

/**
 * Gym owner dashboard — Iron Lab · Lerato M.
 * Hardcoded to match dashboard-gym.html prototype exactly.
 * Every CSS value verified against shared.css + page styles.
 */

const KPIS = [
  { label: "Revenue · 30d", value: "R 1,084,200", suffix: " ZAR", delta: "↑ 12.4% vs prev", down: false, spark: [30,45,38,60,52,64,70,58,72,80,68,90] },
  { label: "Active members", value: "1,284", delta: "↑ 38 net new", down: false, spark: [50,55,60,58,64,68,72,75,78,80,82,86] },
  { label: "Check‑ins · today", value: "412", suffix: "/ 1,284", delta: "32% attendance", down: false, spark: [12,28,48,70,88,96,78,60,38,28,18,8] },
  { label: "Churn · 30d", value: "2.1", suffix: "%", delta: "↓ 0.4 pts", down: true, spark: [60,52,58,48,44,50,42,38,32,36,28,22] },
];

const LIVE = [
  { dot: "signal", text: <><strong className="font-medium">Sarah O.</strong> checked in via QR at Sea Point</>, ts: "just now" },
  { dot: "signal", text: <>New subscription · <strong className="font-medium">Studio monthly</strong> · Jamal S.</>, ts: "2m" },
  { dot: "warn", text: <><strong className="font-medium">Coach Themba</strong> running 4m late · 18:00 class</>, ts: "4m" },
  { dot: "signal", text: <>Class booked · <strong className="font-medium">Olympic basics</strong> · Tue 19:00</>, ts: "8m" },
  { dot: "danger", text: <>Refund request · R 850 · Pier B. · awaiting review</>, ts: "14m" },
  { dot: "signal", text: <><strong className="font-medium">14 members</strong> checked in at Foreshore in last 20m</>, ts: "22m" },
  { dot: "signal", text: <>Auto‑payout posted · R 84,200 → ABSA •••2241</>, ts: "1h" },
];

const MEMBERS = [
  { init: "JS", name: "Jamal Sutherland", plan: "Studio · monthly", loc: "Sea Point", joined: "May 02 · 09:14", status: "Active", statusType: "signal", ltv: "R 850" },
  { init: "LM", name: "Linda Mokoena", plan: "Pro · annual", loc: "Foreshore", joined: "May 01 · 18:22", status: "Active", statusType: "signal", ltv: "R 9,200" },
  { init: "WC", name: "Wei Chen", plan: "Studio · monthly", loc: "Sea Point", joined: "Apr 30 · 12:08", status: "Active", statusType: "signal", ltv: "R 1,700" },
  { init: "PB", name: "Pier Botha", plan: "Day pass", loc: "Woodstock", joined: "Apr 28 · 07:42", status: "Refund req.", statusType: "danger", ltv: "R 180" },
  { init: "TN", name: "Thandi Nkosi", plan: "Studio · monthly", loc: "Camps Bay", joined: "Apr 27 · 16:30", status: "Active", statusType: "signal", ltv: "R 2,550" },
  { init: "AA", name: "Aisha Adams", plan: "Pro · annual", loc: "Sea Point", joined: "Apr 26 · 14:11", status: "Active", statusType: "signal", ltv: "R 9,200" },
  { init: "MK", name: "Mike Khumalo", plan: "Studio · monthly", loc: "Foreshore", joined: "Apr 25 · 19:48", status: "Payment retry", statusType: "warn", ltv: "R 0" },
];

const CLASSES = [
  { time: "06:00", name: "Strength · Lower", coach: "Coach K · 60 min", cap: "14/14", capType: "full" },
  { time: "07:30", name: "HIIT · Full body", coach: "Coach Themba · 45 min", cap: "11/14", capType: "" },
  { time: "12:15", name: "Mobility flow", coach: "Marcus B. · 30 min", cap: "4/12", capType: "open" },
  { time: "17:00", name: "Strength · Upper", coach: "Coach K · 60 min", cap: "12/14", capType: "" },
  { time: "18:00", name: "Olympic basics", coach: "Coach Themba · 60 min", cap: "12/12", capType: "full" },
  { time: "19:15", name: "Conditioning", coach: "Sarah O. · 45 min", cap: "7/16", capType: "open" },
];

const PAYOUTS = [
  { date: "May 13 · 09:00", gw: "Paystack", dest: "ABSA •••2241", ref: "PO_2026_0512", amt: "R 84,200.00" },
  { date: "May 20 · 09:00", gw: "Paystack", dest: "ABSA •••2241", ref: "PO_2026_0519", amt: "R 92,640.00" },
  { date: "May 22 · 14:00", gw: "Stripe", dest: "USD account •••8104", ref: "po_1NkLwQ…", amt: "$ 1,840.00" },
  { date: "May 27 · 09:00", gw: "Paystack", dest: "ABSA •••2241", ref: "PO_2026_0526", amt: "R 88,120.00" },
];

const REVENUE_MIX = [
  { label: "Monthly subscriptions", color: "var(--ink)", value: "R 692,800 · 64%", flex: 64 },
  { label: "Annual subscriptions", color: "var(--signal)", value: "R 238,500 · 22%", flex: 22 },
  { label: "Day passes", color: "var(--gym)", value: "R 108,420 · 10%", flex: 10 },
  { label: "Personal training", color: "var(--trainer)", value: "R 44,480 · 4%", flex: 4 },
];

const ACTIONS = [
  { dot: "danger", title: "1 refund request", sub: "R 850 awaiting review", ts: "Pier Botha · 14m ago" },
  { dot: "warn", title: "3 expiring cards", sub: "auto‑retry in 3 days", ts: "Will email members tonight" },
  { dot: "signal", title: "2 staff certifications", sub: "expire in 30 days", ts: "Coach K · Sarah O." },
  { dot: "signal", title: "Tax form 2026", sub: "ready to review for Q1", ts: "SARS · due May 31" },
];

const DOT_STYLE: Record<string, React.CSSProperties> = {
  signal: { background: "var(--signal)", boxShadow: "0 0 0 4px var(--signal-soft)" },
  warn:   { background: "var(--warn)",   boxShadow: "0 0 0 4px oklch(0.96 0.05 75)" },
  danger: { background: "var(--danger)", boxShadow: "0 0 0 4px var(--danger-soft)" },
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  signal: { color: "var(--signal-ink)", borderColor: "oklch(0.88 0.05 148)", background: "var(--signal-soft)" },
  danger: { color: "var(--danger)", borderColor: "var(--danger)", background: "var(--danger-soft)" },
  warn:   { color: "var(--warn)", borderColor: "var(--warn)", background: "oklch(0.95 0.04 75)" },
};

/* ═══ PAGE ═══════════════════════════════════════════════════════ */

export default function GymOwnerDashboard() {
  return (
    <GymDashboardShell
      activeItem="Overview"
      crumb="Overview"
      actions={<button className="btn-primary-v2 sm">+ New plan</button>}
    >

          {/* Page head */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 pb-1">
            <div>
              <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Good morning, Lerato</h1>
              <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Here&apos;s how Iron Lab is doing — all 4 locations · ZAR</div>
            </div>
            {/* Time filter — inline-flex, border, r-2, bg */}
            <div className="inline-flex rounded-(--r-2) overflow-x-auto" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              {["1D", "7D", "30D", "QTD", "YTD", "Custom"].map((t, i) => (
                <span key={t} className={`px-3 py-[7px] text-[12.5px] font-mono cursor-pointer ${i < 5 ? "border-r" : ""}`} style={{ color: t === "30D" ? "var(--ink)" : "var(--fg-2)", background: t === "30D" ? "var(--bg-3)" : "transparent", borderColor: "var(--border)" }}>{t}</span>
              ))}
            </div>
          </div>

          {/* KPIs — grid 4, gap 12px */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {KPIS.map((kpi) => (
              <div key={kpi.label} className="flex flex-col gap-2 min-h-[110px] rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em] flex justify-between items-center" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
                <div className="text-[32px] font-medium leading-none" style={{ letterSpacing: "-0.022em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                  {kpi.value}{kpi.suffix && <small className="font-mono text-[14px] font-normal ml-1" style={{ color: "var(--fg-3)" }}>{kpi.suffix}</small>}
                </div>
                <div className="font-mono text-[11.5px] flex items-center gap-1" style={{ color: kpi.down ? "var(--danger)" : "var(--signal-ink)" }}>{kpi.delta}</div>
                {/* Spark — h:28px, gap:2px, flex items end */}
                <div className="flex items-end gap-0.5 h-7">
                  {kpi.spark.map((h, i) => (
                    <span key={i} className="flex-1 rounded-[1px]" style={{ height: `${h}%`, background: i === kpi.spark.length - 1 ? "var(--ink)" : "var(--bg-3)" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Chart + Live — grid 2fr 1fr, gap 12px */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">
            {/* Revenue chart card */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {/* card-head: p 14px 18px, border-bottom */}
              <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Revenue · last 30 days</h3>
                  <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>ZAR · all locations</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center h-6 px-2 rounded-(--r-1) text-[12px] font-medium" style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg-2)" }}>All locations</span>
                  <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>View report →</span>
                </div>
              </div>
              {/* chart-wrap: p 18px 18px 14px */}
              <div className="px-4.5 pt-4.5 pb-3.5">
                <div className="relative" style={{ height: "220px" }}>
                  <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="w-full h-full block">
                    <g stroke="oklch(0.91 0.006 85)" strokeWidth="1"><line x1="0" y1="20" x2="600" y2="20"/><line x1="0" y1="70" x2="600" y2="70"/><line x1="0" y1="120" x2="600" y2="120"/><line x1="0" y1="170" x2="600" y2="170"/></g>
                    <path d="M 0 130 L 22 138 L 44 124 L 66 132 L 88 118 L 110 122 L 132 110 L 154 116 L 176 100 L 198 104 L 220 96 L 242 102 L 264 90 L 286 94 L 308 86 L 330 92 L 352 78 L 374 82 L 396 74 L 418 70 L 440 66 L 462 72 L 484 60 L 506 64 L 528 56 L 550 60 L 572 50 L 600 56" fill="none" stroke="oklch(0.72 0.008 80)" strokeWidth="1.4" strokeDasharray="4 4" />
                    <path d="M 0 160 L 22 158 L 44 142 L 66 144 L 88 128 L 110 120 L 132 110 L 154 108 L 176 92 L 198 100 L 220 84 L 242 76 L 264 80 L 286 68 L 308 62 L 330 70 L 352 54 L 374 48 L 396 56 L 418 42 L 440 38 L 462 46 L 484 32 L 506 28 L 528 36 L 550 22 L 572 30 L 600 18 L 600 220 L 0 220 Z" fill="oklch(0.94 0.04 148)" />
                    <path d="M 0 160 L 22 158 L 44 142 L 66 144 L 88 128 L 110 120 L 132 110 L 154 108 L 176 92 L 198 100 L 220 84 L 242 76 L 264 80 L 286 68 L 308 62 L 330 70 L 352 54 L 374 48 L 396 56 L 418 42 L 440 38 L 462 46 L 484 32 L 506 28 L 528 36 L 550 22 L 572 30 L 600 18" fill="none" stroke="oklch(0.55 0.16 148)" strokeWidth="2" />
                    <circle cx="600" cy="18" r="4" fill="oklch(0.55 0.16 148)" />
                    <g fontFamily="Geist Mono, monospace" fontSize="10" fill="oklch(0.55 0.008 80)"><text x="6" y="14">R 50k</text><text x="6" y="64">R 38k</text><text x="6" y="114">R 26k</text><text x="6" y="164">R 14k</text></g>
                    <g fontFamily="Geist Mono, monospace" fontSize="10" fill="oklch(0.55 0.008 80)" textAnchor="middle"><text x="50" y="212">Apr 14</text><text x="200" y="212">Apr 21</text><text x="350" y="212">Apr 28</text><text x="500" y="212">May 05</text><text x="580" y="212">today</text></g>
                  </svg>
                </div>
              </div>
              {/* chart-legend: gap 16px, p 0 18px 14px, font-size 12px */}
              <div className="flex gap-4 px-4.5 pb-3.5 text-[12px]" style={{ color: "var(--fg-2)" }}>
                <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: "oklch(0.55 0.16 148)" }} />This period · R 1.08M</span>
                <span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: "oklch(0.72 0.008 80)" }} />Previous · R 964k</span>
              </div>
            </div>

            {/* Live activity */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Live activity</h3>
                  <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Auto‑updating · all locations</div>
                </div>
                <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium" style={{ background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)", color: "var(--signal-ink)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />Live
                </span>
              </div>
              {/* live-feed: p 4px 0, max-h 380px */}
              <div className="py-1 overflow-hidden" style={{ maxHeight: "380px" }}>
                {LIVE.map((row, i) => (
                  <div key={i} className="flex gap-3 px-4.5 py-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={DOT_STYLE[row.dot]} />
                    <span className="text-[13px] flex-1" style={{ color: "var(--ink)" }}>{row.text}</span>
                    <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--fg-3)" }}>{row.ts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Members + Classes — grid 2fr 1fr, gap 12px */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">
            {/* Members table */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Recent members</h3>
                  <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Joined or upgraded in last 30 days</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost-v2 sm">Export CSV</button>
                  <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>All members →</span>
                </div>
              </div>
              {/* table: w-full, collapse, font-size 13.5px */}
              <div className="overflow-x-auto"><table className="w-full border-collapse text-[13.5px] min-w-[600px]">
                <thead>
                  <tr>
                    {["Member", "Plan", "Location", "Joined", "Status", "LTV"].map((h, i) => (
                      <th key={h} className={`text-left font-medium font-mono text-[11px] uppercase tracking-[0.04em] px-4.5 py-3 ${i === 5 ? "text-right" : ""}`} style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MEMBERS.map((m, idx) => (
                    <tr key={m.init} className="hover:bg-bg-2" style={{ transition: "background 60ms" }}>
                      <td className="px-4.5 py-3" style={{ borderBottom: idx < MEMBERS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{m.init}</span>
                          {m.name}
                        </div>
                      </td>
                      <td className="px-4.5 py-3" style={{ borderBottom: idx < MEMBERS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{m.plan}</td>
                      <td className="px-4.5 py-3" style={{ borderBottom: idx < MEMBERS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{m.loc}</td>
                      <td className="px-4.5 py-3 font-mono text-[12px]" style={{ borderBottom: idx < MEMBERS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{m.joined}</td>
                      <td className="px-4.5 py-3" style={{ borderBottom: idx < MEMBERS.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium" style={{ ...STATUS_STYLE[m.statusType], border: `1px solid ${STATUS_STYLE[m.statusType].borderColor}` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />{m.status}
                        </span>
                      </td>
                      <td className="px-4.5 py-3 text-right font-mono" style={{ borderBottom: idx < MEMBERS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{m.ltv}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>

            {/* Today's classes */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Today&apos;s classes</h3>
                  <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Mon · May 11 · Sea Point</div>
                </div>
                <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>Full schedule →</span>
              </div>
              {/* Info card — bg signal-soft, border-bottom, p 16px 18px, gap 14px */}
              <div className="flex gap-3.5 px-4.5 py-4 items-start" style={{ background: "var(--signal-soft)", borderBottom: "1px solid var(--border)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--signal-ink)" }}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
                <div className="text-[13.5px] leading-relaxed" style={{ color: "var(--ink)" }}><strong className="font-medium">Coach Themba</strong> is running 4 minutes late for the 18:00 Olympic block. Auto‑notice sent to 12 attendees.</div>
              </div>
              {/* sched-day: p 12px 18px 6px, mono 11px uppercase */}
              <div className="font-mono text-[11px] uppercase tracking-[0.04em] px-4.5 pt-3 pb-1.5" style={{ color: "var(--fg-3)" }}>Today · Mon May 11</div>
              {/* class-row: grid 64px 1fr auto, gap 12px, p 8px 18px */}
              {CLASSES.map((c) => (
                <div key={c.time} className="grid gap-3 px-4.5 py-2 items-center hover:bg-bg-2" style={{ gridTemplateColumns: "64px 1fr auto", transition: "background 60ms" }}>
                  <span className="font-mono text-[12.5px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{c.time}</span>
                  <div>
                    <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{c.name}</div>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>{c.coach}</div>
                  </div>
                  <span className="font-mono text-[12.5px]" style={{ color: c.capType === "full" ? "var(--danger)" : c.capType === "open" ? "var(--signal-ink)" : "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>{c.cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payouts + Revenue mix + Action queue — grid 2fr 1fr 1fr, gap 12px */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-3">
            {/* Payouts */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Upcoming payouts</h3>
                  <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Next 14 days · Paystack + Stripe</div>
                </div>
                <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>Payout settings →</span>
              </div>
              <div className="overflow-x-auto"><table className="w-full border-collapse text-[13.5px] min-w-[600px]">
                <thead>
                  <tr>
                    {["Date", "Gateway", "Destination", "Reference", "Net amount"].map((h, i) => (
                      <th key={h} className={`text-left font-medium font-mono text-[11px] uppercase tracking-[0.04em] px-4.5 py-3 ${i === 4 ? "text-right" : ""}`} style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAYOUTS.map((p, idx) => (
                    <tr key={p.ref} className="hover:bg-bg-2">
                      <td className="px-4.5 py-3 font-mono text-[12px]" style={{ borderBottom: idx < PAYOUTS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{p.date}</td>
                      <td className="px-4.5 py-3" style={{ borderBottom: idx < PAYOUTS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{p.gw}</td>
                      <td className="px-4.5 py-3" style={{ borderBottom: idx < PAYOUTS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{p.dest}</td>
                      <td className="px-4.5 py-3 font-mono text-[12px]" style={{ borderBottom: idx < PAYOUTS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{p.ref}</td>
                      <td className="px-4.5 py-3 text-right font-mono" style={{ borderBottom: idx < PAYOUTS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{p.amt}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>

            {/* Revenue mix */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Revenue mix</h3>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>30 days</div>
              </div>
              <div className="p-4.5">
                {/* Bar: h 12px, rounded 6px, gap 2px */}
                <div className="flex h-3 rounded-1.5 overflow-hidden gap-0.5">
                  {REVENUE_MIX.map((r) => <div key={r.label} style={{ flex: r.flex, background: r.color }} />)}
                </div>
                {/* Legend: gap 8px, mt 16px, font-size 13px */}
                <div className="flex flex-col gap-2 mt-4 text-[13px]">
                  {REVENUE_MIX.map((r) => (
                    <div key={r.label} className="flex justify-between">
                      <span style={{ color: "var(--ink)" }}><span className="inline-block w-2 h-2 rounded-sm mr-2 align-middle" style={{ background: r.color }} />{r.label}</span>
                      <span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action queue */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Action queue</h3>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Things waiting on you</div>
              </div>
              {/* p 4px 0 8px */}
              <div className="py-1 pb-2">
                {ACTIONS.map((a, i) => (
                  <div key={i} className="flex gap-3 px-4.5 py-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={DOT_STYLE[a.dot]} />
                    <div className="flex-1">
                      <div className="text-[13px]" style={{ color: "var(--ink)" }}><strong className="font-medium">{a.title}</strong> · {a.sub}</div>
                      <div className="font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>{a.ts}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

    </GymDashboardShell>
  );
}
