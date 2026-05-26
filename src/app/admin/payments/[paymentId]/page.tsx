import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Details",
  description: "View payment transaction details and processing history.",
};

export default function AdminSinglePaymentPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = React.use(params);
  void paymentId;

  return (
    <AdminDashboardShell
      activeItem="Payments"
      crumb="PI_3OqL08"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Refund manually</button>
          <button className="btn-primary-v2">Defend chargeback</button>
        </div>
      }
    >
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Transaction · <span className="font-mono text-[24px]">PI_3OqL08</span>
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {"€"} 89.00 · Stripe · 18 May 10:14 ·{" "}
          <Pill variant="danger">Chargeback opened</Pill>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "Amount", value: "€ 89.00", delta: "EUR · DE", deltaColor: "var(--signal-ink)" },
          { label: "Gateway fee", value: "€ 2.85", delta: "3.2% + €0.25", deltaColor: "var(--fg-3)" },
          { label: "Net to provider", value: "€ 81.70", delta: "After platform fee", deltaColor: "var(--signal-ink)" },
          { label: "Status", value: "Chargeback", delta: "Evidence due 36h", deltaColor: "var(--danger)", valueColor: "var(--danger)", small: true },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-[10px] p-[13px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className={`font-medium mt-1 ${kpi.small ? "text-[18px]" : "text-[22px]"}`} style={{ color: kpi.valueColor || "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: kpi.deltaColor }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5">
        <Card title="Trace · gateway timeline">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Timestamp", "Event", "Source"].map((h) => (
                    <th key={h} className="text-left font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-3.5" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { ts: "18 May 10:14:22 UTC", event: "Payment intent created", src: "Binectics" },
                  { ts: "18 May 10:14:24 UTC", event: "3DS challenge presented", src: "Stripe" },
                  { ts: "18 May 10:14:48 UTC", event: "3DS authenticated", src: "Cardholder bank" },
                  { ts: "18 May 10:14:49 UTC", event: "Payment captured · € 89.00", src: "Stripe" },
                  { ts: "18 May 10:14:51 UTC", event: "Webhook delivered to Binectics", src: "Stripe → Binectics" },
                  { ts: "22 May 14:32:18 UTC", event: "Chargeback opened · reason 4855 service not as described", src: "Cardholder bank" },
                  { ts: "22 May 14:33:02 UTC", event: "Webhook delivered · dispute.created", src: "Stripe → Binectics" },
                ].map((r) => (
                  <tr key={r.ts}>
                    <td className="py-[11px] px-3.5 font-mono text-[11.5px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.ts}</td>
                    <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{r.event}</td>
                    <td className="py-[11px] px-3.5" style={{ borderBottom: "1px solid var(--border)" }}>{r.src}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-3.5">
          <Card title="Booking">
            <InfoTable rows={[
              { label: "Member", val: "Card holder •••• 4421" },
              { label: "Provider", val: "CrossPower Stuttgart" },
              { label: "Service", val: "Single session · 19 May 18:00" },
              { label: "Attended", val: "Yes · QR check-in confirmed" },
            ]} />
          </Card>
          <Card title="Chargeback">
            <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { label: "Reason code", val: "4855" },
                  { label: "Claim", val: "\"Service not as described\"" },
                  { label: "Evidence due", val: "26 May · 36h left" },
                ].map((r) => (
                  <tr key={r.label}>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{r.label}</td>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.val}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)", fontWeight: 600 }}>Likelihood</td>
                  <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                    <Pill variant="ok">High win · QR attended</Pill>
                  </td>
                </tr>
              </tbody>
            </table>
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
