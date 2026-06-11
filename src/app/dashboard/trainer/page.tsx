import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import OnboardingBanner from "@/components/OnboardingBanner";
import { BookSessionButton } from "./_actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trainer Dashboard",
  description: "Training overview with client progress, sessions, and earnings.",
};

/**
 * Trainer dashboard — Sarah Okafor · CPT
 * Hardcoded to match dashboard-trainer.html prototype.
 * Every CSS value from shared.css + page styles verified.
 */

function FireIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--signal-ink)" }}><path d="M12 2s4 6 4 10a4 4 0 1 1-8 0c0-2 2-4 2-6 0 0 0 2 2 2s0-2 0-6z" /></svg>;
}

const STATS = [
  { label: "Sessions · this week", value: "28", suffix: "/ 32 slots", delta: "88% utilization" },
  { label: "Active clients", value: "42", delta: "+ 3 this month" },
  { label: "Earnings · MTD", value: "R 38,400", delta: "↑ 14% vs apr" },
  { label: "Rating · last 30d", value: "4.9", delta: "No change", steady: true },
];

const SESSIONS = [
  { time: "06:30", init: "JC", name: "Jamal Chen", meta: "Intake + assessment · 60 min · Iron Lab Sea Point", type: "first", badge: "First session", badgeStyle: "signal", actions: ["Notes", "Check‑in"] },
  { time: "08:00", init: "LM", name: "Linda Mokoena", meta: "Session 14 / 24 · Strength upper · 60 min", streak: 32, actions: ["Plan", "Check‑in"] },
  { time: "09:30", init: "WC", name: "Wei Chen", meta: "Session 8 / 12 · Olympic basics · 90 min", actions: ["Plan", "Check‑in"] },
  { time: "11:30", init: "AA", name: "Aisha Adams", meta: "Programming review · Dubai (GMT+4) · 30 min · Zoom", type: "online", badge: "Online", badgeStyle: "gym", avatarBg: "var(--gym)", avatarColor: "oklch(0.95 0 0)", actions: ["Notes", "Join"] },
  { time: "13:00", init: "PB", name: "Pier Botha", meta: "Refund issued · slot reopened for booking", type: "cancelled", badge: "Cancelled · 06:42", badgeStyle: "danger" },
  { time: "15:30", init: "TN", name: "Thandi Nkosi", meta: "Session 6 / 12 · Postnatal strength · 60 min", streak: 18, actions: ["Plan", "Check‑in"] },
  { time: "17:00", init: "MK", name: "Mike Khumalo", meta: "Session 22 / 24 · Conditioning · 60 min", actions: ["Plan", "Check‑in"], last: true },
];

const CLIENTS = [
  { init: "LM", name: "Linda Mokoena", meta: ["Studio · 24‑session package", "Next today · 08:00", "Joined Mar 2025"], progress: 58, label: "14 / 24", streak: "32 day streak" },
  { init: "WC", name: "Wei Chen", meta: ["Olympic 12‑pack", "Next today · 09:30", "Joined Feb 2026"], progress: 67, label: "8 / 12", streak: "11 days" },
  { init: "AA", name: "Aisha Adams", meta: ["Online · monthly", "Next today · 11:30", "Joined Jan 2026"], progress: 85, label: "Monthly", streak: "45 days" },
  { init: "TN", name: "Thandi Nkosi", meta: ["Postnatal 12‑pack", "Next today · 15:30", "Joined Apr 2026"], progress: 42, label: "5 / 12", streak: "18 days" },
  { init: "MK", name: "Mike Khumalo", meta: ["Conditioning 24‑pack", "Next today · 17:00", "Joined Oct 2025"], progress: 92, label: "22 / 24", streak: "62 days" },
];

const MESSAGES = [
  { init: "NK", name: "Nthabiseng K.", ts: "3m", preview: "Hi Sarah — would Tuesday at 7 work for a first consult? Heard great…", unread: true },
  { init: "AA", name: "Aisha Adams", ts: "28m", preview: "Quick Q on today's programming — should I do the front squats at…", unread: true },
  { init: "RJ", name: "Rashid J.", ts: "1h", preview: "Booked 8 sessions — looking forward. PAR‑Q form attached.", unread: true },
  { init: "LM", name: "Linda Mokoena", ts: "Yesterday", preview: "PR'd squat at 92.5! Thank you 🙌 Will send vid tonight", unread: false },
  { init: "WC", name: "Wei Chen", ts: "2d", preview: "Snatch felt off today, attached the slo‑mo. Bar drifting forward in…", unread: false },
];

