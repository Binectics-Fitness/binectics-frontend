import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance",
  description: "Regulatory compliance monitoring and audit tools for Binectics.",
};

export default function AdminCompliancePage() {
  return (
    <AdminDashboardShell
      activeItem="Compliance"
      crumb="Compliance"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-ghost-v2">Audit log</button>
          <button className="btn-primary-v2">+ Add filing</button>
        </div>
      }
    >
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Compliance · per country
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          52 countries · 4 regulatory frameworks · 28 active deadlines
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "Filings due · 30d", value: "8", delta: "3 overdue", warn: true },
          { label: "KYC pending", value: "412", delta: "Avg 38h to clear", warn: false },
          { label: "Compliance score", value: "94", delta: "↑ 2 pts QTD", warn: false },
          { label: "Active investigations", value: "2", delta: "FICA · BaFin", warn: false },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-[10px] p-[13px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: kpi.warn ? "oklch(0.45 0.16 75)" : "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Upcoming deadlines */}
      <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Upcoming deadlines</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Country", "Filing", "Owner", "Status"].map((h) => (
                  <th key={h} className="text-left font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-3.5" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { date: "28 May", country: "South Africa", filing: "POPIA quarterly report", owner: "Lerato M.", status: "In review", pill: "warn" },
                { date: "31 May", country: "Nigeria", filing: "PIT Q1 returns", owner: "Kemi A.", status: "Draft", pill: "warn" },
                { date: "02 Jun", country: "UAE", filing: "VAT monthly · May", owner: "Hassan R.", status: "Ready", pill: "ok" },
                { date: "12 Jun", country: "Germany", filing: "DSGVO annual review", owner: "Alex M.", status: "Draft", pill: "warn" },
                { date: "15 Jun", country: "Kenya", filing: "PAYE remittance", owner: "Operations", status: "On track", pill: "ok" },
                { date: "30 Jun", country: "South Africa", filing: "SARS provisional Q1", owner: "Lerato M.", status: "Draft", pill: "warn" },
                { date: "12 Jul", country: "Nigeria", filing: "EFCC AML reporting", owner: "Kemi A.", status: "On track", pill: "ok" },
                { date: "18 Jul", country: "India", filing: "GST returns Q2", owner: "Country lead", status: "Pending hire", pill: "danger" },
              ].map((r) => (
                <tr key={r.date + r.filing}>
                  <td className="py-[11px] px-3.5 font-mono text-[12px]" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}>{r.date}</td>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{r.country}</td>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{r.filing}</td>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{r.owner}</td>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <Pill variant={r.pill as "ok" | "warn" | "danger"}>{r.status}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-column: KYC stats + Regulatory bodies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>KYC stats · provider</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-[13px]" style={{ borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { label: "Approved · 30d", val: "1,284 · 76%", bold: true },
                  { label: "Rejected", val: "218 · 13%", bold: false },
                  { label: "Pending", val: "186 · 11%", bold: false },
                  { label: "Avg time to decision", val: "38 hours", bold: true },
                  { label: "Re-submission accepted", val: "82%", bold: false },
                ].map((r) => (
                  <tr key={r.label}>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)", fontWeight: r.bold ? 600 : 400 }}>{r.label}</td>
                    <td className="py-[11px] px-[14px] font-mono" style={{ borderBottom: "1px solid var(--border)" }}>{r.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Regulatory bodies</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-[13px]" style={{ borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { body: "SARS · ZA", status: "Clean", pill: "ok" },
                  { body: "POPIA · ZA", status: "Compliant", pill: "ok" },
                  { body: "FIRS · NG", status: "Clean", pill: "ok" },
                  { body: "BaFin · DE", status: "Under review", pill: "warn" },
                  { body: "FCA · GB", status: "Compliant", pill: "ok" },
                  { body: "DSGVO · EU", status: "Compliant", pill: "ok" },
                ].map((r) => (
                  <tr key={r.body}>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.body}</td>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                      <Pill variant={r.pill as "ok" | "warn"}>{r.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminDashboardShell>
  );
}

/* ─── Pill helper ──────────────────────────────────────────── */
function Pill({ variant, children }: { variant: "ok" | "warn" | "danger"; children: React.ReactNode }) {
  const styles: Record<string, { background: string; color: string }> = {
    ok: { background: "var(--signal-soft)", color: "var(--signal-ink)" },
    warn: { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" },
    danger: { background: "var(--danger-soft)", color: "var(--danger)" },
  };
  return (
    <span className="font-mono text-[10px] px-[7px] py-[2px] rounded-full uppercase tracking-[0.04em]" style={styles[variant]}>
      {children}
    </span>
  );
}
