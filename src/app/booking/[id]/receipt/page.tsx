import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

/**
 * Booking Receipt — printable receipt card with line items.
 * Proto: booking-receipt.html
 * Topbar + centered 640px receipt card.
 * Dynamic route: params.id is a Promise in Next.js 16.
 */

const RECEIPT = {
  id: "BIN-2026-042841",
  date: "11 May 2026",
  from: { name: "Sarah Okafor", detail: "Independent contractor · ZA\nSARS: 9180 481 729" },
  to: { name: "Tunde Adebayo", detail: "Cape Town · ZA\ntunde@gmail.com" },
  items: [
    { desc: "Strength session · 60 min · Iron Lab Sea Point", sub: "Wed 20 May 2026 · 08:30 SAST", amount: "R 1,140.00" },
    { desc: "Platform fee · 5%", sub: "", amount: "R 60.00" },
    { desc: "VAT · 15%", sub: "", amount: "R 180.00" },
  ],
  total: "R 1,380.00",
  payment: "VISA •••• 4421 · charged 11 May 14:32 SAST",
  reference: "PI_3OqL1k_4221",
  refund: "until 19 May 08:30 (free) · 50% fee after",
};

export default async function BookingReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      {/* Topbar */}
      <header className="border-b border-border" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-320 flex items-center justify-between h-14 px-5 sm:px-8">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="flex items-center gap-4 text-[13.5px]">
            <Link href="/marketplace" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Marketplace</Link>
            <Link href="/login" className="btn-primary-v2 sm">Sign in</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-160 px-5 sm:px-6 py-8">
        <div className="rounded-2xl p-8 sm:p-10 lg:px-11" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4.5" style={{ textDecoration: "none", color: "var(--ink)" }}>
                <svg width="22" height="22" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"><path d="M 32 6 A 18 18 0 1 0 32 42" /><path d="M 28 16 A 8 8 0 1 0 28 32" /></svg>
                <span className="text-[15px] font-medium">Binectics</span>
              </Link>
              <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Receipt · paid</div>
              <h1 className="text-[24px] sm:text-[26px] font-medium mt-1.5" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>{id || RECEIPT.id}</h1>
            </div>
            <div className="text-right font-mono text-[11.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
              <div>{RECEIPT.date}</div>
              <div className="mt-1" style={{ color: "var(--signal-ink)" }}>&#9679; Paid in full</div>
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4.5 mb-5.5" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--fg-3)" }}>From</div>
              <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{RECEIPT.from.name}</div>
              <div className="text-[13px] mt-0.75 whitespace-pre-line" style={{ color: "var(--fg-2)" }}>{RECEIPT.from.detail}</div>
            </div>
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--fg-3)" }}>To</div>
              <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{RECEIPT.to.name}</div>
              <div className="text-[13px] mt-0.75 whitespace-pre-line" style={{ color: "var(--fg-2)" }}>{RECEIPT.to.detail}</div>
            </div>
          </div>

          {/* Line items */}
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>Description</div>
          <table className="w-full mb-5.5" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="text-left">
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] font-medium pb-2.5" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>Item</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] font-medium pb-2.5 text-right" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {RECEIPT.items.map((item) => (
                <tr key={item.desc}>
                  <td className="py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    {item.desc}
                    {item.sub && <><br /><span className="text-[12px]" style={{ color: "var(--fg-3)" }}>{item.sub}</span></>}
                  </td>
                  <td className="py-3 text-right font-mono" style={{ borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{item.amount}</td>
                </tr>
              ))}
              <tr>
                <td className="py-3.5 font-medium">Total</td>
                <td className="py-3.5 text-right font-mono text-[18px] font-medium" style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{RECEIPT.total}</td>
              </tr>
            </tbody>
          </table>

          {/* Payment info */}
          <div className="rounded-(--r-3) px-4.5 py-4 text-[13px] leading-[1.6]" style={{ background: "var(--bg-2)", color: "var(--fg-2)" }}>
            <strong className="font-medium" style={{ color: "var(--ink)" }}>Payment</strong> · {RECEIPT.payment}<br />
            <strong className="font-medium" style={{ color: "var(--ink)" }}>Reference</strong> · {RECEIPT.reference}<br />
            <strong className="font-medium" style={{ color: "var(--ink)" }}>Refund window</strong> · {RECEIPT.refund}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <Link href="#" className="btn-primary-v2 sm">Print / Save PDF</Link>
            <Link href="/dashboard/bookings" className="btn-ghost-v2 sm">Back to bookings</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
