import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";

export default function AdminAnalyticsPage() {
  return (
    <AdminDashboardShell
      activeItem="Analytics"
      crumb="Analytics"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Custom report</button>
          <button className="btn-primary-v2">Export</button>
        </div>
      }
    >
      {/* Page heading */}
      <div>
        <h1
          className="text-[28px] font-medium"
          style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}
        >
          Platform analytics
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Live · GMV, retention, funnels, cohort behaviour · last refresh 8m ago
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "GMV · 30d", value: "$ 4.82M", delta: "↑ 18% MoM" },
          { label: "Active members", value: "418k", delta: "↑ 6.4% MoM" },
          { label: "Retention · 90d", value: "68%", delta: "Industry avg 42%" },
          { label: "Provider NPS", value: "+62", delta: "From + 58 last Q" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[10px] p-[13px_16px]"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="font-mono text-[10.5px] uppercase tracking-[0.04em]"
              style={{ color: "var(--fg-3)" }}
            >
              {kpi.label}
            </div>
            <div
              className="text-[22px] font-medium mt-1"
              style={{
                color: "var(--ink)",
                letterSpacing: "-0.018em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {kpi.value}
            </div>
            <div
              className="font-mono text-[11px] mt-1"
              style={{ color: "var(--signal-ink)" }}
            >
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {/* GMV Chart card */}
      <div
        className="rounded-[12px] p-[22px]"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          className="text-[14px] font-medium mb-3.5"
          style={{ color: "var(--ink)" }}
        >
          GMV · last 12 weeks
        </h3>
        <svg viewBox="0 0 800 200" className="w-full" style={{ height: 200 }}>
          <defs>
            <linearGradient id="gmv" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0"
                stopColor="oklch(0.55 0.16 148)"
                stopOpacity={0.3}
              />
              <stop
                offset="1"
                stopColor="oklch(0.55 0.16 148)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <path
            d="M 40 160 L 100 152 L 160 144 L 220 138 L 280 128 L 340 120 L 400 112 L 460 102 L 520 95 L 580 82 L 640 70 L 700 60 L 760 48 L 760 200 L 40 200 Z"
            fill="url(#gmv)"
          />
          <path
            d="M 40 160 L 100 152 L 160 144 L 220 138 L 280 128 L 340 120 L 400 112 L 460 102 L 520 95 L 580 82 L 640 70 L 700 60 L 760 48"
            fill="none"
            stroke="oklch(0.55 0.16 148)"
            strokeWidth="2.5"
          />
          {[40, 160, 280, 400, 520, 640, 760].map((cx, i) => (
            <circle
              key={cx}
              cx={cx}
              cy={160 - i * 18.6}
              r="3"
              fill="oklch(0.55 0.16 148)"
            />
          ))}
          <g
            fontFamily="ui-monospace"
            fontSize="10"
            fill="oklch(0.55 0.008 80)"
          >
            <text x="40" y="190">
              12 wk ago
            </text>
            <text x="400" y="190" textAnchor="middle">
              6 wk
            </text>
            <text x="760" y="190" textAnchor="end">
              now
            </text>
          </g>
        </svg>
      </div>

      {/* Two-column: Top Countries + Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div
          className="rounded-[12px] p-[22px]"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
          }}
        >
          <h3
            className="text-[14px] font-medium mb-3.5"
            style={{ color: "var(--ink)" }}
          >
            Top countries · GMV
          </h3>
          <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {[
                { country: "South Africa", val: "$ 1.42M · 29%" },
                { country: "Nigeria", val: "$ 642k · 13%" },
                { country: "UAE", val: "$ 588k · 12%" },
                { country: "Germany", val: "$ 482k · 10%" },
                { country: "Kenya", val: "$ 308k · 6%" },
              ].map((r) => (
                <tr key={r.country}>
                  <td
                    className="py-[11px] px-[14px]"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <strong>{r.country}</strong>
                  </td>
                  <td
                    className="py-[11px] px-[14px] font-mono"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    {r.val}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div
          className="rounded-[12px] p-[22px]"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
          }}
        >
          <h3
            className="text-[14px] font-medium mb-3.5"
            style={{ color: "var(--ink)" }}
          >
            Funnel · last 30d
          </h3>
          <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {[
                { step: "Landed", num: "1.84M", pct: "100%", bold: true },
                { step: "Signed up", num: "412k", pct: "22%", bold: false },
                { step: "Booked first", num: "218k", pct: "12% · 53% of signup", bold: false },
                { step: "2nd booking", num: "148k", pct: "8% · 68% of 1st", bold: false },
                { step: "Active by day 30", num: "128k", pct: "7% · LTV-positive", bold: true },
              ].map((r) => (
                <tr key={r.step}>
                  <td
                    className="py-[11px] px-[14px]"
                    style={{ borderBottom: "1px solid var(--border)", fontWeight: r.bold ? 600 : 400 }}
                  >
                    {r.step}
                  </td>
                  <td
                    className="py-[11px] px-[14px] font-mono"
                    style={{ borderBottom: "1px solid var(--border)", fontWeight: r.bold ? 600 : 400 }}
                  >
                    {r.num}
                  </td>
                  <td
                    className="py-[11px] px-[14px]"
                    style={{ borderBottom: "1px solid var(--border)", fontWeight: r.bold ? 600 : 400 }}
                  >
                    {r.pct}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </AdminDashboardShell>
  );
}
