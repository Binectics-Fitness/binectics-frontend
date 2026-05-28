import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { NewPlanButton } from "./_actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dietitian Dashboard",
  description: "Nutrition practice overview with clients, adherence, and earnings.",
};

/**
 * Dietitian dashboard — Dr Nadia Hassan · Lagos
 * Hardcoded to match dashboard-dietitian.html prototype.
 */

const STATS = [
  { label: "Active clients", value: "68", delta: "+ 5 this month" },
  { label: "Adherence · 30d avg", value: "76", suffix: "%", delta: "↑ 4 pts vs apr" },
  { label: "Plans expiring · 7d", value: "9", delta: "Renewal nudge sent", warn: true },
  { label: "Earnings · MTD", value: "₦ 1.84M", delta: "↑ 9% vs apr" },
];

const CONSULTS = [
  { time: "08:00", init: "FA", name: "Folake Adebayo", meta: "Initial assessment · PCOS · 75 min · Video", type: "intake", badge: "New · intake", badgeStyle: "signal", actions: ["Intake form", "Start consult"] },
  { time: "10:00", init: "BO", name: "Bisi Okonkwo", meta: "Wk 6 review · cutting protocol · 30 min · 76% adherence", type: "review", badge: "Online", badgeStyle: "gym", actions: ["Open plan", "Join"] },
  { time: "11:30", init: "KE", name: "Kemi Eze", meta: "Wk 12 check‑in · maintenance · 30 min · in‑person VI", actions: ["Open plan", "Check‑in"] },
  { time: "14:00", init: "CO", name: "Chinedu O.", meta: "Wk 4 review · sport performance · 45 min · Iron Lab Lagos", actions: ["Open plan", "Check‑in"], afterGap: true },
  { time: "15:30", init: "AT", name: "Adaora T.", meta: "Refund issued · rebooked May 14, 11:00", type: "cancelled", badge: "Cancelled · 09:14", badgeStyle: "danger" },
  { time: "16:30", init: "SA", name: "Samuel Akinwale", meta: "Initial · type 2 diabetes referral · 75 min · video", type: "intake", badge: "New · intake", badgeStyle: "signal", actions: ["Intake form", "Start consult"], last: true },
];

const CLIENTS = [
  { init: "BO", name: "Bisi Okonkwo", plan: "Cutting · wk 6 / 12", kcal: "1,650 kcal target", spark: [78,92,64,88,80,84,90], sparkTypes: ["good","good","ok","good","good","good","good"], adherence: "82%", macros: [{k:"P",w:92,v:"138g"},{k:"C",w:70,v:"122g"},{k:"F",w:80,v:"52g"}], flag: "On track", flagType: "green" },
  { init: "KE", name: "Kemi Eze", plan: "Maintenance · wk 12 / 16", kcal: "2,100 kcal target", spark: [85,78,88,92,80,86,84], sparkTypes: ["good","good","good","good","good","good","good"], adherence: "93%", macros: [{k:"P",w:95,v:"155g"},{k:"C",w:88,v:"220g"},{k:"F",w:92,v:"68g"}], flag: "Excellent", flagType: "green" },
  { init: "CO", name: "Chinedu Okoro", plan: "Sport perf · wk 4 / 8", kcal: "3,200 kcal target", spark: [60,55,30,80,65,78,82], sparkTypes: ["ok","ok","miss","good","ok","good","good"], adherence: "64%", macros: [{k:"P",w:70,v:"168g"},{k:"C",w:52,v:"240g"},{k:"F",w:65,v:"82g"}], flag: "Needs nudge", flagType: "amber" },
  { init: "AT", name: "Adaora Tunde", plan: "PCOS · wk 3 / 12", kcal: "1,750 kcal target", spark: [22,18,0,0,28,0,0], sparkTypes: ["miss","miss","miss","miss","miss","miss","miss"], adherence: "12%", macros: [{k:"P",w:18,v:"28g"},{k:"C",w:12,v:"22g"},{k:"F",w:8,v:"5g"}], flag: "4d silent", flagType: "red" },
  { init: "MO", name: "Maryam Olawale", plan: "Gestational · wk 8 / 12", kcal: "2,300 kcal target", spark: [88,84,80,92,86,78,82], sparkTypes: ["good","good","good","good","good","good","good"], adherence: "86%", macros: [{k:"P",w:88,v:"142g"},{k:"C",w:80,v:"258g"},{k:"F",w:85,v:"78g"}], flag: "On track", flagType: "green" },
];

