import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";

export default function TrainerEarningsPage() {
  return (
    <TrainerDashboardShell activeItem="Earnings" crumb="Earnings" actions={<><button className="btn-ghost-v2 sm">Tax docs</button><button className="btn-ghost-v2 sm">Export CSV</button></>}>
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Earnings</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Sarah Okafor · independent contractor · ZAR · 30 days through today</div>
      </div>

      {/* Hero */}
      <div className="rounded-(--r-3) grid grid-cols-1 sm:grid-cols-3 gap-8 items-center" style={{ background: "var(--ink)", color: "var(--bg)", padding: "28px 32px" }}>
        <div>
          <div className="font-mono text-[11px] uppercase" style={{ letterSpacing: "0.05em", color: "oklch(0.65 0.005 85)" }}>Net to your account · this month</div>
          <div className="text-[44px] font-medium mt-1.5" style={{ letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>R 38,400.00</div>
          <div className="font-mono text-[11.5px] mt-2 uppercase" style={{ letterSpacing: "0.04em", color: "oklch(0.75 0.005 85)" }}>68 sessions completed · next payout Tue 19 May to ABSA •••• 3914</div>
        </div>
        <div>
          <div className="font-mono text-[10.5px] uppercase" style={{ letterSpacing: "0.04em", color: "oklch(0.65 0.005 85)" }}>Pending payout</div>
          <div className="text-[22px] font-medium mt-1.5" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1 }}>R 12,400</div>
          <div className="font-mono text-[10.5px] uppercase mt-1" style={{ letterSpacing: "0.05em", color: "var(--signal)" }}>3 days · Tue</div>
        </div>
        <div>
          <div className="font-mono text-[10.5px] uppercase" style={{ letterSpacing: "0.04em", color: "oklch(0.65 0.005 85)" }}>YTD net</div>
          <div className="text-[22px] font-medium mt-1.5" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1 }}>R 182k</div>
          <div className="font-mono text-[10.5px] uppercase mt-1" style={{ letterSpacing: "0.05em", color: "var(--signal)" }}>↑ 22% vs 2025</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Sessions · 30d", value: "68", delta: "88% utilization" },
          { label: "Avg session", value: "R 1,150", delta: "↑ R 18 MoM" },
          { label: "Refunds", value: "R 1,200", delta: "1 of 68 · 1.5%", muted: true },
          { label: "Platform fee", value: "R 4,140", delta: "5% of gross", muted: true },
        ].map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[22px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: k.muted ? "var(--fg-3)" : "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Earnings over time</h3>
          <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Net of refunds &amp; fees · daily granularity</div>
        </div>
        <div className="p-5">
          <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="w-full" style={{ height: "220px" }}>
            <defs><linearGradient id="e-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.55 0.16 148)" stopOpacity="0.18"/><stop offset="1" stopColor="oklch(0.55 0.16 148)" stopOpacity="0"/></linearGradient></defs>
            <g stroke="oklch(0.91 0.006 85)" strokeWidth="1"><line x1="0" y1="40" x2="600" y2="40"/><line x1="0" y1="90" x2="600" y2="90"/><line x1="0" y1="140" x2="600" y2="140"/><line x1="0" y1="190" x2="600" y2="190"/></g>
            <path d="M 0 170 L 30 150 L 60 156 L 90 130 L 120 138 L 150 116 L 180 124 L 210 104 L 240 112 L 270 92 L 300 98 L 330 80 L 360 86 L 390 68 L 420 76 L 450 56 L 480 62 L 510 44 L 540 50 L 570 30 L 600 38 L 600 220 L 0 220 Z" fill="url(#e-grad)"/>
            <path d="M 0 170 L 30 150 L 60 156 L 90 130 L 120 138 L 150 116 L 180 124 L 210 104 L 240 112 L 270 92 L 300 98 L 330 80 L 360 86 L 390 68 L 420 76 L 450 56 L 480 62 L 510 44 L 540 50 L 570 30 L 600 38" fill="none" stroke="oklch(0.55 0.16 148)" strokeWidth="2"/>
            <circle cx="600" cy="38" r="4" fill="oklch(0.55 0.16 148)"/>
            <g fontFamily="var(--font-mono)" fontSize="10" fill="oklch(0.55 0.008 80)"><text x="6" y="44">R 1.6k</text><text x="6" y="94">R 1.2k</text><text x="6" y="144">R 0.8k</text></g>
            <g fontFamily="var(--font-mono)" fontSize="10" fill="oklch(0.55 0.008 80)" textAnchor="middle"><text x="50" y="212">Apr 19</text><text x="300" y="212">May 03</text><text x="580" y="212">today</text></g>
          </svg>
        </div>
      </div>

      {/* 2:1 grid — table + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5">
        {/* Recent earnings table */}
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="px-4.5 py-3.5 flex justify-between items-center" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Recent earnings</h3>
              <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Last 10 transactions</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                  <th className="px-4.5 py-2.5 text-left font-medium font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Date</th>
                  <th className="px-4.5 py-2.5 text-left font-medium font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Client / item</th>
                  <th className="px-4.5 py-2.5 text-left font-medium font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Status</th>
                  <th className="px-4.5 py-2.5 text-right font-medium font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "17 May 09:42", client: "Wei Chen · Olympic 12‑pack renewal", status: "pending", statusLabel: "Pending · Tue", net: "R 12,400.00", refund: false },
                  { date: "13 May 14:18", client: "Linda Mokoena · session 14 / 24", status: "paid", statusLabel: "Paid", net: "R 1,140.00", refund: false },
                  { date: "13 May 09:00", client: "Weekly payout · 14 sessions", status: "paid", statusLabel: "Paid · ABSA", net: "R 14,820.00", refund: false },
                  { date: "11 May 17:00", client: "Mike Khumalo · session 22 / 24", status: "paid", statusLabel: "Paid", net: "R 1,140.00", refund: false },
                  { date: "11 May 13:00", client: "Pier Botha · refund · 33h notice", status: "refund", statusLabel: "Refunded", net: "− R 1,200.00", refund: true },
                  { date: "06 May 11:30", client: "Aisha Adams · online monthly", status: "paid", statusLabel: "Paid", net: "$ 320.00", refund: false },
                  { date: "06 May 09:00", client: "Weekly payout · 12 sessions", status: "paid", statusLabel: "Paid · ABSA", net: "R 12,840.00", refund: false },
                  { date: "02 May 08:00", client: "Linda Mokoena · 24‑session pack", status: "paid", statusLabel: "Paid", net: "R 14,400.00", refund: false },
                  { date: "28 Apr 11:00", client: "Wei Chen · Olympic 12‑pack", status: "paid", statusLabel: "Paid", net: "R 14,400.00", refund: false },
                  { date: "22 Apr 15:30", client: "Thandi Nkosi · postnatal 12‑pack", status: "paid", statusLabel: "Paid", net: "R 11,400.00", refund: false },
                ].map((row, i) => {
                  const statusStyle = row.status === "paid"
                    ? { color: "var(--signal-ink)", background: "var(--signal-soft)" }
                    : row.status === "pending"
                    ? { color: "var(--fg-3)", background: "var(--bg-2)", border: "1px solid var(--border)" }
                    : { color: "var(--danger)", background: "var(--danger-soft)" };

                  return (
                    <tr key={i} style={{ borderBottom: i < 9 ? "1px solid var(--border)" : "none" }}>
                      <td className="px-4.5 py-3.5 font-mono" style={{ color: "var(--fg-2)" }}>{row.date}</td>
                      <td className="px-4.5 py-3.5" style={{ color: "var(--ink)" }}>{row.client}</td>
                      <td className="px-4.5 py-3.5">
                        <span className="font-mono text-[10.5px] uppercase inline-flex items-center gap-1.25" style={{ ...statusStyle, padding: "3px 8px", borderRadius: "999px", letterSpacing: "0.05em" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
                          {row.statusLabel}
                        </span>
                      </td>
                      <td className="px-4.5 py-3.5 text-right font-mono" style={{ fontVariantNumeric: "tabular-nums", color: row.refund ? "var(--danger)" : "var(--ink)" }}>{row.net}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: tax docs + payout account */}
        <div className="flex flex-col gap-3.5">
          {/* Tax documents */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Tax documents</h3>
            </div>
            {[
              { name: "2025 · IT3(b) annual", meta: "Ready · downloaded 4×" },
              { name: "Q1 2026 · provisional", meta: "Ready · due 31 Aug" },
              { name: "2024 · IT3(b) annual", meta: "Filed Feb 2025" },
            ].map((doc, i) => (
              <div key={i} className="flex items-center gap-3" style={{ padding: "14px 18px", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: "var(--r-1)", background: "var(--bg-2)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--fg-2)" strokeWidth="1.5" style={{ width: 14, height: 14 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{doc.name}</div>
                  <div className="font-mono text-[11px] uppercase mt-0.5" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>{doc.meta}</div>
                </div>
                <span className="font-mono text-[10.5px] uppercase cursor-pointer" style={{ color: "var(--fg-2)", padding: "4px 10px", border: "1px solid var(--border)", borderRadius: "var(--r-1)", letterSpacing: "0.04em" }}>PDF</span>
              </div>
            ))}
          </div>

          {/* Payout account */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Payout account</h3>
            </div>
            <div className="flex flex-col gap-2.5" style={{ padding: "14px 18px", fontSize: "13px" }}>
              {[
                { label: "Bank", value: "ABSA · cheque", mono: false },
                { label: "Account", value: "•••• •••• 3914", mono: true },
                { label: "Schedule", value: "Weekly · Tuesdays", mono: false },
                { label: "Minimum", value: "R 500", mono: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span className="font-mono text-[11px] uppercase" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>{row.label}</span>
                  <span className={row.mono ? "font-mono" : ""} style={{ color: "var(--ink)", fontWeight: 500, ...(row.mono ? { fontVariantNumeric: "tabular-nums" } : {}) }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
              <button className="btn-ghost-v2 sm w-full justify-center">Manage payout</button>
            </div>
          </div>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