const EARNINGS = [
  { title: "Studio · 24‑session pack", sub: "Linda M. · May 02", amt: "+ R 14,400", color: "var(--signal-ink)" },
  { title: "Olympic 12‑pack", sub: "Wei C. · Apr 28", amt: "+ R 14,400", color: "var(--signal-ink)" },
  { title: "Online monthly · May", sub: "Aisha A. · Dubai", amt: "$ 320 pending", color: "var(--fg-3)" },
  { title: "Postnatal 12‑pack", sub: "Thandi N. · Apr 22", amt: "+ R 11,400", color: "var(--signal-ink)" },
  { title: "Refund · Pier B.", sub: "Cancelled session · 13:00", amt: "− R 1,200", color: "var(--danger)" },
];

const CAL_ROWS = [
  [28,29,30,1,2,3,4], [5,6,7,8,9,10,11], [12,13,14,15,16,17,18], [19,20,21,22,23,24,25], [26,27,28,29,30,31,1],
];
const CAL_HAS = new Set([1,2,5,6,7,8,9,11,12,13,14,15,16,19,20,21,23,26,27,28,29,30]);

const BORDER_LEFT: Record<string, string> = { first: "var(--signal)", online: "var(--gym)", cancelled: "var(--fg-4)" };
const BADGE_STYLE: Record<string, React.CSSProperties> = {
  signal: { background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)", color: "var(--signal-ink)" },
  gym: { background: "transparent", border: "1px solid var(--gym)", color: "var(--gym)" },
  danger: { background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)" },
};

/* ═══ PAGE ═══ */

