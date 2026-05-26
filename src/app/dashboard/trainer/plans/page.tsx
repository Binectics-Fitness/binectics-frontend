import Link from "next/link";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";

const PKGS = [
  {
    name: "Single session · in‑person",
    price: "R 1,200",
    per: "/ session",
    desc: "60 min · Iron Lab Sea Point · 1‑1‑on‑1 · barbell + dumbbell focus.",
    features: ["Movement screen before first session", "Session recording included", "Free reschedule 24h+ before"],
    stats: [{ k: "Picked", v: "214" }, { k: "Avg / mo", v: "18" }, { k: "Refund rate", v: "2%" }],
    featured: false,
    on: true,
  },
  {
    name: "Studio · 24‑session pack",
    price: "R 23,800",
    per: "/ pack",
    desc: "24 sessions over 4 months · save 17% vs single · custom program included.",
    features: ["R 992 / session · save R 208 per", "4‑month window · pause 30d / year", "Custom 12‑week program built around your goals", "Take‑home programming weeks 13–24"],
    stats: [{ k: "Picked", v: "86" }, { k: "Avg / mo", v: "7" }, { k: "Refund rate", v: "0%" }],
    featured: true,
    on: true,
  },
  {
    name: "Strength 12‑pack",
    price: "R 13,200",
    per: "/ pack",
    desc: "12 sessions over 8 weeks · save 8% · best for first‑time committed clients.",
    features: ["R 1,100 / session · save R 100 per", "8‑week window · no extensions", "4‑week program with check‑in"],
    stats: [{ k: "Picked", v: "42" }, { k: "Avg / mo", v: "4" }, { k: "Refund rate", v: "3%" }],
    featured: false,
    on: true,
  },
  {
    name: "Online · video session",
    price: "R 850",
    per: "/ session",
    desc: "45 min · video call · programming review & form check · for clients outside Cape Town.",
    features: ["Zoom · async video review", "Programming worksheet delivered after", "Best paired with a take‑home plan"],
    stats: [{ k: "Picked", v: "68" }, { k: "Avg / mo", v: "6" }, { k: "Refund rate", v: "1%" }],
    featured: false,
    on: true,
  },
  {
    name: "Online · monthly programming",
    price: "R 2,400",
    per: "/ month",
    desc: "Take‑home programming + 2 video check‑ins / month. For self‑directed lifters.",
    features: ["Weekly programming delivered Sunday", "2 × 30 min video check‑ins / month", "Unlimited messages between"],
    stats: [{ k: "Active subs", v: "12" }, { k: "Avg LTV", v: "R 14.4k" }, { k: "Churn", v: "8%" }],
    featured: false,
    on: true,
  },
  {
    name: "Postnatal 8‑pack",
    price: "R 7,600",
    per: "/ pack",
    desc: "Paused since March · 8 sessions for new mums · referring to Thandi while on leave.",
    features: ["R 950 / session · 8 sessions", "16‑week window", "Diastasis-aware programming"],
    stats: [{ k: "Picked", v: "14" }, { k: "Avg / mo", v: "0" }, { k: "Refund rate", v: "0%" }],
    featured: false,
    on: false,
  },
];

export default function TrainerPackagesPage() {
  return (
    <TrainerDashboardShell
      activeItem="Packages"
      crumb="Packages"
      actions={
        <div className="flex gap-2">
          <button className="btn-ghost-v2 sm">Preview profile</button>
          <Link href="/dashboard/trainer/plans/create" className="btn-primary-v2 sm">+ New package</Link>
        </div>
      }
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Packages</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>What members can book on your profile · drag to reorder · toggle off to hide without deleting</div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active packages", value: "5", delta: "1 paused" },
          { label: "Most picked", value: "Studio 24‑pack", small: true, delta: "218 picks · this year" },
          { label: "Highest LTV", value: "Online · monthly", small: true, delta: "R 14.4k avg" },
          { label: "Avg session price", value: "R 1,150", delta: "↑ R 18 MoM" },
        ].map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className={`font-medium mt-1.5 ${k.small ? "text-[17px]" : "text-[24px]"}`} style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Package cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {PKGS.map((p) => (
          <div
            key={p.name}
            className={`rounded-(--r-3) overflow-hidden flex flex-col cursor-pointer ${!p.on ? "opacity-55" : ""}`}
            style={{ background: "var(--bg)", border: p.featured ? "1px solid var(--ink)" : "1px solid var(--border)", transition: "border-color var(--motion-fast) var(--ease)" }}
          >
            {/* Head */}
            <div className="px-5.5 pt-5.5 pb-4 relative">
              {p.featured && (
                <span className="inline-flex items-center gap-1.25 font-mono text-[10px] uppercase tracking-[0.05em] px-2 py-0.75 rounded-full mb-2" style={{ background: "var(--ink)", color: "var(--bg)" }}>
                  <span className="w-1 h-1 rounded-full" style={{ background: "var(--signal)" }} />Most picked
                </span>
              )}
              <div className="text-[17px] font-medium" style={{ letterSpacing: "-0.012em", color: "var(--ink)" }}>{p.name}</div>
              <div className="mt-2.5" style={{ lineHeight: 1 }}>
                <span className="text-[32px] font-medium" style={{ letterSpacing: "-0.025em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{p.price}</span>
                <span className="font-mono text-[13px] ml-1" style={{ color: "var(--fg-3)" }}>{p.per}</span>
              </div>
              <div className="text-[13.5px] mt-2.5" style={{ color: "var(--fg-2)", lineHeight: 1.5, maxWidth: "36ch" }}>{p.desc}</div>
            </div>

            {/* Features */}
            <div className="px-5.5 pb-4 flex-1">
              <ul className="flex flex-col gap-2">
                {p.features.map((f) => (
                  <li key={f} className="text-[13px] pl-5 relative" style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>
                    <span className="absolute left-0 top-[6px] w-2.25 h-1.25 border-l-[1.5px] border-b-[1.5px] -rotate-45" style={{ borderColor: "var(--ink)" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
              {p.stats.map((s, si) => (
                <div key={s.k} className="py-3.5" style={{ padding: "14px 10px", paddingLeft: si === 0 ? "22px" : "10px", paddingRight: si === 2 ? "22px" : "10px", borderRight: si < 2 ? "1px solid var(--border)" : "none" }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.k}</div>
                  <div className="text-[15px] font-medium mt-0.75" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em" }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Toggle footer */}
            <div className="flex items-center justify-between px-5.5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{p.on ? "Live on profile" : "Hidden · paused"}</span>
              <span className="w-[30px] h-[18px] rounded-full relative cursor-pointer" style={{ background: p.on ? "var(--ink)" : "var(--border-2)" }}>
                <span className="absolute w-3.5 h-3.5 rounded-full top-0.5" style={{ background: "var(--bg)", left: p.on ? "14px" : "2px", transition: "left var(--motion-fast) var(--ease)" }} />
              </span>
            </div>
          </div>
        ))}

        {/* Add new package card */}
        <div
          className="rounded-(--r-3) flex flex-col items-center justify-center gap-2.5 cursor-pointer min-h-[360px]"
          style={{ border: "1.5px dashed var(--border-2)", color: "var(--fg-3)", transition: "border-color var(--motion-fast) var(--ease), color var(--motion-fast) var(--ease)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          <span className="text-[14px] font-medium">New package</span>
          <span className="text-[12.5px] text-center" style={{ maxWidth: "28ch", lineHeight: 1.4 }}>Single session, multi‑pack, or subscription. Set your own price and pause rules.</span>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
