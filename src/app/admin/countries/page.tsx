import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Countries",
  description: "Manage country availability, currencies, and regional settings.",
};

const COUNTRIES = [
  { iso: "ZA", name: "South Africa", sub: "ZAR · EN/AF", color: "#0F8C5B", status: "live", providers: "1,840", members: "148k", gmv: "$ 1.42M", takeRate: "7.0%" },
  { iso: "NG", name: "Nigeria", sub: "NGN · EN", color: "#0D7C66", status: "live", providers: "980", members: "62k", gmv: "$ 642k", takeRate: "7.0%" },
  { iso: "AE", name: "UAE", sub: "AED · EN/AR", color: "#1F6FB2", status: "live", providers: "412", members: "38k", gmv: "$ 588k", takeRate: "6.0%" },
  { iso: "DE", name: "Germany", sub: "EUR · DE/EN", color: "#B14242", status: "live", providers: "1,240", members: "84k", gmv: "$ 1.18M", takeRate: "5.0%" },
  { iso: "GB", name: "United Kingdom", sub: "GBP · EN", color: "#4A6FA5", status: "live", providers: "880", members: "52k", gmv: "$ 894k", takeRate: "5.0%" },
  { iso: "IN", name: "India", sub: "INR · EN/HI", color: "#D97757", status: "live", providers: "2,140", members: "92k", gmv: "$ 412k", takeRate: "8.0%" },
  { iso: "KE", name: "Kenya", sub: "KES · EN/SW · M-Pesa", color: "#0F8C5B", status: "beta", providers: "318", members: "14k", gmv: "$ 88k", takeRate: "6.0%" },
  { iso: "EG", name: "Egypt", sub: "EGP · AR/EN", color: "#D9A557", status: "beta", providers: "248", members: "11k", gmv: "$ 62k", takeRate: "7.0%" },
  { iso: "MA", name: "Morocco", sub: "MAD · AR/FR", color: "#0F8C5B", status: "soon", providers: "0", members: "0", gmv: "—", takeRate: "—" },
  { iso: "ID", name: "Indonesia", sub: "IDR · ID/EN", color: "#B14242", status: "soon", providers: "0", members: "0", gmv: "—", takeRate: "—" },
];

