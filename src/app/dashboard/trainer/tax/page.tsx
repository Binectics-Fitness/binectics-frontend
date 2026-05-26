import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";

/**
 * Trainer Tax — Sarah Okafor
 * Hardcoded to match trainer-tax.html prototype.
 */

const KPIS = [
  { label: "Net income · 2025", value: "R 624k", delta: "Provisional tax R 96k" },
  { label: "Q1 2026 · est.", value: "R 168k", delta: "Due Aug 31" },
  { label: "VAT status", value: "Not registered", small: true, delta: "Below R 1M threshold" },
  { label: "Tax year-end", value: "Feb 28", delta: "SA tax year" },
];

const RETURNS = [
  { year: "2026 · in progress", status: "Live", statusType: "warn" as const, gross: "R 218k", net: "R 196k", tax: "R 28k (est.)", action: "Preview" },
  { year: "2025", status: "Filed", statusType: "ok" as const, gross: "R 692k", net: "R 624k", tax: "R 96k", action: "Download IRP6" },
  { year: "2024", status: "Filed", statusType: "ok" as const, gross: "R 412k", net: "R 378k", tax: "R 42k", action: "Download IRP6" },
];

const BREAKDOWN = [
  { label: "1-on-1 sessions", value: "R 580k · 84%", bold: true },
  { label: "Online programming", value: "R 84k · 12%", bold: false },
  { label: "Workshops & events", value: "R 28k · 4%", bold: false },
  { label: "Total gross", value: "R 692,000", bold: true },
  { label: "Platform fees paid", value: "−R 41,520", bold: false },
  { label: "Equipment + cert renewals", value: "−R 18,400", bold: false },
  { label: "Insurance + accounting", value: "−R 8,200", bold: false },
  { label: "Net", value: "R 623,880", bold: true },
];

const STATUS_STYLE = {
  ok: { background: "var(--signal-soft)", color: "var(--signal-ink)" },
  warn: { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" },
};

export default function TaxPage() {
  return (
    <TrainerDashboardShell activeItem="Earnings" crumb="Tax">
      {/* Page head */}
      <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>Tax</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-1 rounded-(--r-3) px-4 py-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className={`font-medium ${kpi.small ? "text-[18px]" : "text-[24px]"}`} style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px]" style={{ color: "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Annual returns */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="px-5.5 py-4">
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Annual returns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px] min-w-[600px]">
            <thead>
              <tr>
                {["Year", "Status", "Gross", "Net", "Tax owed", ""].map((h) => (
                  <th key={h} className="text-left font-medium font-mono text-[10.5px] uppercase tracking-[0.04em] px-3.5 py-2.5" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RETURNS.map((r, idx) => (
                <tr key={r.year} className="hover:bg-bg-2">
                  <td className="px-3.5 py-3" style={{ borderBottom: idx < RETURNS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}><strong className="font-medium">{r.year}</strong></td>
                  <td className="px-3.5 py-3" style={{ borderBottom: idx < RETURNS.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span className="font-mono text-[10px] px-2 py-[2px] rounded-full uppercase tracking-[0.04em]" style={STATUS_STYLE[r.statusType]}>{r.status}</span>
                  </td>
                  <td className="px-3.5 py-3 font-mono" style={{ borderBottom: idx < RETURNS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.gross}</td>
                  <td className="px-3.5 py-3 font-mono" style={{ borderBottom: idx < RETURNS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.net}</td>
                  <td className="px-3.5 py-3 font-mono" style={{ borderBottom: idx < RETURNS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.tax}</td>
                  <td className="px-3.5 py-3" style={{ borderBottom: idx < RETURNS.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <button className="btn-ghost-v2 sm">{r.action}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2025 breakdown */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="px-5.5 py-4">
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>2025 breakdown &middot; sources</h3>
        </div>
        <table className="w-full border-collapse text-[13.5px]">
          <tbody>
            {BREAKDOWN.map((b, idx) => (
              <tr key={b.label} className="hover:bg-bg-2">
                <td className="px-3.5 py-3" style={{ borderBottom: idx < BREAKDOWN.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontWeight: b.bold ? 500 : 400 }}>{b.label}</td>
                <td className="px-3.5 py-3 text-right font-mono" style={{ borderBottom: idx < BREAKDOWN.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums", fontWeight: b.bold ? 500 : 400 }}>{b.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TrainerDashboardShell>
  );
}