const TEMPLATES = [
  { t: "Cutting · West African staples · 1,650 kcal", s: "Halal · high‑P · 4 weeks · jollof / beans / fish base", used: "used 14×" },
  { t: "PCOS protocol · low‑GI · 1,800 kcal", s: "Inositol guidance · 12 weeks", used: "used 9×" },
  { t: "Type 2 diabetes · stepped carb · 1,950 kcal", s: "CGM‑aware · 16 weeks", used: "used 22×" },
  { t: "Sport performance · contact sports · 3,200 kcal", s: "Periodised · creatine timing · 8 weeks", used: "used 6×" },
];

const ACTIONS = [
  { bar: "var(--danger)", t: "Adaora T. · 4 days silent", s: "No logs since May 7 · auto‑nudge failed. Personal check‑in recommended.", btn: "Open" },
  { bar: "var(--warn)", t: "2 new plans due today", s: "Folake A. (after intake) · Samuel A. (after intake)", btn: "Queue" },
  { bar: "var(--gym)", t: "3 follow‑up logs to review", s: "Bisi O. · Chinedu O. · Maryam O. — photos & weigh‑ins attached", btn: "Review" },
  { bar: "var(--signal)", t: "9 plans expire in 7 days", s: "Renewal nudges already sent · 4 viewed", btn: "Track" },
];

const MESSAGES = [
  { init: "BO", name: "Bisi Okonkwo", pill: "Log", ts: "12m", preview: "Weight is down 1.4 kg this week, energy good. Photo attached…", unread: true },
  { init: "CO", name: "Chinedu Okoro", pill: "Question", ts: "38m", preview: "Two‑a‑days this week, should I push carbs up on training days?", unread: true },
  { init: "MO", name: "Maryam Olawale", pill: "Log", ts: "1h", preview: "Iron supplement makes me nauseous on empty stomach, can I take it…", unread: true },
  { init: "FA", name: "Folake Adebayo", ts: "3h", preview: "Intake form submitted — see you at 08:00 tomorrow. Excited!", unread: false },
  { init: "KE", name: "Kemi Eze", ts: "Yesterday", preview: "Confirmed renewal for the next 16‑week block 🙏", unread: false },
];

const EARNINGS = [
  { t: "Maintenance · 16wk plan", s: "Kemi E. · May 04 · renewal", amt: "+ ₦ 480,000", color: "var(--signal-ink)" },
  { t: "PCOS protocol · 12wk", s: "Adaora T. · Apr 28", amt: "+ ₦ 360,000", color: "var(--signal-ink)" },
  { t: "Sport perf · 8wk", s: "Chinedu O. · Apr 22", amt: "+ ₦ 280,000", color: "var(--signal-ink)" },
  { t: "Initial assessments · 3×", s: "May 11 · today", amt: "₦ 165,000 pending", color: "var(--fg-3)" },
  { t: "Refund · Adaora T.", s: "15:30 consult cancelled", amt: "− ₦ 18,000", color: "var(--danger)" },
];

const BORDER_LEFT: Record<string, string> = { intake: "var(--signal)", review: "var(--gym)", cancelled: "var(--fg-4)" };
const BADGE_S: Record<string, React.CSSProperties> = {
  signal: { background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)", color: "var(--signal-ink)" },
  gym: { background: "transparent", border: "1px solid var(--gym)", color: "var(--gym)" },
  danger: { background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)" },
};
const SPARK_BG: Record<string, string> = { good: "var(--signal)", ok: "oklch(0.85 0.06 148)", miss: "oklch(0.88 0.02 80)" };
const FLAG_S: Record<string, React.CSSProperties> = {
  green: { background: "var(--signal-soft)", color: "var(--signal-ink)" },
  amber: { background: "oklch(0.94 0.06 75)", color: "oklch(0.35 0.12 75)" },
  red: { background: "var(--danger-soft)", color: "var(--danger)" },
};

/* ═══ PAGE ═══ */

