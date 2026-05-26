import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Earnings",
  description: "Track your dietitian earnings, payouts, and revenue.",
};

export default function DietitianEarningsPage() {
  return (
    <DietitianDashboardShell activeItem="Earnings" crumb="Earnings" actions={<><button className="btn-ghost-v2 sm">Tax docs</button><button className="btn-ghost-v2 sm">Export</button></>}>
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Earnings</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Dr Nadia Hassan · ZAR equivalent · routes through Paystack to Lagos GTBank · NGN</div>
      </div>

      {/* Hero */}
      <div className="rounded-(--r-3) grid grid-cols-1 sm:grid-cols-3 gap-8 items-center" style={{ background: "var(--ink)", color: "var(--bg)", padding: "28px 32px" }}>
        <div>
          <div className="font-mono text-[11px] uppercase" style={{ letterSpacing: "0.05em", color: "oklch(0.65 0.005 85)" }}>Net this month</div>
          <div className="text-[44px] font-medium mt-1.5" style={{ letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{"₦"} 1.84M</div>
          <div className="font-mono text-[11.5px] mt-2 uppercase" style={{ letterSpacing: "0.04em", color: "oklch(0.75 0.005 85)" }}>22 consults completed · 5 plans delivered · next payout Thu</div>
        </div>
        <div>
          <div className="font-mono text-[10.5px] uppercase" style={{ letterSpacing: "0.04em", color: "oklch(0.65 0.005 85)" }}>Pending payout</div>
          <div className="text-[22px] font-medium mt-1.5" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1 }}>{"₦"} 412k</div>
        </div>
        <div>
          <div className="font-mono text-[10.5px] uppercase" style={{ letterSpacing: "0.04em", color: "oklch(0.65 0.005 85)" }}>YTD net</div>
          <div className="text-[22px] font-medium mt-1.5" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1 }}>{"₦"} 8.62M</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Consults · 30d", value: "22", delta: "↑ 12% MoM" },
          { label: "Plans delivered", value: "14", delta: "5 new this week" },
          { label: "Avg consult", value: "₦ 38k", delta: "↑ ₦ 2k" },
          { label: "Platform fee", value: "₦ 92k", delta: "5% of gross", muted: true },
        ].map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[24px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: k.muted ? "var(--fg-3)" : "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Earnings over time</h3>
        </div>
        <div className="p-5">
          <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="w-full" style={{ height: "220px" }}>
            <defs><linearGradient id="d-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.58 0.14 300)" stopOpacity="0.18"/><stop offset="1" stopColor="oklch(0.58 0.14 300)" stopOpacity="0"/></linearGradient></defs>
            <g stroke="oklch(0.91 0.006 85)" strokeWidth="1"><line x1="0" y1="50" x2="600" y2="50"/><line x1="0" y1="100" x2="600" y2="100"/><line x1="0" y1="150" x2="600" y2="150"/></g>
            <path d="M 0 170 L 30 150 L 60 156 L 90 130 L 120 138 L 150 116 L 180 124 L 210 104 L 240 112 L 270 92 L 300 98 L 330 80 L 360 86 L 390 68 L 420 76 L 450 56 L 480 62 L 510 44 L 540 50 L 570 30 L 600 38 L 600 220 L 0 220 Z" fill="url(#d-grad)"/>
            <path d="M 0 170 L 30 150 L 60 156 L 90 130 L 120 138 L 150 116 L 180 124 L 210 104 L 240 112 L 270 92 L 300 98 L 330 80 L 360 86 L 390 68 L 420 76 L 450 56 L 480 62 L 510 44 L 540 50 L 570 30 L 600 38" fill="none" stroke="oklch(0.58 0.14 300)" strokeWidth="2"/>
            <circle cx="600" cy="38" r="4" fill="oklch(0.58 0.14 300)"/>
          </svg>
        </div>
      </div>

      {/* Recent earnings table */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Recent earnings</h3>
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
                { date: "17 May 11:30", client: "Kemi Eze · maintenance · 16wk renewal", status: "pending", statusLabel: "Pending", net: "₦ 412,000" },
                { date: "11 May 14:18", client: "Bisi Okonkwo · wk 6 review", status: "paid", statusLabel: "Paid", net: "₦ 38,000" },
                { date: "11 May 09:00", client: "Weekly payout · 6 consults", status: "paid", statusLabel: "Paid · GTBank", net: "₦ 228,000" },
                { date: "06 May 16:30", client: "Folake Adebayo · intake", status: "paid", statusLabel: "Paid", net: "₦ 75,000" },
                { date: "04 May 11:08", client: "Kemi Eze · PCOS plan delivery", status: "paid", statusLabel: "Paid", net: "₦ 360,000" },
                { date: "28 Apr 14:00", client: "Adaora Tunde · PCOS protocol", status: "paid", statusLabel: "Paid", net: "₦ 360,000" },
                { date: "22 Apr 10:00", client: "Chinedu Okoro · sport perf · 8wk", status: "paid", statusLabel: "Paid", net: "₦ 280,000" },
              ].map((row, i) => {
                const statusStyle = row.status === "paid"
                  ? { color: "var(--signal-ink)", background: "var(--signal-soft)" }
                  : { color: "var(--fg-3)", background: "var(--bg-2)", border: "1px solid var(--border)" };

                return (
                  <tr key={i} style={{ borderBottom: i < 6 ? "1px solid var(--border)" : "none" }}>
                    <td className="px-4.5 py-3.5 font-mono" style={{ color: "var(--fg-2)" }}>{row.date}</td>
                    <td className="px-4.5 py-3.5" style={{ color: "var(--ink)" }}>{row.client}</td>
                    <td className="px-4.5 py-3.5">
                      <span className="font-mono text-[10.5px] uppercase" style={{ ...statusStyle, padding: "3px 8px", borderRadius: "999px", letterSpacing: "0.05em" }}>
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="px-4.5 py-3.5 text-right font-mono" style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{row.net}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
