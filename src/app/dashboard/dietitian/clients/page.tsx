"use client";

import { useState } from "react";
import Link from "next/link";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";

const KPIS = [
  { label: "Sessions complete", value: "14", unit: "/ 24", delta: "58% through · 10 left" },
  { label: "Attendance", value: "100", unit: "%", delta: "14 / 14 on time" },
  { label: "Weight · 30d", value: "−1.4", unit: "kg", delta: "Trending down · target met" },
  { label: "Squat 1RM", value: "92.5", unit: "kg", delta: "+22 kg since Mar" },
  { label: "LTV · this client", value: "R 16.8k", delta: "Studio · monthly renewal", steady: true },
];

const PROGRAM = {
  title: "Strength block II · in progress",
  sub: "Week 6 of 12 · linear progression with deload at week 9",
  summary: [
    { label: "Volume · this week", value: "14,820 kg" },
    { label: "Avg intensity", value: "82% 1RM" },
    { label: "Top set today", value: "Squat 87.5 x 5" },
    { label: "RPE trend", value: "7.2 → 7.8" },
  ],
};

const SESSIONS = [
  { month: "MAY", day: "13", title: "Strength · Lower body", meta: "60 min · Sea Point · RPE 8 · Top: Squat 87.5 x 5", pr: "+ 2.5 kg PR", big: true },
  { month: "MAY", day: "06", title: "Strength · Upper body", meta: "60 min · Sea Point · RPE 7 · Top: Bench 52.5 x 5", pr: "No PR", big: false },
  { month: "APR", day: "29", title: "Strength · Lower body", meta: "60 min · Sea Point · RPE 8 · Top: Squat 85 x 5", pr: "+ 2.5 kg PR", big: true },
  { month: "APR", day: "22", title: "Strength · Upper body", meta: "60 min · Sea Point · RPE 7 · Top: Bench 50 x 5", pr: "+ 2.5 kg PR", big: true },
  { month: "APR", day: "15", title: "Strength · Lower body", meta: "60 min · Sea Point · RPE 8 · Top: Squat 82.5 x 5", pr: "No PR", big: false },
];

const NOTES = [
  { author: "Sarah", date: "MAY 13 · 09:42", label: "After session", text: "Hit the 87.5 x 5 squat clean -- bar speed actually faster than last week's 85. Hips were a touch stiff in the warm-up (deload week 9 should help).", tags: ["After session", "Programming"] },
  { author: "Sarah", date: "MAY 06 · 17:18", label: "Health flag", text: "Mentioned a flare-up of right knee discomfort from running over the weekend. Not from training. Asked her to skip her solo runs until we reassess at the May 13 session.", tags: ["Health flag", "Follow up · cleared May 13"] },
  { author: "Sarah", date: "APR 29 · 09:35", label: "After session", text: "First time pulling 85 kg from the floor for a clean rep of 5. Her cue: 'drive the floor away.' Worked. Save the cue.", tags: [] },
];

const MEMBERSHIP = [
  { key: "Plan", value: "Studio · 24-session pack" },
  { key: "Started", value: "18 Mar 2025" },
  { key: "Sessions used", value: "14 of 24" },
  { key: "Renews", value: "30 May 2026" },
  { key: "Total spent", value: "R 16,800.00" },
];

const CONTACT = [
  { icon: "email", key: "Email", value: "linda.m@gmail.com" },
  { icon: "phone", key: "Phone", value: "+27 82 ••• 3914" },
  { icon: "location", key: "City", value: "Cape Town · ZA" },
  { icon: "emergency", key: "Emergency", value: "T. Mokoena · spouse · +27 71 ••• 2284" },
];

