import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";

const TICKETS = [
  {
    id: "DSP-2401",
    title: "Cancellation dispute",
    sub: "vs Iron Lab",
    lastMsg:
      '"After review, we found the cancellation UI showed an incorrect notice value..."',
    status: "In progress",
    statusType: "warn" as const,
    updated: "14m ago",
  },
  {
    id: "SUP-2026-04841",
    title: "QR not scanning",
    sub: "Iron Lab Sea Point",
    lastMsg:
      '"Glad you\'re in. Just so you know, this happens roughly once a month..."',
    status: "Resolved",
    statusType: "ok" as const,
    updated: "Yesterday",
  },
  {
    id: "SUP-2026-04212",
    title: "Add city for travel",
    sub: "",
    lastMsg:
      '"Tap your location switcher in Settings → Account. Multiple cities supported..."',
    status: "Resolved",
    statusType: "ok" as const,
    updated: "14 May",
  },
];

export default function HelpInboxPage() {
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
            Support inbox
          </h1>
          <p style={{ color: "var(--fg-3)", marginTop: 6 }}>
            Your support conversations &middot; response usually within 4h SAST
          </p>
        </div>
        <button
          style={{
            background: "var(--ink)",
            color: "var(--bg)",
            padding: "8px 14px",
            borderRadius: 6,
            border: 0,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + New ticket
        </button>
      </div>

      {/* Tickets card */}
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 22,
        }}
      >
        <div className="overflow-x-auto">
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              {["Ticket", "Last message", "Status", "Updated"].map((th) => (
                <th
                  key={th}
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
            {TICKETS.map((t) => (
              <tr key={t.id} style={{ cursor: "pointer" }}>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <strong style={{ fontSize: 13.5 }}>
                    {t.id} &middot; {t.title}
                  </strong>
                  {t.sub && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--fg-3)",
                        marginTop: 2,
                      }}
                    >
                      {t.sub}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 12.5,
                    color: "var(--fg-2)",
                  }}
                >
                  {t.lastMsg}
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
                      background:
                        t.statusType === "ok"
                          ? "var(--signal-soft)"
                          : "oklch(0.96 0.06 75)",
                      color:
                        t.statusType === "ok"
                          ? "var(--signal-ink)"
                          : "oklch(0.45 0.16 75)",
                    }}
                  >
                    {t.status}
                  </span>
                </td>
                <td
                  className="font-mono"
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 11.5,
                  }}
                >
                  {t.updated}
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