const PAYOUT_RAILS = [
  { name: "Stripe", pct: 72, color: "oklch(0.42 0.12 280)" },
  { name: "Flutter", pct: 14, color: "oklch(0.48 0.16 30)" },
  { name: "M-Pesa", pct: 7, color: "oklch(0.52 0.14 145)" },
  { name: "Razorp", pct: 5, color: "oklch(0.45 0.15 240)" },
  { name: "Wise", pct: 2, color: "oklch(0.55 0.10 180)" },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; border?: string }> = {
    live: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
    beta: { bg: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" },
    soon: { bg: "var(--bg-2)", color: "var(--fg-3)", border: "1px solid var(--border)" },
  };
  const s = styles[status] || styles.soon;
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
        background: s.bg,
        color: s.color,
        border: s.border,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "currentColor",
        }}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function CountriesPage() {
  return (
    <AdminDashboardShell activeItem="Countries" crumb="Countries">
      {/* Page head */}
      <div>
        <h1
          style={{
            fontSize: 30,
            letterSpacing: "-0.022em",
            fontWeight: 500,
            color: "var(--ink)",
          }}
        >
          Countries
        </h1>
        <div
          style={{ color: "var(--fg-3)", fontSize: 13.5, marginTop: 6 }}
        >
          Binectics operates in 52 countries &middot; 38 live &middot; 9
          beta &middot; 5 in onboarding &middot; supports 14 currencies and 9
          languages
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Live", value: "38", delta: "+ 4 this quarter", deltaColor: "var(--signal-ink)" },
          { label: "Beta", value: "9", delta: "EG, KE, EG-Cairo, ...", deltaColor: "oklch(0.45 0.16 75)" },
          { label: "Soft-launching", value: "5", delta: "MA · ID · TH · CL · CO", deltaColor: "var(--fg-3)" },
          { label: "Currencies / languages", value: "14 / 9", delta: "RTL · Arabic supported", deltaColor: "var(--signal-ink)" },
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
                color: "var(--ink)",
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

      {/* Grid: table + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4.5">
        {/* Country table card */}
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
              By GMV &middot; last 30 days
            </h3>
            <span
              className="font-mono"
              style={{
                fontSize: 10.5,
                color: "var(--fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              USD-normalized
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
                {["Country", "Status", "Providers", "Members", "GMV · 30d", "Take-rate"].map(
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
              {COUNTRIES.map((c) => (
                <tr
                  key={c.iso}
                  style={{ cursor: "pointer" }}
                >
                  <td
                    style={{
                      padding: "11px 18px",
                      borderBottom: "1px solid var(--border)",
                      verticalAlign: "middle",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        className="font-mono"
                        style={{
                          width: 24,
                          height: 17,
                          background: c.color,
                          borderRadius: 2,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 700,
                          color: "var(--bg)",
                        }}
                      >
                        {c.iso}
                      </span>
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div
                          className="font-mono"
                          style={{
                            fontSize: 10,
                            color: "var(--fg-3)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {c.sub}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "11px 18px",
                      borderBottom: "1px solid var(--border)",
                      verticalAlign: "middle",
                    }}
                  >
                    <StatusBadge status={c.status} />
                  </td>
                  <td
                    style={{
                      padding: "11px 18px",
                      borderBottom: "1px solid var(--border)",
                      verticalAlign: "middle",
                    }}
                  >
                    {c.providers}
                  </td>
                  <td
                    style={{
                      padding: "11px 18px",
                      borderBottom: "1px solid var(--border)",
                      verticalAlign: "middle",
                    }}
                  >
                    {c.members}
                  </td>
                  <td
                    className="font-mono"
                    style={{
                      padding: "11px 18px",
                      borderBottom: "1px solid var(--border)",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      verticalAlign: "middle",
                    }}
                  >
                    {c.gmv}
                  </td>
                  <td
                    className="font-mono"
                    style={{
                      padding: "11px 18px",
                      borderBottom: "1px solid var(--border)",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      verticalAlign: "middle",
                    }}
                  >
                    {c.takeRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Map card */}
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
                Footprint
              </h3>
              <span
                className="font-mono"
                style={{
                  fontSize: 10.5,
                  color: "var(--fg-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                52 countries
              </span>
            </div>
            <div
              style={{
                aspectRatio: "16 / 10",
                background: "var(--bg-2)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <svg
                viewBox="0 0 320 200"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: "100%", height: "100%" }}
              >
                <defs>
                  <pattern
                    id="dot"
                    x="0"
                    y="0"
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="3" cy="3" r="0.6" fill="oklch(0.85 0.005 80)" />
                  </pattern>
                </defs>
                <rect width="320" height="200" fill="url(#dot)" />
                <circle cx="180" cy="148" r="14" fill="oklch(0.32 0.08 75)" opacity="0.95" />
                <text x="180" y="151" textAnchor="middle" fill="#fff" fontFamily="ui-monospace" fontSize="7" fontWeight="600">ZA</text>
                <circle cx="150" cy="110" r="10" fill="oklch(0.32 0.08 75)" opacity="0.9" />
                <text x="150" y="113" textAnchor="middle" fill="#fff" fontFamily="ui-monospace" fontSize="6">NG</text>
                <circle cx="180" cy="115" r="7" fill="oklch(0.55 0.13 75)" opacity="0.9" />
                <text x="180" y="117" textAnchor="middle" fill="#fff" fontFamily="ui-monospace" fontSize="5">KE</text>
                <circle cx="170" cy="90" r="7" fill="oklch(0.55 0.13 75)" opacity="0.9" />
                <text x="170" y="92" textAnchor="middle" fill="#fff" fontFamily="ui-monospace" fontSize="5">EG</text>
                <circle cx="135" cy="85" r="5" fill="oklch(0.65 0.005 75)" opacity="0.7" />
                <circle cx="200" cy="92" r="9" fill="oklch(0.32 0.08 75)" opacity="0.9" />
                <text x="200" y="95" textAnchor="middle" fill="#fff" fontFamily="ui-monospace" fontSize="6">AE</text>
                <circle cx="232" cy="100" r="9" fill="oklch(0.32 0.08 75)" opacity="0.9" />
                <text x="232" y="103" textAnchor="middle" fill="#fff" fontFamily="ui-monospace" fontSize="6">IN</text>
                <circle cx="148" cy="56" r="9" fill="oklch(0.32 0.08 75)" opacity="0.9" />
                <text x="148" y="59" textAnchor="middle" fill="#fff" fontFamily="ui-monospace" fontSize="6">GB</text>
                <circle cx="162" cy="58" r="11" fill="oklch(0.32 0.08 75)" opacity="0.9" />
                <text x="162" y="61" textAnchor="middle" fill="#fff" fontFamily="ui-monospace" fontSize="6">DE</text>
                <circle cx="262" cy="124" r="5" fill="oklch(0.65 0.005 75)" opacity="0.7" />
                <circle cx="252" cy="106" r="5" fill="oklch(0.65 0.005 75)" opacity="0.7" />
                <circle cx="278" cy="112" r="6" fill="oklch(0.55 0.13 75)" opacity="0.85" />
                <text x="278" y="115" textAnchor="middle" fill="#fff" fontFamily="ui-monospace" fontSize="5">PH</text>
                <circle cx="80" cy="135" r="5" fill="oklch(0.65 0.005 75)" opacity="0.7" />
                <circle cx="75" cy="160" r="5" fill="oklch(0.65 0.005 75)" opacity="0.7" />
              </svg>
              <div
                style={{
                  position: "absolute",
                  bottom: 14,
                  left: 14,
                  right: 14,
                  display: "flex",
                  gap: 14,
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 10,
                  color: "var(--fg-2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                <span>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, marginRight: 5, verticalAlign: -1, background: "oklch(0.32 0.08 75)" }} />
                  Live
                </span>
                <span>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, marginRight: 5, verticalAlign: -1, background: "oklch(0.55 0.13 75)" }} />
                  Beta
                </span>
                <span>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, marginRight: 5, verticalAlign: -1, background: "oklch(0.65 0.005 75)" }} />
                  Soon
                </span>
              </div>
            </div>
          </div>

          {/* Payout rails card */}
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
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                Payout rails
              </h3>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: 18,
              }}
            >
              {PAYOUT_RAILS.map((rail) => (
                <div
                  key={rail.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr 80px",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 10.5,
                      color: "var(--fg-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {rail.name.slice(0, 6)}
                  </span>
                  <div
                    style={{
                      height: 8,
                      background: "var(--bg-2)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${rail.pct}%`,
                        background: rail.color,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 12,
                      color: "var(--ink)",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {rail.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardShell>
  );
}