export default function TrainerDashboard() {
  return (
    <TrainerDashboardShell
      activeItem="Today"
      crumb="Today"
      actions={<><button className="btn-ghost-v2 sm">View public profile →</button><BookSessionButton /></>}
    >
          <OnboardingBanner />

          {/* Head */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
            <div>
              <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Today, Sarah</h1>
              <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Mon · May 11 · 6 sessions · R 7,200 forecast</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost-v2 sm">Block off time</button>
              <button className="btn-ghost-v2 sm">Copy link to book</button>
            </div>
          </div>

          {/* Stats — grid 4, gap 12px */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col gap-1.5 rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.label}</div>
                <div className="text-[28px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.value}{s.suffix && <small className="font-mono text-[13px] font-normal ml-1" style={{ color: "var(--fg-3)" }}>{s.suffix}</small>}</div>
                <div className="font-mono text-[12px]" style={{ color: s.steady ? "var(--fg-3)" : "var(--signal-ink)" }}>{s.delta}</div>
              </div>
            ))}
          </div>

          {/* Two-col: 1.7fr 1fr, gap 12px */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-3 items-start">

            {/* LEFT */}
            <div className="flex flex-col gap-3">
              {/* Sessions timeline */}
              <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Today&apos;s schedule</h3>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>6 confirmed · 1 cancellation · gap 14:00–15:30</div>
                  </div>
                  <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>Open calendar →</span>
                </div>

                {/* Timeline grid: 70px 1fr */}
                <div className="grid py-2" style={{ gridTemplateColumns: "70px 1fr" }}>
                  {SESSIONS.map((s, i) => {
                    const borderLeft = BORDER_LEFT[s.type || ""] || "var(--ink)";
                    const isCancelled = s.type === "cancelled";

                    // Gap line before 15:30
                    const showGap = s.time === "15:30";

                    return (
                      <div key={i} className="contents">
                        {showGap && (
                          <>
                            <div />
                            <div className="flex items-center gap-2 px-4.5 py-1.5 font-mono text-[11px]" style={{ color: "var(--fg-4)" }}>
                              <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
                              14:00 – 15:30 · 90 min open
                              <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
                            </div>
                          </>
                        )}

                        {/* Time */}
                        <div className="font-mono text-[11.5px] text-right pr-3 pl-4.5 pt-3.5" style={{ color: "var(--fg-3)", borderRight: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{s.time}</div>

                        {/* Session card */}
                        <div className={`px-4.5 py-2.5 ${s.last ? "pb-4.5" : ""}`}>
                          <div className="flex justify-between items-center rounded-(--r-2) px-3.5 py-3" style={{ border: "1px solid var(--border)", borderLeft: `3px solid ${borderLeft}`, background: "var(--bg)", opacity: isCancelled ? 0.5 : 1, transition: "border-color 120ms" }}>
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: s.avatarBg || "var(--bg-3)", color: s.avatarColor || "var(--fg-2)" }}>{s.init}</span>
                              <div>
                                <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                                  {s.name}
                                  {s.badge && <span className="inline-flex items-center h-4.5 px-2 rounded-(--r-1) text-[12px] font-medium ml-1.5" style={BADGE_STYLE[s.badgeStyle || "signal"]}>{s.badge}</span>}
                                  {s.streak && (
                                    <span className="inline-flex items-center gap-1.25 font-mono text-[12px] px-2 py-1 rounded-full ml-1.5" style={{ background: "var(--bg-2)", color: "var(--ink)" }}>
                                      <FireIcon />{s.streak}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>{s.meta}</div>
                              </div>
                            </div>
                            {s.actions && (
                              <div className="flex gap-1.5">
                                {s.actions.map((a) => (
                                  <button key={a} className={a === s.actions![s.actions!.length - 1] ? "btn-primary-v2 sm" : "btn-ghost-v2 sm"}>{a}</button>
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

              {/* Active clients */}
              <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Active clients</h3>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>42 total · ranked by next session</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost-v2 sm">Filter</button>
                    <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>View all →</span>
                  </div>
                </div>
                {CLIENTS.map((c, i) => (
                  <div key={c.init} className="grid gap-4 px-4.5 py-3.5 items-center hover:bg-bg-2" style={{ gridTemplateColumns: "1fr auto auto", borderBottom: i < CLIENTS.length - 1 ? "1px solid var(--border)" : "none", transition: "background 60ms" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{c.init}</span>
                      <div>
                        <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{c.name}</div>
                        <div className="flex items-center gap-2.5 font-mono text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                          {c.meta.map((m, j) => (
                            <span key={j} className="flex items-center gap-2.5">
                              {j > 0 && <span className="w-[3px] h-[3px] rounded-full" style={{ background: "var(--border-2)" }} />}
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="w-20 h-1 rounded-sm overflow-hidden" style={{ background: "var(--bg-3)" }}><div className="h-full" style={{ width: `${c.progress}%`, background: "var(--ink)" }} /></div>
                      <div className="font-mono text-[11px] text-right mt-1" style={{ color: "var(--fg-3)" }}>{c.label}</div>
                    </div>
                    <span className="inline-flex items-center gap-1.25 font-mono text-[12px] px-2 py-1 rounded-full" style={{ background: "var(--bg-2)", color: "var(--ink)" }}><FireIcon />{c.streak}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-3">
              {/* Mini calendar */}
              <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>May 2026</h3>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Mon, May 11 · 6 sessions</div>
                  </div>
                  <div className="flex gap-1">
                    <button className="w-7 h-7 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }} aria-label="Previous month"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 18-6-6 6-6"/></svg></button>
                    <button className="w-7 h-7 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }} aria-label="Next month"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 18 6-6-6-6"/></svg></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 px-4.5 py-3.5 text-[12px]" style={{ color: "var(--fg-2)" }}>
                  {["M","T","W","T","F","S","S"].map((d,i) => (
                    <div key={i} className="font-mono text-[10px] text-center uppercase py-1" style={{ color: "var(--fg-4)" }}>{d}</div>
                  ))}
                  {CAL_ROWS.flat().map((day, i) => {
                    const isMuted = (i < 3 && day > 20) || (i > 34 && day < 10);
                    const isToday = day === 11 && !isMuted;
                    const hasSession = CAL_HAS.has(day) && !isMuted;
                    return (
                      <div key={i} className="aspect-square flex items-center justify-center font-mono rounded-(--r-2) relative cursor-pointer hover:bg-bg-2" style={{ color: isToday ? "var(--bg)" : isMuted ? "var(--fg-4)" : "var(--fg-2)", background: isToday ? "var(--ink)" : "transparent", fontVariantNumeric: "tabular-nums" }}>
                        {day}
                        {hasSession && !isToday && <span className="absolute w-1 h-1 rounded-full bottom-1" style={{ background: "var(--ink)" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inbox */}
              <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Inbox</h3>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>7 unread · 24h SLA</div>
                  </div>
                  <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>Open inbox →</span>
                </div>
                <div className="py-1 overflow-hidden" style={{ maxHeight: "460px" }}>
                  {MESSAGES.map((m, i) => (
                    <div key={i} className="flex gap-3 px-4.5 py-3 items-start hover:bg-bg-2" style={{ borderBottom: i < MESSAGES.length - 1 ? "1px solid var(--border)" : "none", transition: "background 60ms" }}>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{m.init}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                            {m.name}
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
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>R 38,400 booked · next payout May 13</div>
                  </div>
                  <span className="text-[12.5px] cursor-pointer" style={{ color: "var(--fg-2)" }}>Statement →</span>
                </div>
                {EARNINGS.map((e, i) => (
                  <div key={i} className="flex justify-between items-center px-4.5 py-3" style={{ borderBottom: i < EARNINGS.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13.5px]" style={{ color: "var(--ink)" }}>{e.title}</span>
                      <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>{e.sub}</span>
                    </div>
                    <span className="font-mono text-[14px] font-medium" style={{ color: e.color, fontVariantNumeric: "tabular-nums" }}>{e.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
    </TrainerDashboardShell>
  );
}
