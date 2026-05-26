import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import Link from "next/link";
import React from "react";

export default function AdminSingleDisputePage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = React.use(params);
  void disputeId;

  return (
    <AdminDashboardShell
      activeItem="Disputes"
      crumb="DSP-2401"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Escalate</button>
          <Link href="/admin/disputes/DSP-2401/resolve" className="btn-primary-v2 no-underline">
            Open resolve flow
          </Link>
        </div>
      }
    >
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Dispute · Pier Botha vs Iron Lab
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Cancelled session refund · R 1,200 · opened 32h ago ·{" "}
          <Pill variant="warn">SLA in 1h 12m</Pill>
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5">
        {/* Left: Timeline + Evidence */}
        <div className="flex flex-col gap-3.5">
          <Card title="Timeline">
            <div className="flex flex-col gap-3.5">
              {[
                { time: "11 May 14:32", text: "Member booked session · R 1,200 charged" },
                { time: "18 May 09:14", text: "Member cancelled (system shows 33h notice)" },
                { time: "18 May 09:18", text: "Member opened dispute claiming full refund per ToS" },
                { time: "18 May 10:42", text: "Provider (Iron Lab) refused - claims 8h 46m actual notice" },
                { time: "18 May 14:02", text: "Admin (Andile) found UI showed wrong notice value · reschedule timing issue" },
                { time: "18 May 14:08", text: "Admin proposed 50/50 split + UI fix · awaiting both parties (4h window)" },
              ].map((evt) => (
                <div key={evt.time} className="grid gap-3.5" style={{ gridTemplateColumns: "120px 1fr" }}>
                  <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                    {evt.time}
                  </span>
                  <div className="text-[13.5px]">{evt.text}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Evidence · 3 items">
            <div className="overflow-x-auto">
            <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { label: "Member screenshot", desc: "cancel-confirmation-screen.png · shows 33h notice" },
                  { label: "Provider audit log", desc: "Iron Lab booking system export · shows 8h 46m" },
                  { label: "System audit log", desc: "Binectics-side · confirms member rescheduled wk earlier" },
                ].map((r) => (
                  <tr key={r.label}>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{r.label}</td>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.desc}</td>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                      <button className="btn-ghost-v2 !py-[5px] !px-2.5 !text-[12px]">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        </div>

        {/* Right: Parties + Risk */}
        <div className="flex flex-col gap-3.5">
          <Card title="Parties">
            <div className="flex flex-col gap-3">
              {[
                { name: "Pier Botha", meta: "Member · 14 bookings · ZA" },
                { name: "Iron Lab", meta: "Gym · 4 locations · ZA" },
              ].map((p) => (
                <div key={p.name} className="p-[10px_14px] rounded-(--r-2)" style={{ background: "var(--bg-2)" }}>
                  <div className="text-[13px] font-medium">{p.name}</div>
                  <div className="font-mono text-[11px] uppercase mt-0.5" style={{ color: "var(--fg-3)" }}>{p.meta}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Risk signals">
            <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { label: "Pier · refund pattern", status: "Low · 1st dispute" },
                  { label: "Iron Lab · dispute history", status: "Clean · 2 in 12mo" },
                  { label: "Amount", status: "Standard" },
                ].map((r) => (
                  <tr key={r.label}>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.label}</td>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                      <Pill variant="ok">{r.status}</Pill>
                    </td>
                  </tr>
                ))}
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
