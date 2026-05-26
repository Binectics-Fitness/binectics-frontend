import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";

const TRANSACTIONS = [
  { date: "18 May 14:32", desc: "Session · Sarah Okafor · 20 May 08:30", amount: "R 1,200", status: "Charged", refund: false },
  { date: "14 May 09:00", desc: "Monthly · Iron Lab Pro", amount: "R 850", status: "Charged", refund: false },
  { date: "11 May 18:00", desc: "Session · Sarah Okafor · 15 May", amount: "R 1,200", status: "Charged", refund: false },
  { date: "05 May 11:32", desc: "Refund · cancelled session", amount: "+R 600", status: "Refunded", refund: true },
  { date: "02 May 09:00", desc: "Consult · Dr Nadia Hassan", amount: "R 950", status: "Charged", refund: false },
  { date: "14 Apr 09:00", desc: "Monthly · Iron Lab Pro", amount: "R 850", status: "Charged", refund: false },
  { date: "12 Apr 18:00", desc: "Session · Sarah Okafor", amount: "R 1,200", status: "Charged", refund: false },
  { date: "28 Mar 17:00", desc: "Session · Sarah Okafor", amount: "R 1,200", status: "Charged", refund: false },
  { date: "14 Mar 09:00", desc: "Monthly · Iron Lab Pro", amount: "R 850", status: "Charged", refund: false },
];

export default function BillingHistoryPage() {
  return (
    <MemberDashboardShell activeLabel="Home">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3"
        style={{
          marginBottom: 18,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 30,
              letterSpacing: "-0.024em",
              fontWeight: 500,
              color: "var(--ink)",
            }}
          >
            Billing history
          </h1>
          <p style={{ color: "var(--fg-3)", marginTop: 6 }}>
            All receipts &middot; all sessions &middot; sortable &middot;
            exportable
          </p>
        </div>
        <button
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            padding: "8px 14px",
            borderRadius: 6,
            fontSize: 13,
            cursor: "pointer",
            color: "var(--ink)",
          }}
        >
          Export CSV
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 14 }}>
        {[
          { label: "Lifetime spend", value: "R 18,400", delta: "Joined Jan 2025" },
          { label: "This year", value: "R 8,420", delta: "Avg R 842/mo" },
          { label: "Next renewal", value: "14 Jun", delta: "R 850 · auto", small: true },
          { label: "Cards on file", value: "1", delta: "VISA •••• 4421" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: 10.5,
                color: "var(--fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {kpi.label}
            </div>
            <div
              style={{
                fontSize: kpi.small ? 18 : 24,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
                marginTop: 4,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {kpi.value}
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 11, color: "var(--signal-ink)", marginTop: 4 }}
            >
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Transactions card */}
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 22,
        }}
      >
        <h3
          style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "var(--ink)" }}
        >
          All transactions
        </h3>
        <div className="overflow-x-auto">
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              {["Date", "Description", "Amount", "Status", ""].map((th) => (
                <th
                  key={th || "action"}
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 10.5,
                    color: "var(--fg-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-2)",
                  }}
                >
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map((t) => (
              <tr key={t.date + t.desc}>
                <td
                  className="font-mono"
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 11.5,
                    color: "var(--fg-2)",
                  }}
                >
                  {t.date}
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {t.desc}
                </td>
                <td
                  className="font-mono"
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                    color: t.refund ? "var(--signal-ink)" : undefined,
                  }}
                >
                  {t.amount}
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 999,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      background: t.refund
                        ? "oklch(0.96 0.06 75)"
                        : "var(--signal-soft)",
                      color: t.refund
                        ? "oklch(0.45 0.16 75)"
                        : "var(--signal-ink)",
                    }}
                  >
                    {t.status}
                  </span>
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <button
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      padding: "4px 10px",
                      minHeight: 44,
                      borderRadius: 6,
                      fontSize: 11.5,
                      cursor: "pointer",
                      color: "var(--ink)",
                    }}
                  >
                    Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </MemberDashboardShell>
  );
}
