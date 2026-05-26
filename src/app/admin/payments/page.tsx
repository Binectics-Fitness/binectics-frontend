import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";

const TRANSACTIONS = [
  { tx: "PI_3OqL1k_4221", booking: "BIN-040112", member: "Tunde A.", gw: "Stripe", gwColor: "oklch(0.45 0.13 280)", amount: "R 1,200", status: "Captured", statusType: "ok", latency: "312ms", at: "2s ago" },
  { tx: "FLW-2026-04A", booking: "BIN-040108", member: "Halima D.", gw: "Flutterw", gwColor: "oklch(0.48 0.16 30)", amount: "₦ 28,000", status: "Captured", statusType: "ok", latency: "1.2s", at: "8s ago" },
  { tx: "MP-STK-0118", booking: "BIN-040105", member: "Marcus B.", gw: "M-Pesa", gwColor: "oklch(0.52 0.14 145)", amount: "KSh 1,400", status: "Pending STK", statusType: "warn", latency: "—", at: "12s ago" },
  { tx: "RZP_p4xJM_18", booking: "BIN-040102", member: "Priya S.", gw: "Razorp", gwColor: "oklch(0.45 0.15 240)", amount: "₹ 4,200", status: "Captured", statusType: "ok", latency: "284ms", at: "28s ago" },
  { tx: "PI_3OqL18_3982", booking: "BIN-040098", member: "Card •••• 4421", gw: "Stripe", gwColor: "oklch(0.45 0.13 280)", amount: "€ 89.00", status: "3DS failed", statusType: "fail", latency: "8.4s", at: "42s ago" },
  { tx: "PI_3OqL17_3914", booking: "BIN-040091", member: "Pier B.", gw: "Stripe", gwColor: "oklch(0.45 0.13 280)", amount: "R 380", status: "Captured", statusType: "ok", latency: "298ms", at: "1m ago" },
  { tx: "PI_3OqL12_REF", booking: "BIN-040022", member: "Marcus B.", gw: "Stripe", gwColor: "oklch(0.45 0.13 280)", amount: "−R 1,400", status: "Refund", statusType: "warn", latency: "412ms", at: "2m ago" },
  { tx: "PI_3OqL08_CBK", booking: "BIN-039841", member: "Card •••• 8812", gw: "Stripe", gwColor: "oklch(0.45 0.13 280)", amount: "−€ 89.00", status: "Chargeback", statusType: "fail", latency: "—", at: "4m ago" },
];

const GATEWAYS = [
  { name: "Stripe", region: "global", gwColor: "oklch(0.45 0.13 280)", authPct: "94.8%", latency: "412ms", status: "Healthy", statusColor: "var(--signal-ink)", fill: 94.8, fillColor: "var(--signal)" },
  { name: "Flutterwave", region: "WAF", gwColor: "oklch(0.48 0.16 30)", authPct: "91.2%", latency: "980ms", status: "Degraded · slow auth", statusColor: "oklch(0.45 0.16 75)", fill: 91.2, fillColor: "oklch(0.65 0.18 75)" },
  { name: "M-Pesa", region: "KE", gwColor: "oklch(0.52 0.14 145)", authPct: "88.4%", latency: "1.4s", status: "Daraja API · 3 timeouts", statusColor: "oklch(0.45 0.16 75)", fill: 88.4, fillColor: "oklch(0.65 0.18 75)" },
  { name: "Razorpay", region: "IN", gwColor: "oklch(0.45 0.15 240)", authPct: "96.4%", latency: "308ms", status: "Healthy", statusColor: "var(--signal-ink)", fill: 96.4, fillColor: "var(--signal)" },
];

function TxStatus({ type }: { type: string }) {
  const s: Record<string, { bg: string; color: string }> = {
    ok: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
    warn: { bg: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" },
    fail: { bg: "var(--danger-soft)", color: "var(--danger)" },
  };
  const st = s[type] || s.ok;
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 10.5,
        padding: "2px 7px",
        borderRadius: 999,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        color: st.color,
        background: st.bg,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
      {type === "ok" ? "Captured" : type === "warn" ? "Pending" : "Failed"}
    </span>
  );
}

