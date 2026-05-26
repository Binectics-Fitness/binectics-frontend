import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";

export default function AdminRefundsPage() {
  return (
    <AdminDashboardShell
      activeItem="Payments"
      crumb="Refund queue"
      actions={<button className="btn-ghost-v2">Export CSV</button>}
    >
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Refund queue
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          14 awaiting review · 3 over SLA · auto-approves under R 200 with 24h notice handled by the system
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Awaiting review", value: "14", delta: "↑ 2 since yesterday", deltaColor: "var(--signal-ink)" },
          { label: "Over SLA", value: "3", delta: "Decision due in 4h", valueColor: "var(--danger)", deltaColor: "oklch(0.45 0.16 75)" },
          { label: "Auto-approved · 30d", value: "218", delta: "86% of all refunds", deltaColor: "var(--signal-ink)" },
          { label: "Total refunded · 30d", value: "$ 28.4k", delta: "0.6% of GMV", deltaColor: "var(--fg-3)" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-(--r-3) p-[14px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: kpi.valueColor || "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: kpi.deltaColor }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-[14px_18px]" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Pending review</h3>
          <div className="flex gap-1 flex-wrap">
            {[
              { label: "All", count: "14", active: true },
              { label: "Over SLA", count: "3", active: false },
              { label: "Chargebacks", count: "2", active: false },
              { label: "High value", count: "4", active: false },
            ].map((f) => (
              <span
                key={f.label}
                className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
                style={{
                  background: f.active ? "var(--ink)" : "var(--bg)",
                  color: f.active ? "var(--bg)" : "var(--fg-3)",
                  border: f.active ? "1px solid var(--ink)" : "1px solid var(--border)",
                }}
              >
                {f.label} <span style={{ color: f.active ? "oklch(0.75 0.005 85)" : "var(--fg-4)", marginLeft: 4 }}>{f.count}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Case", "Parties", "Reason", "SLA", "Amount", "Action"].map((h, i) => (
                  <th
                    key={h}
                    className={`font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-4.5 ${i >= 4 ? "text-right" : "text-left"}`}
                    style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)", fontWeight: 500 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REFUND_ROWS.map((r) => (
                <tr key={r.caseId} className="hover:bg-[var(--bg-2)] cursor-pointer">
                  <td className="py-[13px] px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{r.caseId}</div>
                  </td>
                  <td className="py-[13px] px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="text-[13px]">
                      <strong className="font-medium" style={{ color: "var(--ink)" }}>{r.member}</strong>
                      {" → "}{r.provider}
                    </div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{r.sub}</div>
                  </td>
                  <td className="py-[13px] px-4.5 max-w-[32ch]" style={{ borderBottom: "1px solid var(--border)", fontSize: "12.5px", color: "var(--fg-2)" }}>
                    {r.reason}
                  </td>
                  <td className="py-[13px] px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <SlaPill variant={r.slaVariant}>{r.sla}</SlaPill>
                  </td>
                  <td className="py-[13px] px-4.5 text-right font-mono" style={{ borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>
                    {r.amount}
                  </td>
                  <td className="py-[13px] px-4.5 text-right" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex gap-1 justify-end">
                      <MiniBtn>Open</MiniBtn>
                      {r.action && <MiniBtn variant={r.actionVariant}>{r.action}</MiniBtn>}
                    </div>
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

/* ─── Data ──────────────────────────────────────────────────── */
const REFUND_ROWS = [
  { caseId: "REF-2026-04841", member: "Pier Botha", provider: "Iron Lab", sub: "Booking BIN-2026-040112", reason: "Cancellation UI showed 33h notice but actual was 8h. Discrepancy disputed.", sla: "SLA 1h 12m", slaVariant: "red" as const, amount: "R 1,200", action: "Approve", actionVariant: "primary" as const },
  { caseId: "REF-2026-04839", member: "Aman R.", provider: "Apex Body, Manila", sub: "Booking BIN-2026-039841", reason: "Provider rejected refund · cites ToS §4.2. Member requests platform review.", sla: "SLA 14h", slaVariant: "warn" as const, amount: "₱ 3,400", action: null, actionVariant: undefined },
  { caseId: "REF-2026-04835", member: "Halima D.", provider: "Lagos Lift Club", sub: "2× no-show", reason: "Trainer failed to show for 2 booked sessions. Provider hasn't responded in 48h.", sla: "SLA 22h", slaVariant: "warn" as const, amount: "₦ 28,000", action: "Auto-refund", actionVariant: "primary" as const },
  { caseId: "REF-2026-04832", member: "Card •••• 4421", provider: "CrossPower Stuttgart", sub: "Stripe chargeback · 4855", reason: "Bank-initiated chargeback. Service not as described. Evidence due in 36h.", sla: "Evidence 36h", slaVariant: "red" as const, amount: "€ 89.00", action: "Defend", actionVariant: "primary" as const },
  { caseId: "REF-2026-04828", member: "Folake A.", provider: "Dr Nadia Hassan", sub: "Plan not delivered", reason: "Intake completed but PDF plan never delivered after 5 business days.", sla: "SLA 18h", slaVariant: "warn" as const, amount: "₦ 165,000", action: null, actionVariant: undefined },
  { caseId: "REF-2026-04825", member: "Marcus B.", provider: "Strathmore Strength", sub: "Duplicate charge", reason: "Charged twice for same day pass. Gateway acknowledged duplicate.", sla: "SLA 8h", slaVariant: "ok" as const, amount: "KSh 1,400", action: "Auto-refund", actionVariant: "primary" as const },
  { caseId: "REF-2026-04822", member: "Reza M.", provider: "Multiple gyms", sub: "11 refunds / 30d", reason: "Refund abuse pattern. 11 requests this month against different providers.", sla: "SLA 24h", slaVariant: "ok" as const, amount: "د.إ 480", action: "Deny", actionVariant: "danger" as const },
  { caseId: "REF-2026-04818", member: "Wei Chen", provider: "Velo Cycling", sub: "Plan downgrade", reason: "Member downgraded plan mid-cycle. Pro-rata adjustment needed.", sla: "SLA 22h", slaVariant: "ok" as const, amount: "R 380", action: "Approve", actionVariant: "primary" as const },
];

/* ─── Helpers ──────────────────────────────────────────────── */
function SlaPill({ variant, children }: { variant: "ok" | "warn" | "red"; children: React.ReactNode }) {
  const styles: Record<string, { background: string; color: string }> = {
    ok: { background: "var(--signal-soft)", color: "var(--signal-ink)" },
    warn: { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" },
    red: { background: "var(--danger-soft)", color: "var(--danger)" },
  };
  return (
    <span className="font-mono text-[10.5px] px-2 py-[3px] rounded-full uppercase tracking-[0.04em]" style={styles[variant]}>
      {children}
    </span>
  );
}

function MiniBtn({ variant, children }: { variant?: "primary" | "danger"; children: React.ReactNode }) {
  const base = "font-mono text-[10px] px-[9px] py-1 rounded-(--r-1) uppercase tracking-[0.04em] cursor-pointer";
  if (variant === "primary") {
    return <button className={base} style={{ background: "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)" }}>{children}</button>;
  }
  if (variant === "danger") {
    return <button className={base} style={{ background: "var(--bg)", color: "var(--danger)", border: "1px solid oklch(0.88 0.05 25)" }}>{children}</button>;
  }
  return <button className={base} style={{ background: "var(--bg)", color: "var(--fg-2)", border: "1px solid var(--border)" }}>{children}</button>;
}
