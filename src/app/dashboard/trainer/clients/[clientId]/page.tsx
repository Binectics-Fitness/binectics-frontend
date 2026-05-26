import Link from "next/link";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Details",
  description: "View client profile, progress, and session history.",
};

/**
 * Client detail — client.html prototype.
 * Hero with avatar + badges + KPIs, sticky tab nav, coaching notes, right-rail signals.
 */

const KPIS = [
  { label: "Sessions complete", value: "14", suffix: "/ 24", delta: "58% through · 10 left" },
  { label: "Attendance", value: "100", suffix: "%", delta: "14 / 14 on time" },
  { label: "Weight · 30d", value: "−1.4", suffix: "kg", delta: "Trending down · target met" },
  { label: "Squat 1RM", value: "92.5", suffix: "kg", delta: "+22 kg since Mar" },
  { label: "LTV · this client", value: "R 16.8k", delta: "14 sessions · 12 months" },
];

const NOTES = [
  { type: "After session", date: "Mon · 18 May 08:30", text: "Squatted 90kg × 3 × 4 — smooth. Added 2.5kg vs last week. Hip shift is almost gone. Cue 'spread the floor' is working. Next session: test 92.5kg for a double." },
  { type: "Programming", date: "Sun · 17 May", text: "Updated block 3 — shifted to 3×5 on bench, added rack pulls. Linda's deadlift groove is improving but she's still losing position at the knee. Film next session." },
  { type: "Health flag", date: "Wed · 14 May 10:00", text: "Mentioned left shoulder clicking on overhead press — no pain but she's aware. Monitor. If it persists 2+ weeks, refer to Dr. Ngcobo for imaging.", warn: true },
  { type: "After session", date: "Mon · 12 May 08:30", text: "Deload week — 80% of working weights. Felt strong. Bodyweight stable at 76.2kg. Sleep improving since cutting caffeine after 2pm." },
];

const SIGNALS = [
  { color: "var(--signal)", title: "Streak momentum", desc: "32 consecutive days. Longest since joining. Worth acknowledging — it sustains itself after 30." },
  { color: "var(--warn)", title: "Shoulder monitor", desc: "Left shoulder click on OHP noted May 14. 2-week window before referral. Check in Wed." },
  { color: "var(--gym)", title: "Pack completion", desc: "10 sessions left on 24-pack. At current pace, expires Jul 8. Plan renewal conversation around session 20." },
];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "After session": { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
  "Programming": { bg: "var(--gym-soft)", color: "var(--gym)" },
  "Health flag": { bg: "oklch(0.95 0.03 25)", color: "var(--danger)" },
  "Personal": { bg: "var(--bg-3)", color: "var(--fg-2)" },
};

