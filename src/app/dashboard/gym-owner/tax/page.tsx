import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

const FORMS = [
  { period: "Q1 · Mar–May", status: "In progress", statusType: "warn" as const, revenue: "R 3.2M", tax: "R 412k (est.)", action: "Preview" },
  { period: "2025 · Annual", status: "Filed", statusType: "ok" as const, revenue: "R 9.8M", tax: "R 1.42M", action: "Download PDF" },
  { period: "2024 · Annual", status: "Filed", statusType: "ok" as const, revenue: "R 4.2M", tax: "R 612k", action: "Download PDF" },
];

const BREAKDOWN = [
  { label: "Gross revenue", value: "R 9,824,180", bold: true },
  { label: "Platform fees paid", value: "−R 491,209", bold: false },
  { label: "Gateway fees", value: "−R 147,362", bold: false },
  { label: "Refunds issued", value: "−R 82,400", bold: false },
  { label: "Net revenue", value: "R 9,103,209", bold: true },
  { label: "Provisional tax (15.6%)", value: "R 1,420,100", bold: false },
];

const VAT = [
  { month: "Apr 2026", vat: "R 142,200", status: "Filed" },
  { month: "Mar 2026", vat: "R 138,800", status: "Filed" },
  { month: "Feb 2026", vat: "R 132,400", status: "Filed" },
];

export default function GymTaxFormsPage() {
  return (
    <GymDashboardShell activeItem="Settings" crumb="Tax forms">
      <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Tax forms</h1>

      {/* Main tax forms table */}
      <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <h3 className="text-[15px] font-medium mb-1" style={{ color: "var(--ink)" }}>2026 &middot; in progress</h3>
        <p className="text-[13.5px] mb-4" style={{ color: "var(--fg-2)" }}>Auto-generated quarterly summaries for SARS. Annual IRP6 form available at year-end.</p>
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              {["Period", "Status", "Revenue", "Provisional tax", ""].map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FORMS.map((f) => (
              <tr key={f.period} className="hover:bg-[var(--bg-2)]">
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}><strong style={{ color: "var(--ink)" }}>{f.period}</strong></td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={f.statusType === "ok" ? { background: "var(--signal-soft)", color: "var(--signal-ink)" } : { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" }}>{f.status}</span>
                </td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{f.revenue}</td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{f.tax}</td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>{f.action}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Breakdown + VAT */}
      <div className="grid lg:grid-cols-2 gap-3.5">
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Annual breakdown &middot; 2025</h3>
          <table className="w-full border-collapse text-[13.5px]">
            <tbody>
              {BREAKDOWN.map((b) => (
                <tr key={b.label}>
                  <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)", fontWeight: b.bold ? 600 : 400 }}>{b.label}</td>
                  <td className="px-3.5 py-3 text-right font-mono tabular-nums" style={{ borderBottom: "1px solid var(--border)", fontWeight: b.bold ? 500 : 400 }}>{b.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-1" style={{ color: "var(--ink)" }}>VAT &middot; monthly</h3>
          <p className="text-[13.5px] mb-3.5" style={{ color: "var(--fg-2)" }}>Iron Lab is VAT-registered. We auto-generate monthly returns and IRP201s -- your bookkeeper can pull them via API.</p>
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Month", "Output VAT", "Status"].map((h) => (
                  <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VAT.map((v) => (
                <tr key={v.month} className="hover:bg-[var(--bg-2)]">
                  <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{v.month}</td>
                  <td className="px-3.5 py-3 font-mono" style={{ borderBottom: "1px solid var(--border)" }}>{v.vat}</td>
                  <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>{v.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </GymDashboardShell>
  );
}
