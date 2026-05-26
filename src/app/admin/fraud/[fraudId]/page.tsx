import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import React from "react";

export default function AdminSingleFraudPage({
  params,
}: {
  params: Promise<{ fraudId: string }>;
}) {
  const { fraudId } = React.use(params);
  void fraudId;

  return (
    <AdminDashboardShell
      activeItem="Fraud"
      crumb="FRD-2026-04841"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Watch · no action</button>
          <button className="btn-primary-v2" style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "oklch(0.98 0 0)" }}>
            Freeze account
          </button>
        </div>
      }
    >
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Fraud signal · Reza Mohammadi
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Refund-abuse pattern · 11 refunds in 30 days ·{" "}
          <Pill variant="danger">High risk</Pill>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "Refund rate", value: "11 / 14", delta: "79% · 5x platform avg", deltaColor: "var(--danger)" },
          { label: "Lifetime · paid", value: "د.إ 480", delta: "Net after refunds", deltaColor: "var(--fg-3)" },
          { label: "Same payment method", value: "3 accounts", delta: "Possible velocity fraud", deltaColor: "var(--danger)" },
          { label: "Account age", value: "62 days", delta: "Joined 24 Mar 2026", deltaColor: "var(--fg-3)" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-[10px] p-[13px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: kpi.deltaColor }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Pattern table */}
      <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Pattern</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Provider", "Service", "Amount", "Refunded", "Reason given"].map((h) => (
                  <th key={h} className="text-left font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-3.5" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { date: "22 May", provider: "Apex Body Manila", service: "Session", amount: "د.إ 280", reason: "Provider no-show" },
                { date: "19 May", provider: "Sarah Okafor", service: "Session", amount: "د.إ 480", reason: "Service not as described" },
                { date: "14 May", provider: "Iron Lab", service: "Day pass", amount: "د.إ 60", reason: "Provider no-show" },
                { date: "11 May", provider: "Marcus Bell", service: "Session", amount: "د.إ 280", reason: "Service not as described" },
                { date: "07 May", provider: "Themba M.", service: "Session", amount: "د.إ 480", reason: "Provider no-show" },
                { date: "02 May", provider: "Iron Lab", service: "Day pass", amount: "د.إ 60", reason: "Provider no-show" },
                { date: "28 Apr", provider: "Sarah Okafor", service: "Session", amount: "د.إ 480", reason: "Service not as described" },
              ].map((r) => (
                <tr key={r.date + r.provider}>
                  <td className="py-[11px] px-3.5 font-mono text-[12px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.date}</td>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{r.provider}</td>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{r.service}</td>
                  <td className="py-[11px] px-3.5 font-mono" style={{ borderBottom: "1px solid var(--border)" }}>{r.amount}</td>
                  <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <Pill variant="danger">Yes</Pill>
                  </td>
                  <td className="py-[11px] px-3.5 text-[12.5px]" style={{ borderBottom: "1px solid var(--border)", color: "var(--fg-2)" }}>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Related accounts */}
      <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Related accounts · same payment method</h3>
        <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {[
              { id: "USR_412884 · \"Reza M.\"", desc: "This account · 11 refunds", pill: "danger" as const, pillText: "Flagged" },
              { id: "USR_398201 · \"R Mohammadi\"", desc: "Sister account · 6 refunds", pill: "warn" as const, pillText: "Watch" },
              { id: "USR_421188 · \"M Reza\"", desc: "Tertiary · 2 refunds · created last week", pill: "warn" as const, pillText: "Watch" },
            ].map((r) => (
              <tr key={r.id}>
                <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{r.id}</td>
                <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.desc}</td>
                <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                  <Pill variant={r.pill}>{r.pillText}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </AdminDashboardShell>
  );
}

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
