import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

/**
 * Revenue — gym-revenue.html prototype.
 * KPIs (5), revenue chart with SVG, location breakdown bars, revenue mix, top coaches.
 */

const KPIS = [
  { label: "Revenue · 30d", value: "R 1.08M", delta: "↑ 12.4% MoM" },
  { label: "MRR", value: "R 932k", delta: "↑ 8.4%" },
  { label: "ARPU", value: "R 842", delta: "↑ R 18" },
  { label: "Refunds", value: "R 18.4k", delta: "↑ 4.2%", down: true },
  { label: "LTV · cohort", value: "R 14.2k", delta: "↓ 2.1%", down: true },
];

const LOCATIONS = [
  { name: "Sea Point", meta: "flagship · 380 members", w: "100%", amt: "R 412k", delta: "↑ 14.2%" },
  { name: "Foreshore", meta: "CBD · 312 members", w: "78%", amt: "R 318k", delta: "↑ 9.8%" },
  { name: "Camps Bay", meta: "boutique · 192 members", w: "50%", amt: "R 198k", delta: "↑ 18.4%" },
  { name: "Woodstock", meta: "CrossFit · 400 members", w: "38%", amt: "R 156k", delta: "↓ 3.2%", down: true },
];

const MIX = [
  { label: "Monthly subs", flex: 64, color: "var(--ink)", value: "R 692k · 64%" },
  { label: "Annual subs", flex: 22, color: "var(--signal)", value: "R 238k · 22%" },
  { label: "Day passes", flex: 10, color: "var(--gym)", value: "R 108k · 10%" },
  { label: "Personal training", flex: 4, color: "var(--trainer)", value: "R 44k · 4%" },
];

const COACHES = [
  { rank: "01", name: "Sarah Okafor", meta: "Strength · 28 sessions", w: "100%", amt: "R 38,400" },
  { rank: "02", name: "Themba Mokoena", meta: "Olympic · 22 sessions", w: "78%", amt: "R 29,800" },
  { rank: "03", name: "Marcus Bell", meta: "Mobility · 19 sessions", w: "64%", amt: "R 24,600" },
  { rank: "04", name: "Thandi Nkosi", meta: "Postnatal · 14 sessions", w: "38%", amt: "R 14,200" },
];

const TIME_FILTERS = ["7D", "30D", "QTD", "YTD", "Custom"];