export default function ClientDetailPage() {
  return (
    <TrainerDashboardShell activeItem="Clients" crumb="Linda Mokoena">
      {/* Hero */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
        <div className="flex items-start gap-4">
          <span className="w-18 h-18 rounded-full flex items-center justify-center text-[18px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>LM</span>
          <div>
            <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
              Linda Mokoena <span className="text-[14px] font-normal ml-2" style={{ color: "var(--fg-3)" }}>she / her</span>
            </h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: "Active client", signal: true },
                { label: "Studio · 24‑pack" },
                { label: "14 / 24 sessions" },
                { label: "In‑person · Sea Point" },
                { label: "Streak 32 days", dot: "var(--signal)" },
              ].map((b) => (
                <span key={b.label} className="inline-flex items-center gap-1.25 font-mono text-[10.5px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full" style={{ color: b.signal ? "var(--signal-ink)" : "var(--fg-2)", background: b.signal ? "var(--signal-soft)" : "var(--bg-3)", border: "1px solid var(--border)" }}>
                  {(b.signal || b.dot) && <span className="w-1.25 h-1.25 rounded-full" style={{ background: b.dot || "currentColor" }} />}
                  {b.label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[13px]" style={{ color: "var(--fg-3)" }}>
              <span><strong style={{ color: "var(--ink)" }}>Joined</strong> 18 Mar 2025</span>
              <span>·</span>
              <span><strong style={{ color: "var(--ink)" }}>Age</strong> 38</span>
              <span>·</span>
              <span><strong style={{ color: "var(--ink)" }}>Goals</strong> Build strength · feel strong at 40</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-ghost-v2 sm">Message</button>
          <button className="btn-ghost-v2 sm">Book session</button>
          <button className="btn-primary-v2 sm">+ Update program</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[24px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {k.value}{k.suffix && <small className="font-mono text-[12px] font-normal ml-1" style={{ color: "var(--fg-3)" }}>{k.suffix}</small>}
            </div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <nav className="flex gap-0 -mx-7 px-7 border-b border-border sticky top-14 z-10 overflow-x-auto flex-nowrap whitespace-nowrap" style={{ background: "var(--bg-2)" }}>
        {["Overview", "Notes · 18", "Program", "Health log", "Sessions · 14", "Billing"].map((t, i) => (
          <span key={t} className={`px-4 py-3.5 text-[13.5px] -mb-px cursor-pointer ${i === 1 ? "border-b-2 border-ink font-medium" : ""}`} style={{ color: i === 1 ? "var(--ink)" : "var(--fg-3)" }}>{t}</span>
        ))}
      </nav>

      {/* Content: Notes + right rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Notes */}
        <div>
          <div className="flex flex-col gap-0">
            {NOTES.map((n, i) => {
              const tc = TYPE_COLORS[n.type] || TYPE_COLORS["Personal"];
              return (
                <div key={i} className="flex gap-4 py-4" style={{ borderBottom: i < NOTES.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="w-10 flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: n.warn ? "var(--danger)" : "var(--ink)" }} />
                    {i < NOTES.length - 1 && <div className="w-px flex-1" style={{ background: "var(--border)" }} />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-(--r-1)" style={{ color: tc.color, background: tc.bg }}>{n.type}</span>
                      <span className="font-mono text-[11px]" style={{ color: "var(--fg-4)" }}>{n.date}</span>
                    </div>
                    <p className="text-[14px] leading-relaxed" style={{ color: "var(--fg-2)" }}>{n.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compose */}
          <div className="mt-4 rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <textarea className="w-full px-4 py-3 text-[14px] resize-none" style={{ border: "none", background: "transparent", fontFamily: "inherit", color: "var(--ink)", minHeight: "72px" }} placeholder="Write a note about Linda…" />
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex gap-1.5">
                {["After session", "Programming", "Health flag", "Personal"].map((t) => {
                  const tc = TYPE_COLORS[t];
                  return <span key={t} className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-(--r-1) cursor-pointer" style={{ color: tc.color, background: tc.bg }}>{t}</span>;
                })}
              </div>
              <button className="btn-primary-v2 sm">Save note</button>
            </div>
          </div>
        </div>

        {/* Right rail — Signals */}
        <div className="flex flex-col gap-4 sticky top-28">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Signals</div>
          {SIGNALS.map((s) => (
            <div key={s.title} className="rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div className="flex gap-3 p-3.5" style={{ borderLeft: `3px solid ${s.color}` }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{s.title}</div>
                  <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--fg-3)" }}>{s.desc}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Quick stats */}
          <div className="rounded-(--r-3) p-3.5" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>Quick stats</div>
            {[
              { k: "Next session", v: "Wed 20 May · 08:30" },
              { k: "Sessions remaining", v: "10 of 24" },
              { k: "Pack expires", v: "8 Jul 2026" },
              { k: "Total paid", v: "R 16,800" },
            ].map((s) => (
              <div key={s.k} className="flex justify-between py-1.5 text-[12.5px]">
                <span style={{ color: "var(--fg-3)" }}>{s.k}</span>
                <span className="font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
