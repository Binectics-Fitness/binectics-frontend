import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import Link from "next/link";
import React from "react";

export default function AdminSingleCountryPage({
  params,
}: {
  params: Promise<{ countryCode: string }>;
}) {
  const { countryCode } = React.use(params);
  void countryCode;

  return (
    <AdminDashboardShell
      activeItem="Countries"
      crumb="South Africa"
      actions={<button className="btn-ghost-v2">Country health</button>}
    >
      {/* Header with flag */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
        <div
          className="w-12 h-8 rounded shrink-0"
          style={{
            background: "linear-gradient(180deg, #007749 33%, #ffffff 33%, #ffffff 66%, #002395 66%)",
            border: "1px solid var(--border)",
          }}
        />
        <div>
          <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            South Africa · ZA
          </h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            Launched Mar 2024 · 4 cities · Paystack rails · ZAR primary
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "Active members", value: "142,820", delta: "↑ 8.2% MoM" },
          { label: "GMV · 30d", value: "R 14.2M", delta: "$ 768k USD equiv" },
          { label: "Providers", value: "2,148", delta: "98.4% verified" },
          { label: "Avg take rate", value: "5.0%", delta: "Locked policy" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-[10px] p-[13px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Operations + Regulations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <Card title="Operations">
          <InfoTable
            rows={[
              { label: "Currency", val: "ZAR · auto-formats R 1,234.56" },
              { label: "Payment rail", val: "Paystack · 99.97% uptime · 1.5% + R 1" },
              { label: "Tax authority", val: "SARS · we file payouts as 1099-equiv" },
              { label: "VAT", val: "15% · charged on member fee only" },
              { label: "Support hours", val: "06:00 - 22:00 SAST · 7 days" },
              { label: "Languages", val: "English (primary) · Afrikaans · isiZulu" },
            ]}
          />
        </Card>

        <Card title="Regulations">
          <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {[
                { label: "POPIA", val: <Pill variant="ok">Compliant · Jul 2021</Pill> },
                { label: "FICA", val: <Pill variant="ok">Verified · provider KYC</Pill> },
                { label: "Healthcare claims", val: "Banned for trainers · allowed for RDs" },
                { label: "Insurance min", val: "R 500k liability for in-person" },
                { label: "Age min", val: "18 to book · 14 with guardian" },
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

      {/* Ops contacts */}
      <Card title="Ops contacts">
        <div className="overflow-x-auto">
        <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {[
              { role: "Country lead", name: "Andile Khumalo", extra: <Link href="#" style={{ color: "var(--ink)" }}>andile@binectics</Link> },
              { role: "Legal · ZA", name: "Werksmans Inc. · Lisa Pretorius", extra: <Link href="#" style={{ color: "var(--ink)" }}>External</Link> },
              { role: "Banking", name: "ABSA · merchant account 4421", extra: <span style={{ color: "var(--fg-3)" }}>-</span> },
              { role: "Tax filing", name: "Mazars Cape Town · Lerato N.", extra: "Quarterly" },
            ].map((r) => (
              <tr key={r.role}>
                <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{r.role}</td>
                <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.name}</td>
                <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.extra}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </AdminDashboardShell>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoTable({ rows }: { rows: { label: string; val: string }[] }) {
  return (
    <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{r.label}</td>
            <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.val}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
