"use client";

import { useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

const KPIS = [
  { label: "Overall rating", value: "4.8", delta: "312 reviews · ↑ 0.1 MoM" },
  { label: "New · last 30d", value: "28", delta: "26 positive · 2 mixed" },
  { label: "Response rate", value: "94%", delta: "Avg 2h 18m" },
  { label: "Flagged · awaiting", value: "2", delta: "Needs response", danger: true },
];

const FILTERS = [
  { label: "All · 312", active: true },
  { label: "Needs response · 2", active: false },
  { label: "★ 5 · 248", active: false },
  { label: "★ ≤ 3 · 14", active: false },
];

const REVIEWS = [
  { name: "Linda Mokoena", stars: 5, time: "3 days ago", text: "Iron Lab is hands-down the best gym I've trained at in Cape Town. Themba's Olympic class is incredible.", replied: true },
  { name: "Reza Mohammadi", stars: 3, time: "1 week ago", text: "Facility is great but the morning sessions get crowded. Hard to get on a rack between 6:30 and 7:30.", replied: false },
  { name: "Folake A.", stars: 5, time: "1 week ago", text: "I joined for postnatal classes with Thandi. She made me feel safe and built me up properly. Now back to my pre-baby strength after 14 weeks.", replied: true },
  { name: "Mike Khumalo", stars: 2, time: "2 weeks ago", text: "Charged me twice for the same month. Support fixed it but took 5 days.", replied: false },
  { name: "Aisha A.", stars: 5, time: "3 weeks ago", text: "Best investment of 2026 for me. Sarah's programming and the gym's 24/7 access have been life-changing.", replied: true },
];

function starsString(n: number) {
  return "★".repeat(n);
}

export default function GymReviewsPage() {
  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <GymDashboardShell activeItem="Settings" crumb="Reviews">
      <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Reviews</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-(--r-3) p-3.5 px-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[24px] font-medium tracking-[-0.02em] tabular-nums mt-1" style={{ color: "var(--ink)" }}>{k.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: k.danger ? "var(--danger)" : "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Reviews list */}
      <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-4.5">
          {FILTERS.map((f, i) => (
            <button
              key={f.label}
              onClick={() => setActiveFilter(i)}
              className="font-mono text-[10px] px-2.5 py-1 rounded-full uppercase tracking-[0.04em] cursor-pointer"
              style={
                activeFilter === i
                  ? { background: "var(--ink)", color: "var(--bg)", border: "none" }
                  : { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--ink)" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Review items */}
        {REVIEWS.map((r) => (
          <div key={r.name} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4.5 py-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <div className="flex gap-2.5 items-baseline mb-1.5">
                <strong className="text-[14px]" style={{ color: "var(--ink)" }}>{r.name}</strong>
                <span style={{ color: "oklch(0.65 0.18 75)", letterSpacing: "1px" }}>{starsString(r.stars)}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{r.time}</span>
              </div>
              <p className="text-[13.5px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>&ldquo;{r.text}&rdquo;</p>
            </div>
            <div className="flex-shrink-0">
              {r.replied ? (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>Replied</span>
              ) : (
                <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>Reply</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </GymDashboardShell>
  );
}