export default function GymRevenuePage() {
  return (
    <GymDashboardShell
      activeItem="Revenue"
      crumb="Revenue"
      actions={
        <div className="flex border border-border rounded-(--r-2) overflow-hidden">
          {TIME_FILTERS.map((t, i) => (
            <button key={t} className={`px-3 py-1.5 text-[12px] font-mono ${i < TIME_FILTERS.length - 1 ? "border-r border-border" : ""} ${t === "30D" ? "bg-bg-3 font-medium" : ""}`} style={{ color: t === "30D" ? "var(--ink)" : "var(--fg-3)" }}>{t}</button>
          ))}
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Revenue</h1>
          <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Iron Lab · all locations · ZAR · 30 days through today</div>
        </div>
        <button className="btn-ghost-v2 sm">Export CSV</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[24px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: k.down ? "var(--danger)" : "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Revenue over time</h3>
            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>This period vs previous · daily granularity</div>
          </div>
        </div>
        <div className="p-5">
          <svg viewBox="0 0 600 280" preserveAspectRatio="none" className="w-full" style={{ height: "280px" }}>
            <defs>
              <linearGradient id="rev-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="oklch(0.55 0.16 148)" stopOpacity="0.18"/>
                <stop offset="1" stopColor="oklch(0.55 0.16 148)" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <g stroke="oklch(0.91 0.006 85)" strokeWidth="1">
              <line x1="0" y1="50" x2="600" y2="50"/><line x1="0" y1="110" x2="600" y2="110"/><line x1="0" y1="170" x2="600" y2="170"/><line x1="0" y1="230" x2="600" y2="230"/>
            </g>
            <path d="M 0 180 L 22 178 L 44 158 L 66 168 L 88 142 L 110 132 L 132 124 L 154 118 L 176 100 L 198 110 L 220 90 L 242 80 L 264 86 L 286 70 L 308 64 L 330 76 L 352 56 L 374 50 L 396 60 L 418 42 L 440 38 L 462 50 L 484 30 L 506 24 L 528 36 L 550 18 L 572 28 L 600 14 L 600 280 L 0 280 Z" fill="url(#rev-grad)"/>
            <path d="M 0 180 L 22 178 L 44 158 L 66 168 L 88 142 L 110 132 L 132 124 L 154 118 L 176 100 L 198 110 L 220 90 L 242 80 L 264 86 L 286 70 L 308 64 L 330 76 L 352 56 L 374 50 L 396 60 L 418 42 L 440 38 L 462 50 L 484 30 L 506 24 L 528 36 L 550 18 L 572 28 L 600 14" fill="none" stroke="oklch(0.55 0.16 148)" strokeWidth="2"/>
            <path d="M 0 200 L 22 196 L 44 184 L 66 188 L 88 168 L 110 158 L 132 148 L 154 140 L 176 130 L 198 140 L 220 124 L 242 116 L 264 122 L 286 108 L 308 100 L 330 112 L 352 96 L 374 88 L 396 96 L 418 82 L 440 76 L 462 84 L 484 70 L 506 64 L 528 72 L 550 58 L 572 64 L 600 54" fill="none" stroke="oklch(0.72 0.008 80)" strokeWidth="1.4" strokeDasharray="4 4"/>
            <circle cx="600" cy="14" r="4" fill="oklch(0.55 0.16 148)"/>
            <g fontFamily="var(--font-mono)" fontSize="10" fill="oklch(0.55 0.008 80)">
              <text x="6" y="48">R 50k</text><text x="6" y="108">R 38k</text><text x="6" y="168">R 26k</text><text x="6" y="228">R 14k</text>
            </g>
            <g fontFamily="var(--font-mono)" fontSize="10" fill="oklch(0.55 0.008 80)" textAnchor="middle">
              <text x="50" y="272">Apr 19</text><text x="200" y="272">Apr 26</text><text x="350" y="272">May 03</text><text x="500" y="272">May 10</text><text x="580" y="272">today</text>
            </g>
          </svg>
        </div>
        <div className="flex gap-6 px-5 pb-4 text-[12.5px]" style={{ color: "var(--fg-2)" }}>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: "oklch(0.55 0.16 148)" }} />This period · <strong style={{ color: "var(--ink)" }}>R 1.08M</strong></span>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: "oklch(0.72 0.008 80)" }} />Previous · R 964k</span>
        </div>
      </div>

      {/* Location breakdown + Revenue mix */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Revenue by location</h3>
            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Net of refunds · 30 days</div>
          </div>
          {LOCATIONS.map((l, i) => (
            <div key={l.name} className="grid items-center gap-4 px-5 py-3.5 grid-cols-[1fr_auto] sm:grid-cols-[160px_1fr_auto_auto]" style={{ borderBottom: i < LOCATIONS.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div>
                <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{l.name}</div>
                <div className="text-[11.5px]" style={{ color: "var(--fg-3)" }}>{l.meta}</div>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-3)" }}>
                <div className="h-full rounded-full" style={{ width: l.w, background: "var(--ink)" }} />
              </div>
              <span className="font-mono text-[13px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{l.amt}</span>
              <span className="font-mono text-[11.5px]" style={{ color: l.down ? "var(--danger)" : "var(--signal-ink)" }}>{l.delta}</span>
            </div>
          ))}
        </div>

        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Revenue mix</h3>
            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>By product type</div>
          </div>
          <div className="p-5">
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
              {MIX.map((m) => <div key={m.label} style={{ flex: m.flex, background: m.color }} className="rounded-full" />)}
            </div>
            <div className="flex flex-col gap-2.5 mt-5">
              {MIX.map((m) => (
                <div key={m.label} className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-2" style={{ color: "var(--fg-2)" }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />{m.label}</span>
                  <span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top coaches */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Top earning coaches</h3>
          <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>By personal-training revenue · 30 days</div>
        </div>
        {COACHES.map((c, i) => (
          <div key={c.rank} className="grid items-center gap-4 px-5 py-3.5 grid-cols-[28px_1fr_auto] sm:grid-cols-[28px_180px_1fr_auto]" style={{ borderBottom: i < COACHES.length - 1 ? "1px solid var(--border)" : "none" }}>
            <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>{c.rank}</span>
            <div>
              <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{c.name}</div>
              <div className="text-[11.5px]" style={{ color: "var(--fg-3)" }}>{c.meta}</div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-3)" }}>
              <div className="h-full rounded-full" style={{ width: c.w, background: "var(--ink)" }} />
            </div>
            <span className="font-mono text-[13px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{c.amt}</span>
          </div>
        ))}
      </div>
    </GymDashboardShell>
  );
}