export default function PaymentsPage() {
  return (
    <AdminDashboardShell activeItem="Payments" crumb="Payments">
      <div>
        <h1
          style={{
            fontSize: 30,
            letterSpacing: "-0.022em",
            fontWeight: 500,
            color: "var(--ink)",
          }}
        >
          Payments
        </h1>
        <div style={{ color: "var(--fg-3)", fontSize: 13.5, marginTop: 6 }}>
          All gateway activity across Stripe, Flutterwave, M-Pesa, Razorpay
          &middot; live ops view &middot; USD-normalized
        </div>
      </div>

      {/* KPIs — 5 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Volume · today", value: "$ 184k", delta: "↑ 7% vs avg Tue", deltaColor: "var(--signal-ink)" },
          { label: "Auth success", value: "94.2%", delta: "3DS rate 18%", deltaColor: "var(--signal-ink)" },
          { label: "Payouts queued", value: "$ 642k", delta: "812 recipients", deltaColor: "var(--fg-3)" },
          { label: "Chargebacks · 30d", value: "28", delta: "0.18% of volume", deltaColor: "var(--danger)" },
          { label: "Reconciliation", value: "Clean", delta: "Last run 02:14 UTC", deltaColor: "var(--signal-ink)", valueColor: "var(--signal-ink)" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-3)",
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
                fontSize: 22,
                fontWeight: 500,
                color: kpi.valueColor || "var(--ink)",
                letterSpacing: "-0.018em",
                fontVariantNumeric: "tabular-nums",
                marginTop: 4,
              }}
            >
              {kpi.value}
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: 11,
                color: kpi.deltaColor,
                marginTop: 4,
              }}
            >
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Grid: chart + health */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4.5">
        {/* Volume chart card */}
        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-3)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
              Volume by gateway &middot; last 24h
            </h3>
            <div style={{ display: "flex", gap: 4 }}>
              {["24h", "7d", "30d"].map((p) => (
                <span
                  key={p}
                  className="font-mono"
                  style={{
                    fontSize: 10.5,
                    padding: "3px 8px",
                    border: p === "7d" ? "1px solid var(--ink)" : "1px solid var(--border)",
                    borderRadius: 999,
                    color: p === "7d" ? "var(--bg)" : "var(--fg-3)",
                    background: p === "7d" ? "var(--ink)" : "var(--bg)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div style={{ padding: 18 }}>
            <svg
              viewBox="0 0 600 240"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%", height: 240 }}
            >
              <defs>
                <linearGradient id="gStripe" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.45 0.13 280)" stopOpacity="0.85"/><stop offset="1" stopColor="oklch(0.45 0.13 280)" stopOpacity="0.25"/></linearGradient>
                <linearGradient id="gFlw" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.48 0.16 30)" stopOpacity="0.85"/><stop offset="1" stopColor="oklch(0.48 0.16 30)" stopOpacity="0.25"/></linearGradient>
                <linearGradient id="gMpe" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.52 0.14 145)" stopOpacity="0.85"/><stop offset="1" stopColor="oklch(0.52 0.14 145)" stopOpacity="0.25"/></linearGradient>
                <linearGradient id="gRzp" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.45 0.15 240)" stopOpacity="0.85"/><stop offset="1" stopColor="oklch(0.45 0.15 240)" stopOpacity="0.25"/></linearGradient>
              </defs>
              <g stroke="oklch(0.92 0.005 80)" strokeWidth="1"><line x1="40" y1="40" x2="590" y2="40"/><line x1="40" y1="100" x2="590" y2="100"/><line x1="40" y1="160" x2="590" y2="160"/><line x1="40" y1="220" x2="590" y2="220"/></g>
              <g fontFamily="ui-monospace" fontSize="9.5" fill="oklch(0.55 0.008 80)">
                <text x="34" y="44" textAnchor="end">$30k</text><text x="34" y="104" textAnchor="end">$20k</text><text x="34" y="164" textAnchor="end">$10k</text><text x="34" y="224" textAnchor="end">$0</text>
              </g>
              <g fontFamily="ui-monospace" fontSize="9.5" fill="oklch(0.55 0.008 80)">
                <text x="40" y="234">Mon</text><text x="120" y="234">Tue</text><text x="200" y="234">Wed</text><text x="280" y="234">Thu</text><text x="360" y="234">Fri</text><text x="440" y="234">Sat</text><text x="520" y="234">Sun</text>
              </g>
              {/* Stacked bars */}
              <g>
                <rect x="48" y="105" width="55" height="115" fill="url(#gStripe)"/><rect x="48" y="82" width="55" height="23" fill="url(#gFlw)"/><rect x="48" y="68" width="55" height="14" fill="url(#gMpe)"/><rect x="48" y="60" width="55" height="8" fill="url(#gRzp)"/>
                <rect x="128" y="98" width="55" height="122" fill="url(#gStripe)"/><rect x="128" y="74" width="55" height="24" fill="url(#gFlw)"/><rect x="128" y="62" width="55" height="12" fill="url(#gMpe)"/><rect x="128" y="55" width="55" height="7" fill="url(#gRzp)"/>
                <rect x="208" y="92" width="55" height="128" fill="url(#gStripe)"/><rect x="208" y="68" width="55" height="24" fill="url(#gFlw)"/><rect x="208" y="55" width="55" height="13" fill="url(#gMpe)"/><rect x="208" y="48" width="55" height="7" fill="url(#gRzp)"/>
                <rect x="288" y="88" width="55" height="132" fill="url(#gStripe)"/><rect x="288" y="62" width="55" height="26" fill="url(#gFlw)"/><rect x="288" y="48" width="55" height="14" fill="url(#gMpe)"/><rect x="288" y="40" width="55" height="8" fill="url(#gRzp)"/>
                <rect x="368" y="78" width="55" height="142" fill="url(#gStripe)"/><rect x="368" y="50" width="55" height="28" fill="url(#gFlw)"/><rect x="368" y="36" width="55" height="14" fill="url(#gMpe)"/><rect x="368" y="28" width="55" height="8" fill="url(#gRzp)"/>
                <rect x="448" y="95" width="55" height="125" fill="url(#gStripe)"/><rect x="448" y="72" width="55" height="23" fill="url(#gFlw)"/><rect x="448" y="60" width="55" height="12" fill="url(#gMpe)"/><rect x="448" y="52" width="55" height="8" fill="url(#gRzp)"/>
                <rect x="528" y="118" width="55" height="102" fill="url(#gStripe)"/><rect x="528" y="98" width="55" height="20" fill="url(#gFlw)"/><rect x="528" y="86" width="55" height="12" fill="url(#gMpe)"/><rect x="528" y="78" width="55" height="8" fill="url(#gRzp)"/>
              </g>
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              gap: 18,
              padding: "0 18px 14px",
            }}
          >
            {[
              { label: "Stripe", color: "oklch(0.45 0.13 280)" },
              { label: "Flutterwave", color: "oklch(0.48 0.16 30)" },
              { label: "M-Pesa", color: "oklch(0.52 0.14 145)" },
              { label: "Razorpay", color: "oklch(0.45 0.15 240)" },
            ].map((l) => (
              <span
                key={l.label}
                className="font-mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10.5,
                  color: "var(--fg-2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: l.color,
                  }}
                />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Gateway health card */}
        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-3)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
              Gateway health
            </h3>
            <span
              className="font-mono"
              style={{
                fontSize: 10,
                color: "var(--fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Last 1h
            </span>
          </div>
          <div
            style={{
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {GATEWAYS.map((gw) => (
              <div
                key={gw.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: gw.gwColor,
                    }}
                  />
                  <strong>{gw.name}</strong> &middot; {gw.region}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 13,
                    color: "var(--ink)",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {gw.authPct} / {gw.latency}
                </div>
                <div
                  style={{
                    gridColumn: "1 / -1",
                    height: 6,
                    background: "var(--bg-2)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${gw.fill}%`,
                      background: gw.fillColor,
                      borderRadius: 3,
                    }}
                  />
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--fg-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Auth &middot; p50 latency
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: gw.statusColor,
                    textAlign: "right",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {gw.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions card */}
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
            Recent transactions
          </h3>
          <span
            className="font-mono"
            style={{
              fontSize: 10,
              color: "var(--fg-3)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Streaming &middot; 1,284 today
          </span>
        </div>
        <div className="overflow-x-auto">
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13.5,
          }}
        >
          <thead>
            <tr>
              {["Tx", "Booking", "Member", "Gateway", "Amount", "Status", "Latency", "At"].map(
                (th, i) => (
                  <th
                    key={th}
                    style={{
                      textAlign: i >= 4 ? "right" : "left",
                      fontWeight: 500,
                      color: "var(--fg-3)",
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 10.5,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      padding: "10px 18px",
                      borderBottom: "1px solid var(--border)",
                      background: "var(--bg-2)",
                    }}
                  >
                    {th}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map((t) => (
              <tr key={t.tx} style={{ cursor: "pointer" }}>
                <td
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border)",
                    verticalAlign: "middle",
                  }}
                >
                  <span className="font-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
                    {t.tx}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border)",
                    verticalAlign: "middle",
                  }}
                >
                  <span className="font-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
                    {t.booking}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border)",
                    verticalAlign: "middle",
                    color: "var(--ink)",
                  }}
                >
                  {t.member}
                </td>
                <td
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border)",
                    verticalAlign: "middle",
                  }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: t.gwColor }} />
                    {t.gw}
                  </div>
                </td>
                <td
                  className="font-mono"
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border)",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    verticalAlign: "middle",
                    color: "var(--ink)",
                  }}
                >
                  {t.amount}
                </td>
                <td
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border)",
                    textAlign: "right",
                    verticalAlign: "middle",
                  }}
                >
                  <TxStatus type={t.statusType} />
                </td>
                <td
                  className="font-mono"
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border)",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    verticalAlign: "middle",
                    color: "var(--ink)",
                  }}
                >
                  {t.latency}
                </td>
                <td
                  className="font-mono"
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border)",
                    textAlign: "right",
                    verticalAlign: "middle",
                    color: "var(--fg-3)",
                  }}
                >
                  {t.at}
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
