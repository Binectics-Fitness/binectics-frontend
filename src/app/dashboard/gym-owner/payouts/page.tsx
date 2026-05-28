"use client";

import { useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AddBankAccountModal } from "@/components/ds/modals/AddBankAccountModal";

const PAYOUTS = [
  { date: "Wed · 20 May 09:00", ref: "PO_2026_0520", dest: "ABSA •••• 2241", gw: "Paystack", status: "Scheduled", statusColor: "var(--fg-2)", statusBg: "var(--bg-2)", border: true, amt: "R 84,200.00" },
  { date: "Wed · 13 May 09:00", ref: "PO_2026_0513", dest: "ABSA •••• 2241", gw: "Paystack", status: "Paid · 4 days ago", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", amt: "R 88,120.00" },
  { date: "Wed · 08 May 14:00", ref: "po_1NkLwQ3", dest: "USD acct •••• 8104", gw: "Stripe", status: "Paid", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", amt: "$ 1,840.00" },
  { date: "Wed · 06 May 09:00", ref: "PO_2026_0506", dest: "ABSA •••• 2241", gw: "Paystack", status: "Paid", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", amt: "R 92,640.00" },
  { date: "Wed · 29 Apr 09:00", ref: "PO_2026_0429", dest: "ABSA •••• 2241", gw: "Paystack", status: "Paid", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", amt: "R 81,180.00" },
  { date: "Wed · 22 Apr 09:00", ref: "PO_2026_0422", dest: "ABSA •••• 2241", gw: "Paystack", status: "Paid", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", amt: "R 78,400.00" },
  { date: "Wed · 15 Apr 09:00", ref: "PO_2026_0415", dest: "ABSA •••• 2241", gw: "Paystack", status: "Paid", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", amt: "R 86,920.00" },
  { date: "Wed · 08 Apr 09:00", ref: "PO_2026_0408", dest: "ABSA •••• 2241", gw: "Paystack", status: "Paid", statusColor: "var(--signal-ink)", statusBg: "var(--signal-soft)", amt: "R 82,400.00" },
];

export default function GymPayoutsPage() {
  const [addBankOpen, setAddBankOpen] = useState(false);

  return (
    <GymDashboardShell
      activeItem="Payouts"
      crumb="Payouts"
      actions={
        <>
          <button className="w-8 h-8 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </button>
          <button className="btn-ghost-v2 sm">Statement · PDF</button>
          <button className="btn-primary-v2 sm" onClick={() => setAddBankOpen(true)}>+ New bank account</button>
        </>
      }
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Payouts</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Funds settle directly to your bank · Binectics never holds money</div>
      </div>

      {/* Next payout hero — dark bg per proto */}
      <div className="rounded-(--r-3) px-8 py-7 grid items-center gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]" style={{ background: "var(--ink)", color: "var(--bg)" }}>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "oklch(0.65 0.005 85)" }}>Next payout · Wed 20 May</div>
          <div className="text-[28px] sm:text-[44px] font-medium mt-1.5" style={{ letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>R 84,200.00<small className="font-mono text-[14px] font-normal ml-1.5" style={{ color: "oklch(0.7 0.005 85)" }}>· ZAR</small></div>
          <div className="font-mono text-[11.5px] uppercase tracking-[0.04em] mt-2" style={{ color: "oklch(0.75 0.005 85)" }}>68 sessions · 32 subscriptions renewed · <strong className="text-[13px] font-medium" style={{ color: "var(--bg)", fontFamily: "var(--font-sans)", textTransform: "none" as const, letterSpacing: "-0.005em" }}>net of refunds & fees</strong></div>
        </div>
        {[{ label: "Gross", value: "R 86,800" }, { label: "Refunds", value: "−  R 1,200" }, { label: "Gateway fees", value: "−  R 1,400" }].map((s) => (
          <div key={s.label}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "oklch(0.65 0.005 85)" }}>{s.label}</div>
            <div className="text-[22px] font-medium mt-1.5" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Paid · YTD", value: "R 14.2M", delta: "+ 22% YoY" },
          { label: "In transit", value: "R 84.2k", delta: "Wed 20 May" },
          { label: "Available now", value: "R 12.4k", delta: "Same‑day to ABSA" },
          { label: "Holding period", value: "2 days", delta: "Paystack default" },
        ].map((k) => (
          <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[24px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5 items-start">
        {/* Payouts table */}
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Recent payouts</h3>
              <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>52 weekly payouts in the past 12 months</div>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Last 8 weeks</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px] min-w-[700px]" style={{ fontVariantNumeric: "tabular-nums" }}>
              <thead>
                <tr className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
                  <th className="px-4.5 py-2.75 text-left font-medium">Date</th>
                  <th className="px-4.5 py-2.75 text-left font-medium">Reference</th>
                  <th className="px-4.5 py-2.75 text-left font-medium">Destination</th>
                  <th className="px-4.5 py-2.75 text-left font-medium">Gateway</th>
                  <th className="px-4.5 py-2.75 text-left font-medium">Status</th>
                  <th className="px-4.5 py-2.75 text-right font-medium">Net amount</th>
                </tr>
              </thead>
              <tbody>
                {PAYOUTS.map((p, i) => (
                  <tr key={p.ref} className="hover:bg-bg-2 cursor-pointer" style={{ borderBottom: i < PAYOUTS.length - 1 ? "1px solid var(--border)" : "none", transition: "background 60ms" }}>
                    <td className="px-4.5 py-3.5 font-mono text-[13px]" style={{ color: "var(--fg-2)" }}>{p.date}</td>
                    <td className="px-4.5 py-3.5 font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>{p.ref}</td>
                    <td className="px-4.5 py-3.5" style={{ color: "var(--ink)" }}>{p.dest}</td>
                    <td className="px-4.5 py-3.5 font-mono text-[11.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{p.gw}</td>
                    <td className="px-4.5 py-3.5">
                      <span className="inline-flex items-center gap-[5px] font-mono text-[10.5px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full" style={{ color: p.statusColor, background: p.statusBg, border: p.border ? "1px solid var(--border)" : "none" }}>
                        <span className="w-[5px] h-[5px] rounded-full bg-current" />{p.status}
                      </span>
                    </td>
                    <td className="px-4.5 py-3.5 text-right font-mono font-medium" style={{ color: "var(--ink)" }}>{p.amt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3.5">
          {/* Bank accounts */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Bank accounts</h3>
              <span className="font-mono text-[11px] uppercase tracking-[0.04em] cursor-pointer" style={{ color: "var(--fg-2)" }}>Add →</span>
            </div>
            <div className="flex items-center gap-3 px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="w-[38px] h-7 rounded-(--r-1) flex items-center justify-center font-mono text-[9px] font-bold tracking-[0.04em]" style={{ background: "linear-gradient(135deg, oklch(0.45 0.18 200), oklch(0.55 0.15 220))", color: "var(--bg)" }}>ABSA</span>
              <div className="flex-1">
                <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>Iron Lab (Pty) Ltd</div>
                <div className="font-mono text-[11px] flex items-center gap-2" style={{ color: "var(--fg-3)" }}><span>•••• •••• 2241</span><span className="w-0.5 h-0.5 rounded-full" style={{ background: "var(--border-2)" }} /><span>ZAR</span></div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full" style={{ background: "var(--ink)", color: "var(--bg)" }}>Primary</span>
            </div>
            <div className="flex items-center gap-3 px-4.5 py-3.5">
              <span className="w-[38px] h-7 rounded-(--r-1) flex items-center justify-center font-mono text-[9px] font-bold tracking-[0.04em]" style={{ background: "linear-gradient(135deg, oklch(0.42 0.12 30), oklch(0.55 0.16 50))", color: "var(--bg)" }}>USB</span>
              <div className="flex-1">
                <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>Iron Lab US LLC</div>
                <div className="font-mono text-[11px] flex items-center gap-2" style={{ color: "var(--fg-3)" }}><span>•••• •••• 8104</span><span className="w-0.5 h-0.5 rounded-full" style={{ background: "var(--border-2)" }} /><span>USD</span><span className="w-0.5 h-0.5 rounded-full" style={{ background: "var(--border-2)" }} /><span>Stripe</span></div>
              </div>
            </div>
          </div>

          {/* Payout schedule */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Payout schedule</h3>
            </div>
            <div className="px-4.5 py-3.5 flex flex-col gap-2.5">
              {[
                { label: "Frequency", value: "Weekly · Wednesdays", mono: false },
                { label: "Holding period", value: "2 days", mono: true },
                { label: "Minimum", value: "R 500", mono: true },
                { label: "Auto‑payout", value: "On", signal: true, mono: true },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-[13px]">
                  <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{r.label}</span>
                  <span className={`font-medium ${r.mono ? "font-mono" : ""}`} style={{ color: r.signal ? "var(--signal-ink)" : "var(--ink)", fontVariantNumeric: r.mono ? "tabular-nums" : undefined }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="px-4.5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
              <button className="btn-ghost-v2 sm w-full justify-center">Change schedule</button>
            </div>
          </div>
        </div>
      </div>
      <AddBankAccountModal open={addBankOpen} onClose={() => setAddBankOpen(false)} />
    </GymDashboardShell>
  );
}
