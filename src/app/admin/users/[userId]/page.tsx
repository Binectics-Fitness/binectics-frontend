import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Details",
  description: "View user account details, activity, and manage their status.",
};

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = React.use(params);
  void userId;

  return (
    <AdminDashboardShell
      activeItem="Users"
      crumb="USR-2026-008412"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Impersonate</button>
          <button className="btn-ghost-v2">Send DM</button>
          <button className="btn-primary-v2" style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "oklch(0.98 0 0)" }}>
            Suspend
          </button>
        </div>
      }
    >
      {/* Header with avatar */}
      <div className="flex flex-col sm:flex-row gap-4.5 items-start sm:items-center">
        <div
          className="w-[72px] h-[72px] rounded-[12px] shrink-0"
          style={{ background: "linear-gradient(135deg, oklch(0.85 0.04 120), oklch(0.72 0.06 100))" }}
        />
        <div className="flex-1">
          <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            Tunde Adebayo
          </h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            USR-2026-008412 · joined 18 Jan 2025 · Cape Town · ZA ·{" "}
            <Pill variant="ok">Good standing</Pill>
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "LTV", value: "R 18,400", delta: "Top 12%" },
          { label: "Bookings", value: "42", delta: "88% completed" },
          { label: "Disputes", value: "1", delta: "Resolved · split", deltaColor: "var(--fg-3)" },
          { label: "Risk score", value: "12", delta: "/ 100 · low" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-[10px] p-[13px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: kpi.deltaColor || "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Two-column: Account info + Admin notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <Card title="Account info">
          <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {[
                { label: "Name", val: "Tunde Adebayo" },
                { label: "Email", val: <>tunde@email.com <Pill variant="ok">verified</Pill></> },
                { label: "Phone", val: <>+27 82 *** 4218 <Pill variant="ok">2FA on</Pill></> },
                { label: "Country", val: "South Africa" },
                { label: "Sign-in method", val: "Email · Apple SSO" },
                { label: "Devices", val: "2 · iPhone 15 · MacBook Air" },
                { label: "Joined from", val: "Instagram ad · Q1 2025 campaign" },
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

        <Card title="Admin notes · 3">
          <div className="flex flex-col gap-2.5">
            {[
              { text: "\"Asked about adding a second city for travel. Routed to settings docs.\"", by: "Andile · 14 May" },
              { text: "\"Dispute opened DSP-2401 · 50/50 split agreed with Iron Lab. Member happy.\"", by: "Andile · 18 May" },
            ].map((note) => (
              <div key={note.by} className="p-[10px_12px] rounded-(--r-2)" style={{ background: "var(--bg-2)" }}>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--fg-2)" }}>{note.text}</p>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-1" style={{ color: "var(--fg-3)" }}>{note.by}</div>
              </div>
            ))}
            <button className="btn-ghost-v2 self-start">+ Add note</button>
          </div>
        </Card>
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
