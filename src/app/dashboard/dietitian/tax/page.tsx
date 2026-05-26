import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";

const KPIS = [
  { label: "Net · 2025", value: "₦ 18.4M", delta: "Tax owed ₦ 4.2M" },
  { label: "Q1 2026 · est.", value: "₦ 1.1M", delta: "Due May 31" },
  { label: "VAT", value: "Not applicable", delta: "Healthcare exempt", small: true },
  { label: "Tax year", value: "Jan 1 – Dec 31", delta: "Nigerian PIT", small: true },
];

const RETURNS = [
  { year: "2026 · in progress", status: "Live", statusType: "warn" as const, gross: "₦ 4.4M", net: "₦ 3.9M", tax: "₦ 920k (est.)", action: "Preview" },
  { year: "2025", status: "Filed", statusType: "ok" as const, gross: "₦ 21.8M", net: "₦ 18.4M", tax: "₦ 4.2M", action: "Download Form A" },
  { year: "2024", status: "Filed", statusType: "ok" as const, gross: "₦ 12.4M", net: "₦ 10.8M", tax: "₦ 2.1M", action: "Download Form A" },
];

export default function DietitianTaxPage() {
  return (
    <DietitianDashboardShell activeItem="Earnings" crumb="Tax">
      <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Tax</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-(--r-3) p-3.5 px-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className={`font-medium tracking-[-0.02em] tabular-nums mt-1 ${k.small ? "text-[18px]" : "text-[24px]"}`} style={{ color: "var(--ink)" }}>{k.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Annual returns */}
      <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Annual returns</h3>
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              {["Year", "Status", "Gross", "Net", "Tax owed", ""].map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RETURNS.map((r) => (
              <tr key={r.year} className="hover:bg-[var(--bg-2)]">
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}><strong style={{ color: "var(--ink)" }}>{r.year}</strong></td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={r.statusType === "ok" ? { background: "var(--signal-soft)", color: "var(--signal-ink)" } : { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" }}>{r.status}</span>
                </td>
                <td className="px-3.5 py-3 font-mono" style={{ borderBottom: "1px solid var(--border)" }}>{r.gross}</td>
                <td className="px-3.5 py-3 font-mono" style={{ borderBottom: "1px solid var(--border)" }}>{r.net}</td>
                <td className="px-3.5 py-3 font-mono" style={{ borderBottom: "1px solid var(--border)" }}>{r.tax}</td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>{r.action}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
