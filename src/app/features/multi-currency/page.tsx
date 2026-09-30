import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { CurrencyDemo } from "@/components/ds/CurrencyDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multi-Currency Payments, Binectics",
  description:
    "Accept payments in local currency through Paystack. Clients pay locally, you receive in your settlement currency.",
  keywords:
    "multi-currency payments, fitness payments, gym payment processing, international payments, Paystack",
};

const WORKFLOW = [
  {
    step: "01",
    title: "Client pays in their currency",
    desc: "A member in Lagos pays in NGN. A member in London pays in GBP. They see prices in their local currency, use their local payment methods, and never think about conversion.",
  },
  {
    step: "02",
    title: "Paystack takes the payment",
    desc: "Payments run through Paystack today. A price can only be set in a currency we can actually charge, so every checkout completes. More gateways follow as we open markets.",
  },
  {
    step: "03",
    title: "You receive in your currency",
    desc: "Settlement hits your bank account in 1–3 business days, in your local currency. Platform fee already deducted. One clean number, no reconciliation needed.",
  },
];

// Marketing copy. Paystack is the only gateway integrated today.
const GATEWAYS = [
  {
    name: "Paystack",
    coverage: "Nigeria today, more markets as they are enabled",
    currencies: "NGN today; ZAR, KES and GHS as our account enables them",
    settlement: "Next business day",
    methods: "Cards, bank transfer",
  },
];

const REGIONS = [
  { flag: "🇿🇦", country: "South Africa", currency: "ZAR", gateway: "Paystack", settlement: "T+1" },
  { flag: "🇳🇬", country: "Nigeria", currency: "NGN", gateway: "Paystack", settlement: "T+1" },
  { flag: "🇰🇪", country: "Kenya", currency: "KES", gateway: "Paystack · coming soon", settlement: "-" },
  { flag: "🇬🇭", country: "Ghana", currency: "GHS", gateway: "Paystack · coming soon", settlement: "-" },
  { flag: "🇬🇧", country: "United Kingdom", currency: "GBP", gateway: "Not yet available", settlement: "-" },
  { flag: "🇺🇸", country: "United States", currency: "USD", gateway: "Not yet available", settlement: "-" },
  { flag: "🇦🇪", country: "UAE", currency: "AED", gateway: "Not yet available", settlement: "-" },
  { flag: "🇮🇳", country: "India", currency: "INR", gateway: "Not yet available", settlement: "-" },
  { flag: "🇩🇪", country: "Germany", currency: "EUR", gateway: "Not yet available", settlement: "-" },
];

const FEATURES = [
  { title: "Auto currency detection", desc: "We detect the payer's country from their IP and browser locale. Prices display in their local currency with no manual selection needed." },
  { title: "Split settlement", desc: "Platform fee is auto-deducted before settlement. You see the gross, the fee, and the net, all on one payout line." },
  { title: "Payout dashboard", desc: "Every payout listed with date, amount, bank, and status. Filter by period, export to CSV, or reconcile against your accounting software." },
  { title: "Invoice generation", desc: "Automatic branded invoices for every transaction. VAT number, tax breakdown, and provider details included. PDF download or email delivery." },
  { title: "Tax-ready exports", desc: "Quarterly and annual revenue reports formatted for your local tax authority. SARS, HMRC, IRS, and FIRS templates available." },
  { title: "Subscription billing", desc: "Auto-renewal with smart retry on failed payments. 3 retry attempts over 7 days with escalating notification to the member before cancellation." },
  { title: "Refund management", desc: "Full or partial refunds from your dashboard. Refund hits the member's original payment method. No manual gateway login needed." },
  { title: "Fraud protection", desc: "3D Secure on every card transaction. Velocity checks, device fingerprinting, and address verification through each gateway's built-in fraud tools." },
];

const FEE_BREAKDOWN = [
  { item: "Binectics platform fee", rate: "4.9% of transaction" },
  { item: "Gateway processing fee", rate: "Set by gateway (typically 1.4–2.9% + fixed)" },
  { item: "Currency conversion", rate: "Handled by gateway at market rate" },
  { item: "Setup fee", rate: "None" },
  { item: "Monthly minimum", rate: "None" },
  { item: "Chargeback fee", rate: "Passed through from gateway" },
];

const KPIS = [
  { label: "Monthly processed", value: "$4.8M" },
  { label: "Currencies supported", value: "14+" },
  { label: "Avg settlement", value: "1.8 days" },
  { label: "Countries active", value: "52" },
];

