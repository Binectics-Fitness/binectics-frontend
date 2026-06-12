import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protocols",
  description: "Create and manage clinical nutrition protocols.",
};

const PILL_STYLES: Record<string, React.CSSProperties> = {
  pcos: { background: "var(--dietitian-soft)", color: "var(--dietitian)", border: "1px solid oklch(0.88 0.04 300)" },
  t2d: { background: "oklch(0.94 0.06 75)", color: "oklch(0.42 0.13 75)", border: "1px solid oklch(0.88 0.07 75)" },
  cut: { background: "var(--gym-soft)", color: "var(--gym)", border: "1px solid oklch(0.88 0.04 248)" },
  ges: { background: "oklch(0.94 0.06 320)", color: "oklch(0.45 0.16 320)", border: "1px solid oklch(0.88 0.07 320)" },
  fod: { background: "var(--bg-2)", color: "var(--fg-2)", border: "1px solid var(--border)" },
  spt: { background: "var(--signal-soft)", color: "var(--signal-ink)", border: "1px solid oklch(0.88 0.05 148)" },
};

const PROTOCOLS = [
  {
    pill: "PCOS", pillClass: "pcos",
    name: "PCOS · low-GI insulin protocol",
    desc: "12-week protocol pairing low-GI eating with inositol supplementation. Targets HOMA-IR reduction and cycle regularity. Adapted from Lim et al. 2019 + my own outcomes data.",
    phases: [{ label: "Stabilize", weeks: "wk 1–4" }, { label: "Lower", weeks: "wk 5–8" }, { label: "Maintain", weeks: "wk 9–12" }],
    stats: [{ k: "Active clients", v: "12" }, { k: "Avg HOMA-IR Δ", v: "−1.4" }, { k: "Adherence", v: "82%" }],
  },
  {
    pill: "T2 diabetes", pillClass: "t2d",
    name: "Stepped carb · CGM-aware",
    desc: "16-week protocol that ramps carbs down from baseline by 15g/wk, calibrated to weekly CGM data. Best for clients on metformin only. Stops the step when HbA1c reaches 6.5%.",
    phases: [{ label: "Baseline", weeks: "wk 1–2" }, { label: "Step down", weeks: "wk 3–10" }, { label: "Hold", weeks: "wk 11–14" }, { label: "Maintain", weeks: "wk 15–16" }],
    stats: [{ k: "Active clients", v: "22" }, { k: "Avg HbA1c Δ", v: "−1.2%" }, { k: "Adherence", v: "76%" }],
  },
  {
    pill: "Cutting", pillClass: "cut",
    name: "Cutting · West African staples",
    desc: "8-week protocol built around jollof, beans, fish, and plantain. 1,650-1,800 kcal target. Designed to feel like normal food, not “diet food” — the highest-adherence cut I’ve ever run.",
    phases: [{ label: "Cycle 1", weeks: "wk 1–4" }, { label: "Refeed", weeks: "wk 5" }, { label: "Cycle 2", weeks: "wk 6–8" }],
    stats: [{ k: "Active clients", v: "18" }, { k: "Avg weight Δ", v: "−4.2 kg" }, { k: "Adherence", v: "88%" }],
  },
  {
    pill: "Gestational", pillClass: "ges",
    name: "Gestational · 2nd / 3rd trimester",
    desc: "Trimester-specific protocol with iron + folate emphasis, gestational diabetes screening at wk 24-28, and balanced macros to support fetal growth without excessive maternal weight gain.",
    phases: [{ label: "2nd trim", weeks: "wk 14–27" }, { label: "3rd trim", weeks: "wk 28–40" }],
    stats: [{ k: "Active clients", v: "4" }, { k: "Weight on track", v: "4 / 4" }, { k: "Adherence", v: "86%" }],
  },
  {
    pill: "IBS", pillClass: "fod",
    name: "Low FODMAP · elimination + reintro",
    desc: "Monash-aligned 6-week elimination followed by 8-week structured reintroduction across 6 FODMAP categories. The reintroduction is where the real value lives — most clinicians stop too early.",
    phases: [{ label: "Elim", weeks: "wk 1–6" }, { label: "Reintro", weeks: "wk 7–14" }],
    stats: [{ k: "Active clients", v: "5" }, { k: "IBS-SSS Δ", v: "−118" }, { k: "Adherence", v: "72%" }],
  },
  {
    pill: "Sport performance", pillClass: "spt",
    name: "Periodized · contact sports",
    desc: "8-week protocol periodized to training phase. Peak intake during heavy-volume blocks, taper during competition, with creatine and electrolyte timing dialed in for hot-weather Lagos training.",
    phases: [{ label: "Volume", weeks: "wk 1–4" }, { label: "Peak", weeks: "wk 5–6" }, { label: "Taper", weeks: "wk 7–8" }],
    stats: [{ k: "Active clients", v: "6" }, { k: "Performance Δ", v: "+ 8%" }, { k: "Adherence", v: "81%" }],
  },
];

export default function DietitianProtocolsPage() {
  return (
    <DietitianDashboardShell
      activeItem="Protocols"
      crumb="Protocols"
      actions={<button className="btn-primary-v2 sm">+ New protocol</button>}
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Clinical protocols</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Reusable methodologies · the framework that turns a 12-week plan into outcomes you can repeat</div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active protocols", value: "6", delta: "2 evidence-backed updates" },
          { label: "Applied · MTD", value: "14", delta: "↑ 18% vs Apr" },
          { label: "Avg outcome", value: "78%", delta: "Adherence · 90 days" },
          { label: "Most picked", value: "T2D stepped carb", small: true, delta: "22 clients on it now" },
        ].map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className={`font-medium mt-1.5 ${k.small ? "text-[17px]" : "text-[24px]"}`} style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Protocol cards — 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {PROTOCOLS.map((p) => (
          <div key={p.name} className="rounded-(--r-3) overflow-hidden cursor-pointer" style={{ background: "var(--bg)", border: "1px solid var(--border)", transition: "border-color var(--motion-fast) var(--ease)" }}>
            {/* Head */}
            <div className="px-5.5 pt-5 pb-3.5">
              <span className="inline-block font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-(--r-1) mb-2" style={PILL_STYLES[p.pillClass]}>{p.pill}</span>
              <div className="text-[18px] font-medium" style={{ letterSpacing: "-0.012em", color: "var(--ink)" }}>{p.name}</div>
              <div className="text-[13px] mt-2" style={{ color: "var(--fg-2)", lineHeight: 1.55, maxWidth: "56ch" }}>{p.desc}</div>
            </div>

            {/* Phases */}
            <div className="px-5.5 pb-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.05em] mb-2" style={{ color: "var(--fg-3)" }}>Phases</div>
              <div className="flex gap-1 items-center">
                {p.phases.map((ph) => (
                  <div key={ph.label} className="flex-1 text-center py-2 px-2.5 rounded-(--r-1)" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                    <div className="text-[11.5px] font-medium" style={{ color: "var(--ink)" }}>{ph.label}</div>
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{ph.weeks}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats footer */}
            <div className="grid grid-cols-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
              {p.stats.map((s, si) => (
                <div key={s.k} className="py-3.5" style={{ padding: "14px 12px", paddingLeft: si === 0 ? "22px" : "12px", paddingRight: si === 2 ? "22px" : "12px", borderRight: si < 2 ? "1px solid var(--border)" : "none" }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.k}</div>
                  <div className="text-[14px] font-medium mt-0.75" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DietitianDashboardShell>
  );
}
