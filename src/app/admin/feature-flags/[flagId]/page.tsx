import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feature Flag Details",
  description: "Configure and monitor a feature flag rollout.",
};

export default function AdminFeatureFlagDetailPage({
  params,
}: {
  params: Promise<{ flagId: string }>;
}) {
  const { flagId } = React.use(params);
  void flagId;

  return (
    <AdminDashboardShell
      activeItem="Feature flags"
      crumb="video_check_ins"
      actions={
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
          <button className="btn-ghost-v2">Edit targeting</button>
          <button className="btn-primary-v2" style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "oklch(0.98 0 0)" }}>
            Kill
          </button>
        </div>
      }
    >
      {/* Heading */}
      <div>
        <h1 className="font-mono text-[24px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          video_check_ins
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Selfie + GPS for online sessions · created 12 May ·{" "}
          <Pill variant="warn">In experiment</Pill>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "Rollout · current", value: "25%", delta: "ZA · NG only" },
          { label: "Users in test", value: "8,412", delta: "vs 25,236 holdout" },
          { label: "Days running", value: "14", delta: "Out of planned 21" },
          { label: "Decision date", value: "02 Jun 2026", delta: "Auto-evaluate", small: true },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-[10px] p-[13px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className={`font-medium mt-1 ${kpi.small ? "text-[18px]" : "text-[22px]"}`} style={{ color: "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5">
        <Card title="Rollout history">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Date", "Action", "% rollout", "By"].map((h) => (
                    <th key={h} className="text-left font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-3.5" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "12 May 14:00", action: "Created · ZA only", pct: "0%", by: "Marcus T." },
                  { date: "12 May 14:18", action: "Internal users only", pct: "0.1%", by: "Marcus T." },
                  { date: "14 May 09:00", action: "Canary · ZA", pct: "1%", by: "Marcus T." },
                  { date: "15 May 16:30", action: "Expanded · ZA", pct: "10%", by: "Andile K." },
                  { date: "18 May 10:00", action: "Added NG", pct: "10%", by: "Marcus T." },
                  { date: "22 May 11:00", action: "Increased", pct: "25%", by: "Andile K." },
                ].map((r) => (
                  <tr key={r.date}>
                    <td className="py-[11px] px-3.5 font-mono" style={{ borderBottom: "1px solid var(--border)" }}>{r.date}</td>
                    <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{r.action}</td>
                    <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{r.pct}</td>
                    <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{r.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-3.5">
          <Card title="Metrics">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-[13px]" style={{ borderCollapse: "collapse" }}>
                <tbody>
                  {[
                    { label: "Check-in success rate", val: "92.4%", delta: "+ 3.2%", variant: "ok" as const },
                    { label: "Fraud rate", val: "0.08%", delta: "- 0.4%", variant: "ok" as const },
                    { label: "Provider satisfaction", val: "4.6 / 5", delta: "+ 0.4", variant: "ok" as const },
                    { label: "Session drop-off", val: "2.1%", delta: "+ 0.3%", variant: "warn" as const },
                  ].map((r) => (
                    <tr key={r.label}>
                      <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.label}</td>
                      <td className="py-[11px] px-[14px] font-mono" style={{ borderBottom: "1px solid var(--border)" }}>{r.val}</td>
                      <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                        <Pill variant={r.variant}>{r.delta}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Targeting">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-[13px]" style={{ borderCollapse: "collapse" }}>
                <tbody>
                  {[
                    { label: "Countries", val: "ZA · NG" },
                    { label: "Role", val: "Provider · trainer + dietitian" },
                    { label: "% rollout", val: "25% of eligible" },
                    { label: "Excluded", val: "Iron Lab (legacy contract)" },
                  ].map((r) => (
                    <tr key={r.label}>
                      <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{r.label}</td>
                      <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminDashboardShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>{title}</h3>
      {children}
    </div>
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