export default function DietitianClientListPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const tabs = ["Overview", "Program", "Sessions", "Logs", "Notes", "Messages", "Billing"];

  return (
    <DietitianDashboardShell activeItem="Clients" crumb="Linda Mokoena">
      {/* Hero */}
      <div className="rounded-(--r-3) p-6" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4.5">
          <div className="flex gap-4.5 items-center">
            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[22px] font-medium flex-shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>LM</div>
            <div>
              <h1 className="text-[26px] font-medium tracking-[-0.022em] leading-tight flex items-center gap-2.5" style={{ color: "var(--ink)" }}>
                Linda Mokoena
                <span className="font-mono text-[11px] font-normal uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-full" style={{ border: "1px solid var(--border)", color: "var(--fg-3)" }}>she / her</span>
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Active client", "Studio · 24-pack", "14 / 24 sessions", "In-person · Sea Point", "Streak 32 days"].map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[11px] uppercase tracking-[0.04em]" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}>{b}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 mt-2.5 font-mono text-[12.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                <span><strong className="font-medium text-[13px] tracking-[-0.005em] normal-case" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)" }}>Joined</strong> 18 Mar 2025</span>
                <span>&middot;</span>
                <span><strong className="font-medium text-[13px] tracking-[-0.005em] normal-case" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)" }}>Age</strong> 38</span>
                <span>&middot;</span>
                <span><strong className="font-medium text-[13px] tracking-[-0.005em] normal-case" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)" }}>Goals</strong> Build strength · feel strong at 40</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>Message</button>
            <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>Book session</button>
            <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>+ Update program</button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 mt-4.5 rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
          {KPIS.map((k, i) => (
            <div key={k.label} className="p-3.5 px-4.5 flex flex-col gap-1" style={{ borderRight: i < KPIS.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
              <div className="text-[22px] font-medium tracking-[-0.018em] tabular-nums leading-none mt-0.5" style={{ color: "var(--ink)" }}>
                {k.value}{k.unit && <span className="font-mono text-[12px] font-normal ml-1" style={{ color: "var(--fg-3)" }}>{k.unit}</span>}
              </div>
              <div className="font-mono text-[11px] mt-1" style={{ color: k.steady ? "var(--fg-3)" : "var(--signal-ink)" }}>{k.delta}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)" }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="px-4 py-3.5 text-[13.5px] cursor-pointer whitespace-nowrap"
            style={{
              color: activeTab === t ? "var(--ink)" : "var(--fg-3)",
              fontWeight: activeTab === t ? 500 : 400,
              borderBottom: activeTab === t ? "2px solid var(--ink)" : "2px solid transparent",
              background: "transparent",
              border: "none",
              borderBottomWidth: "2px",
              borderBottomStyle: "solid",
              borderBottomColor: activeTab === t ? "var(--ink)" : "transparent",
              marginBottom: "-1px",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="flex flex-col gap-4">
          {/* Program progress */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{PROGRAM.title}</h3>
                <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>{PROGRAM.sub}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5 p-5">
              {PROGRAM.summary.map((s) => (
                <div key={s.label}>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mb-1" style={{ color: "var(--fg-3)" }}>{s.label}</div>
                  <div className="text-[16px] font-medium tracking-[-0.005em]" style={{ color: "var(--ink)" }}>{s.value}</div>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="flex h-2 mx-5 mb-1 rounded-[4px] overflow-hidden" style={{ background: "var(--bg-3)" }}>
              <div style={{ flex: 5, background: "var(--ink)", borderRight: "2px solid var(--bg)" }} />
              <div style={{ flex: 1, background: "var(--signal)", borderRight: "2px solid var(--bg)" }} />
              <div style={{ flex: 2, background: "var(--bg-3)", borderRight: "2px solid var(--bg)" }} />
              <div style={{ flex: 1, background: "oklch(0.92 0.02 75)", borderRight: "2px solid var(--bg)" }} />
              <div style={{ flex: 3, background: "var(--bg-3)" }} />
            </div>
            <div className="grid gap-0.5 px-5 pb-4.5 font-mono text-[10px] uppercase tracking-[0.04em] mt-1" style={{ gridTemplateColumns: "repeat(8, 1fr)", color: "var(--fg-4)" }}>
              {["W1","W2","W3","W4","W5","W6","W7","W8"].map((w) => (
                <span key={w} className="text-center pt-1" style={w === "W6" ? { color: "var(--signal-ink)", fontWeight: 500 } : {}}>{w}</span>
              ))}
            </div>
          </div>

          {/* Recent sessions */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Recent sessions</h3>
                <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>Last 5 sessions · all completed on time</div>
              </div>
            </div>
            {SESSIONS.map((s) => (
              <div key={s.day + s.month} className="grid items-center gap-3.5 px-4.5 py-3 hover:bg-[var(--bg-2)]" style={{ gridTemplateColumns: "56px 1fr auto", borderBottom: "1px solid var(--border)" }}>
                <div className="text-center flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.month}</span>
                  <span className="text-[22px] font-medium tracking-[-0.022em] tabular-nums leading-none" style={{ color: "var(--ink)" }}>{s.day}</span>
                </div>
                <div>
                  <div className="text-[14px] font-medium tracking-[-0.005em]" style={{ color: "var(--ink)" }}>{s.title}</div>
                  <div className="font-mono text-[11.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{s.meta}</div>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full" style={s.big ? { background: "var(--signal-soft)", color: "var(--signal-ink)" } : { background: "var(--bg-2)", color: "var(--ink)" }}>{s.pr}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[124px]">
          {/* Next session */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center px-4.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Next session</h3>
            </div>
            <div className="flex gap-3.5 items-center p-4 px-4.5">
              <div className="text-center pr-3.5" style={{ borderRight: "1px solid var(--border)" }}>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>MAY</div>
                <div className="text-[28px] font-medium tracking-[-0.025em] leading-none tabular-nums" style={{ color: "var(--ink)" }}>20</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>Wed</div>
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-medium tracking-[-0.005em]" style={{ color: "var(--ink)" }}>Strength · Lower body</div>
                <div className="font-mono text-[11.5px] uppercase tracking-[0.04em] mt-1" style={{ color: "var(--fg-3)" }}>08:00 SAST · Sea Point · 60 min</div>
                <div className="text-[12.5px] mt-1.5 leading-[1.4]" style={{ color: "var(--fg-2)" }}>Squat 90 x 5 if RPE holds · accessory: split squat 3x8/leg</div>
              </div>
            </div>
          </div>

          {/* Membership */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-4.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Membership</h3>
            </div>
            {MEMBERSHIP.map((m) => (
              <div key={m.key} className="flex justify-between items-center px-4.5 py-2.5 gap-3 text-[13px]" style={{ borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--fg-3)" }}>{m.key}</span>
                <span className="font-mono tabular-nums" style={{ color: "var(--ink)" }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-4.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Contact</h3>
            </div>
            {CONTACT.map((c) => (
              <div key={c.key} className="flex items-center gap-2.5 px-4.5 py-2.5 text-[13px]" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="font-mono text-[11.5px] uppercase tracking-[0.04em] w-[90px] flex-shrink-0" style={{ color: "var(--fg-3)" }}>{c.key}</span>
                <span className="flex-1 break-words" style={{ color: "var(--ink)" }}>{c.value}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </DietitianDashboardShell>
  );
}