export default function DietitianDashboard() {
  return (
    <DietitianDashboardShell
      activeItem="Today"
      crumb="Today"
      actions={<><button className="btn-ghost-v2 sm">View public profile →</button><NewPlanButton /></>}
    >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
            <div>
              <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Today, Nadia</h1>
              <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Mon · May 11 · 5 consults · 3 follow‑ups · 2 plans due</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost-v2 sm">Block off time</button>
              <button className="btn-ghost-v2 sm">Copy link to book</button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col gap-1.5 rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.label}</div>
                <div className="text-[28px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.value}{s.suffix && <small className="font-mono text-[13px] font-normal ml-1" style={{ color: "var(--fg-3)" }}>{s.suffix}</small>}</div>
                <div className="font-mono text-[12px]" style={{ color: s.warn ? "oklch(0.45 0.16 65)" : "var(--signal-ink)" }}>{s.delta}</div>
              </div>
            ))}
          </div>

          {/* Two-col: 1.7fr 1fr */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-3 items-start">

            {/* LEFT */}
            <div className="flex flex-col gap-3">
              {/* Consults timeline */}
              <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Today&apos;s consults</h3>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>5 confirmed · 1 cancellation · 3 follow‑up logs to review</div>
                  </div>
                  <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>Open calendar →</span>
                </div>
                <div className="grid py-2" style={{ gridTemplateColumns: "70px 1fr" }}>
                  {CONSULTS.map((c, i) => {
                    const bl = BORDER_LEFT[c.type || ""] || "var(--dietitian)";
                    return (
                      <div key={i} className="contents">
                        {c.afterGap && (
                          <>
                            <div />
                            <div className="flex items-center gap-2 px-4.5 py-1.5 font-mono text-[11px]" style={{ color: "var(--fg-4)" }}>
                              <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
                              12:30 – 14:00 · 90 min · lunch &amp; admin
                              <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
                            </div>
                          </>
                        )}
                        <div className="font-mono text-[11.5px] text-right pr-3 pl-4.5 pt-3.5" style={{ color: "var(--fg-3)", borderRight: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{c.time}</div>
                        <div className={`px-4.5 py-2.5 ${c.last ? "pb-4.5" : ""}`}>
                          <div className="flex justify-between items-center rounded-(--r-2) px-3.5 py-3" style={{ border: "1px solid var(--border)", borderLeft: `3px solid ${bl}`, background: "var(--bg)", opacity: c.type === "cancelled" ? 0.5 : 1 }}>
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{c.init}</span>
                              <div>
                                <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                                  {c.name}
                                  {c.badge && <span className="inline-flex items-center h-4.5 px-2 rounded-(--r-1) text-[12px] font-medium ml-1.5" style={BADGE_S[c.badgeStyle || "signal"]}>{c.badge}</span>}
                                </div>
                                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>{c.meta}</div>
                              </div>
                            </div>
                            {c.actions && (
                              <div className="flex gap-1.5">
                                {c.actions.map((a, j) => (
                                  <button key={a} className={j === c.actions!.length - 1 ? "btn-primary-v2 sm" : "btn-ghost-v2 sm"}>{a}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Clients adherence */}
              <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Active clients · adherence</h3>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>68 total · sorted by needs‑attention · last 7 days</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost-v2 sm">Filter</button>
                    <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>View all →</span>
                  </div>
                </div>
                {/* Column headers */}
                <div className="overflow-x-auto">
                <div className="grid gap-4 px-4.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.05em] min-w-[600px]" style={{ gridTemplateColumns: "1fr 130px 130px 100px", borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}>
                  <span>Client &amp; plan</span><span>7‑day log</span><span>Macros · today</span><span style={{ textAlign: "right" }}>Status</span>
                </div>
                {CLIENTS.map((c, i) => (
                  <div key={c.init} className="grid gap-4 px-4.5 py-3.5 items-center hover:bg-bg-2 min-w-[600px]" style={{ gridTemplateColumns: "1fr 130px 130px 100px", borderBottom: i < CLIENTS.length - 1 ? "1px solid var(--border)" : "none", transition: "background 60ms" }}>
                    {/* Who */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{c.init}</span>
                      <div>
                        <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{c.name}</div>
                        <div className="flex items-center gap-2.5 font-mono text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                          <span>{c.plan}</span>
                          <span className="w-[3px] h-[3px] rounded-full" style={{ background: "var(--border-2)" }} />
                          <span>{c.kcal}</span>
                        </div>
                      </div>
                    </div>
                    {/* Spark + adherence */}
                    <div>
                      <div className="flex items-end gap-0.5 h-7">
                        {c.spark.map((h, j) => (
                          <span key={j} className="flex-1 rounded-[1px]" style={{ height: `${h}%`, background: SPARK_BG[c.sparkTypes[j]], minHeight: "2px" }} />
                        ))}
                      </div>
                      <div className="font-mono text-[12px] text-right mt-0.5" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{c.adherence}</div>
                    </div>
                    {/* Macros */}
                    <div className="flex flex-col gap-1">
                      {c.macros.map((m) => (
                        <div key={m.k} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                          <span className="w-3.5">{m.k}</span>
                          <span className="flex-1 h-[3px] rounded-[1px] overflow-hidden relative" style={{ background: "var(--bg-3)" }}>
                            <span className="absolute inset-y-0 left-0" style={{ width: `${m.w}%`, background: "var(--ink)" }} />
                          </span>
                          <span className="min-w-7 text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{m.v}</span>
                        </div>
                      ))}
                    </div>
                    {/* Flag */}
                    <div className="text-right">
                      <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-[7px] py-[3px] rounded-(--r-1)" style={FLAG_S[c.flagType]}>{c.flag}</span>
                    </div>
                  </div>
                ))}
                </div>{/* close overflow-x-auto */}
              </div>

              {/* Plan templates */}
              <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>My plan templates</h3>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>8 active · pull a template to start a new plan in 30 seconds</div>
                  </div>
                  <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>Manage library →</span>
                </div>
                {TEMPLATES.map((t, i) => (
                  <div key={i} className="flex justify-between items-center px-4.5 py-3 hover:bg-bg-2" style={{ borderBottom: i < TEMPLATES.length - 1 ? "1px solid var(--border)" : "none", transition: "background 60ms" }}>
                    <div>
                      <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{t.t}</div>
                      <div className="font-mono text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>{t.s}</div>
                    </div>
                    <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{t.used}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-3">
              {/* Action queue */}
              <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Action queue</h3>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>5 items · time‑sensitive</div>
                  </div>
                  <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>All tasks →</span>
                </div>
                {ACTIONS.map((a, i) => (
                  <div key={i} className="flex gap-2.5 px-4.5 py-3 items-start" style={{ borderBottom: i < ACTIONS.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span className="w-1 h-[38px] rounded-sm shrink-0 mt-0.5" style={{ background: a.bar }} />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{a.t}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>{a.s}</div>
                    </div>
                    <button className="btn-ghost-v2 sm">{a.btn}</button>
                  </div>
                ))}
              </div>

              {/* Inbox */}
              <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Inbox</h3>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>12 unread · 24h SLA</div>
                  </div>
                  <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>Open inbox →</span>
                </div>
                <div className="py-1">
                  {MESSAGES.map((m, i) => (
                    <div key={i} className="flex gap-3 px-4.5 py-3 items-start hover:bg-bg-2" style={{ borderBottom: i < MESSAGES.length - 1 ? "1px solid var(--border)" : "none", transition: "background 60ms" }}>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{m.init}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                            {m.name}
                            {m.pill && <span className="font-mono text-[9.5px] uppercase tracking-[0.05em] px-1.25 py-[2px] rounded-(--r-1) ml-1.5 align-[1px]" style={{ color: "var(--dietitian)", border: "1px solid currentColor" }}>{m.pill}</span>}
                            {m.unread && <span className="inline-block w-1.5 h-1.5 rounded-full ml-1.5 -translate-y-px" style={{ background: "var(--signal)" }} />}
                          </span>
                          <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--fg-3)" }}>{m.ts}</span>
                        </div>
                        <div className="text-[13px] mt-1 truncate" style={{ color: m.unread ? "var(--ink)" : "var(--fg-2)", fontWeight: m.unread ? 500 : 400, lineHeight: "1.45" }}>{m.preview}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings */}
              <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Earnings · this month</h3>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>₦ 1.84M booked · next payout May 13</div>
                  </div>
                  <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>Statement →</span>
                </div>
                {EARNINGS.map((e, i) => (
                  <div key={i} className="flex justify-between items-center px-4.5 py-3" style={{ borderBottom: i < EARNINGS.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13.5px]" style={{ color: "var(--ink)" }}>{e.t}</span>
                      <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>{e.s}</span>
                    </div>
                    <span className="font-mono text-[14px] font-medium" style={{ color: e.color, fontVariantNumeric: "tabular-nums" }}>{e.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
    </DietitianDashboardShell>
  );
}