export default function MultiCurrencyPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5"
          style={{ color: "var(--fg-3)" }}
        >
          Platform
        </div>
        <h1
          className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[22ch]"
          style={{
            lineHeight: 1.04,
            letterSpacing: "-0.032em",
            color: "var(--ink)",
          }}
        >
          Get paid in their currency.{" "}
          <em className="font-serif font-normal italic">Receive in yours</em>.
        </h1>
        <p
          className="text-[17px] sm:text-[18px] max-w-[62ch] leading-[1.5] mt-5"
          style={{ color: "var(--fg-2)" }}
        >
          Accept payments through Paystack, in the currencies we can charge
          today. We handle checkout, compliance, and settlement. You see
          one clean number in your dashboard.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href="/login?mode=signup" className="btn-primary-v2 lg">
            Start accepting payments &rarr;
          </Link>
          <Link href="/pricing" className="btn-ghost-v2 lg">
            See pricing
          </Link>
        </div>
      </section>

      {/* Interactive demo */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Same plan, local checkout
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          Pick a country to see how checkout will look there. Paystack is
          live today; the other markets are coming.
        </p>
        <CurrencyDemo />
      </section>

      {/* How it works */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-8"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          How a payment moves
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKFLOW.map((w) => (
            <div
              key={w.step}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <div
                className="font-mono text-[28px] font-medium mb-3"
                style={{ color: "var(--border-2)" }}
              >
                {w.step}
              </div>
              <h3
                className="text-[17px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {w.title}
              </h3>
              <p
                className="text-[14px] leading-[1.55]"
                style={{ color: "var(--fg-2)" }}
              >
                {w.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Gateways */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          One gateway, zero config
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          We&rsquo;ve integrated Paystack so you don&rsquo;t have to.
          No API keys to manage, no webhook URLs to configure. Sign up and
          payments work.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GATEWAYS.map((g) => (
            <div
              key={g.name}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <h3
                className="text-[18px] font-medium mb-3"
                style={{ color: "var(--ink)" }}
              >
                {g.name}
              </h3>
              <div className="space-y-1.5">
                {[
                  ["Coverage", g.coverage],
                  ["Currencies", g.currencies],
                  ["Settlement", g.settlement],
                  ["Methods", g.methods],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3 text-[14px]">
                    <span
                      className="font-mono text-[12px] uppercase tracking-[0.02em] w-24 shrink-0 pt-0.5"
                      style={{ color: "var(--fg-3)" }}
                    >
                      {label}
                    </span>
                    <span style={{ color: "var(--fg-2)" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Regional coverage table */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-6"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Regional coverage
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]" style={{ color: "var(--fg-2)" }}>
            <thead>
              <tr
                className="text-left font-mono text-[11px] uppercase tracking-[0.04em]"
                style={{ color: "var(--fg-3)" }}
              >
                <th className="pb-3 pr-4 font-medium">Country</th>
                <th className="pb-3 pr-4 font-medium">Currency</th>
                <th className="pb-3 pr-4 font-medium">Gateway</th>
                <th className="pb-3 font-medium">Settlement</th>
              </tr>
            </thead>
            <tbody>
              {REGIONS.map((r) => (
                <tr
                  key={r.country}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td className="py-3 pr-4">
                    <span className="mr-2">{r.flag}</span>
                    {r.country}
                  </td>
                  <td
                    className="py-3 pr-4 font-mono text-[13px]"
                    style={{ color: "var(--ink)" }}
                  >
                    {r.currency}
                  </td>
                  <td className="py-3 pr-4">{r.gateway}</td>
                  <td
                    className="py-3 font-mono text-[13px]"
                    style={{ color: "var(--ink)" }}
                  >
                    {r.settlement}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p
          className="text-[13px] mt-4"
          style={{ color: "var(--fg-3)" }}
        >
          More countries follow as each currency is enabled on our payment account.
        </p>
      </section>

      {/* Features */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-6"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Built into every transaction
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-(--r-3) p-5"
              style={{ background: "var(--bg-2)" }}
            >
              <h3
                className="text-[15px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {f.title}
              </h3>
              <p
                className="text-[13.5px] leading-[1.55]"
                style={{ color: "var(--fg-2)" }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Fee transparency */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Transparent fees
        </h2>
        <p
          className="text-[16px] max-w-[52ch] leading-[1.5] mb-6"
          style={{ color: "var(--fg-2)" }}
        >
          No hidden charges. No surprise deductions. Here&rsquo;s exactly
          what you pay.
        </p>
        <div
          className="rounded-(--r-3) overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          {FEE_BREAKDOWN.map((f, i) => (
            <div
              key={f.item}
              className="flex flex-wrap items-center justify-between gap-1 px-5 py-3.5 text-[14px]"
              style={{
                borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                background: i % 2 === 0 ? "var(--bg)" : "var(--bg-2)",
              }}
            >
              <span style={{ color: "var(--ink)" }}>{f.item}</span>
              <span
                className="font-mono text-[13px]"
                style={{ color: "var(--fg-2)" }}
              >
                {f.rate}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-(--r-3) p-4.5"
              style={{ background: "var(--bg-2)" }}
            >
              <div
                className="font-mono text-[10.5px] uppercase tracking-[0.04em]"
                style={{ color: "var(--fg-3)" }}
              >
                {k.label}
              </div>
              <div
                className="text-[24px] sm:text-[32px] font-medium mt-1"
                style={{
                  letterSpacing: "-0.024em",
                  color: "var(--ink)",
                }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-14 sm:py-18 text-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[36px] font-medium mb-4"
          style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}
        >
          Your next client could be anywhere
        </h2>
        <p
          className="text-[16px] sm:text-[17px] max-w-[46ch] mx-auto leading-[1.5] mb-7"
          style={{ color: "var(--fg-2)" }}
        >
          Don&rsquo;t lose a sale because you can&rsquo;t accept their
          currency. Start accepting payments from 52 countries today.
        </p>
        <Link href="/login?mode=signup" className="btn-primary-v2 lg">
          Get started free &rarr;
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
