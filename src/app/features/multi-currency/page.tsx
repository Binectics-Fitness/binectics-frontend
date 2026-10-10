import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { CurrencyDemo } from "@/components/ds/CurrencyDemo";
import {
  CurrencyCoverageTable,
  CurrencyKpis,
  GatewayCards,
} from "@/components/marketing/CurrencyFacts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multi-Currency Payments",
  description:
    "Get paid in your local currency. Clients pay at your price, in your currency, and the money settles to your own payment account.",
  keywords:
    "multi-currency payments, fitness payments, gym payment processing, local currency payments",
};

const WORKFLOW = [
  {
    step: "01",
    title: "You price in your currency",
    desc: "Set each plan and session price in your own currency, from the currencies we can charge. Clients see that exact amount.",
  },
  {
    step: "02",
    title: "The payment provider takes the payment",
    desc: "Payments run through the payment providers we've integrated. A price can only be set in a currency we can actually charge, so every checkout completes.",
  },
  {
    step: "03",
    title: "It settles to your account",
    desc: "The money goes to your own payment account, in the currency it was charged in. Binectics never holds it and takes no cut.",
  },
];

const FEATURES = [
  { title: "Local currency pricing", desc: "Price in the currency your clients use. Only currencies we can charge are offered, so a price never fails at checkout." },
  { title: "Revenue view", desc: "Revenue totals and a daily chart on your dashboard. Each currency is shown as it was paid, never converted." },
  { title: "Booking receipts", desc: "Every booking has a receipt page with the provider, session, amount and payment reference, which can be printed from the browser." },
  { title: "Subscription billing", desc: "Plans can renew automatically, and members get a reminder before a membership runs out." },
  { title: "Card or bank transfer", desc: "Members pay by card, or by bank transfer to a one-time account number. The membership starts once the payment is confirmed." },
  { title: "Fraud protection", desc: "3D Secure on card transactions, plus the payment provider's own fraud tools." },
];

const FEE_BREAKDOWN = [
  { item: "Binectics fee on payments", rate: "None" },
  { item: "Payment provider fee", rate: "Set by the provider, shown at checkout" },
  { item: "Currency conversion", rate: "None, you're paid in the currency charged" },
  { item: "Setup fee", rate: "None" },
  { item: "Monthly minimum", rate: "None" },
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
          Accept payments in the currencies we can charge today, through
          the payment providers we&rsquo;ve integrated. You see one clean
          number in your dashboard.
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
          Pick a currency to see how checkout looks in it. Only currencies
          we can charge today are shown.
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
          Payment providers
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          The payment providers we run today and the currencies each can
          charge. More open as each one is enabled.
        </p>
        <GatewayCards />
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
          Currency coverage
        </h2>
        <CurrencyCoverageTable />
        <p
          className="text-[13px] mt-4"
          style={{ color: "var(--fg-3)" }}
        >
          More currencies open as each one is enabled on our payment account.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
        <CurrencyKpis />
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
          Price in your currency, get paid to your own account. Start
          accepting payments today.
        </p>
        <Link href="/login?mode=signup" className="btn-primary-v2 lg">
          Get started free &rarr;
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
