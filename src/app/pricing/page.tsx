"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { TogglePill } from "@/components/ds/TogglePill";
import { ProviderPricing } from "@/components/pricing/ProviderPricing";
import { MemberPricing } from "@/components/pricing/MemberPricing";
import { PaymentCoverage } from "@/components/pricing/PaymentCoverage";

/**
 * Pricing, from pricing.html. Provider plans, their prices and limits come
 * from the public catalogue (GET /provider-billing/plans) for the visitor's
 * country and provider type; payment providers and currencies come from
 * GET /currencies. Members have no plan: they join free and pay providers
 * directly. Nothing on this page quotes an amount the API didn't return.
 */

const FAQS = [
  { q: "Is there a setup fee or annual contract?", a: "No setup fee. Paid plans are billed monthly, or yearly where a yearly price is offered, and you can cancel any time. We don't ask for an upfront payment." },
  { q: "What happens if I cross my plan's member limit?", a: <>We tell you as you get close. We don&apos;t auto-upgrade you: you choose a larger plan, or archive members you no longer work with to free seats. <strong style={{ color: "var(--ink)", fontWeight: 500 }}>No surprise charges.</strong></> },
  { q: "Can I use my own payment account?", a: "Yes. You connect your own account with a payment provider we support, and your customers' payments settle directly to you. Binectics never holds your money." },
  { q: "What do members pay?", a: "Nothing to join. Members pay providers directly, at each provider's own prices and in the provider's currency. The full amount is shown before they confirm." },
  { q: "What if I'm not happy with my plan?", a: "Change or cancel it from your billing settings. Your data stays exportable after you leave." },
  { q: "What if my business needs more than the largest plan?", a: "Each plan's limits are listed above. If you need more locations, staff or members than a plan allows, talk to us and we'll shape a custom plan." },
];

export default function PricingPage() {
  const [audience, setAudience] = useState<"provider" | "member">("provider");

  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar activeLabel="Pricing" />

      {/* Hero, 1.4fr/1fr */}
      <section className="mx-auto max-w-360 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] items-end px-5 sm:px-10 pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-12 gap-8 lg:gap-14" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Pricing</div>
          <h1 className="text-[44px] sm:text-[60px] lg:text-[72px] font-medium max-w-[14ch]" style={{ lineHeight: 0.96, letterSpacing: "-0.04em", color: "var(--ink)", marginTop: "18px" }}>
            Free to start.<br />Pay as you <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>grow.</em>
          </h1>
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)", marginTop: "24px" }}>
            Providers pick a plan sized to their practice, priced in their local currency where we can charge it. Members join free and pay providers directly. No setup fees, no lock-ins.
          </p>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.05em] flex flex-col gap-3 pb-3" style={{ color: "var(--fg-3)" }}>
          {[{ k: "Members", v: "Free to join" }, { k: "Providers", v: "Plan by size" }, { k: "Gateway fees", v: "Shown at checkout" }, { k: "Hidden fees", v: "None" }].map((r, i) => (
            <div key={r.k} className="flex justify-between gap-6" style={{ paddingBottom: i < 3 ? "12px" : 0, borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
              <span>{r.k}</span>
              <strong className="text-[14px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none", letterSpacing: "-0.005em" }}>{r.v}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Audience toggle, then plans */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 pt-7 pb-10 sm:pb-16" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex justify-center mb-4">
          <TogglePill
            label="I'm a"
            options={[{ value: "provider" as const, label: "Provider" }, { value: "member" as const, label: "Member" }]}
            value={audience}
            onChange={setAudience}
          />
        </div>
        {audience === "provider" ? <ProviderPricing compare /> : <MemberPricing />}
      </section>

      {/* Where you can be paid, from GET /currencies */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-10 sm:py-16" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-[32px] sm:text-[40px] font-medium leading-none max-w-[16ch]" style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}>Where you can be paid.</h2>
        <p className="text-[15.5px] max-w-[56ch] leading-[1.55] mt-4" style={{ color: "var(--fg-2)" }}>The payment providers we run today and the currencies each can charge. More open as each one is enabled. Gateway fees are the provider&apos;s own and are shown at checkout.</p>
        <PaymentCoverage />
      </section>

      {/* FAQ, 1fr/2fr grid, details/summary */}
      <section className="mx-auto max-w-360 grid grid-cols-1 lg:grid-cols-[1fr_2fr] items-start" style={{ padding: "clamp(32px, 6vw, 64px) clamp(20px, 5vw, 40px)", gap: "clamp(24px, 5vw, 64px)", borderBottom: "1px solid var(--border)" }}>
        <div>
          <h2 className="text-[40px] font-medium leading-none max-w-[14ch]" style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}>The questions we get most.</h2>
          <p className="text-[15.5px] max-w-[36ch] leading-[1.55] mt-4" style={{ color: "var(--fg-2)" }}>If yours isn&apos;t here, email <span className="font-mono text-[14px]" style={{ color: "var(--ink)" }}>sales@binectics.com</span>, most replies within 2 hours, weekdays SAST.</p>
        </div>
        <div className="rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {FAQS.map((f, i) => (
            <details key={i} open={i === 0} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid var(--border)" : "none" }}>
              <summary className="flex justify-between items-center gap-4 cursor-pointer list-none px-6 py-4.5 text-[16px] font-medium faq-summary" style={{ letterSpacing: "-0.008em", color: "var(--ink)" }}>
                {f.q}
                <span className="faq-icon font-mono text-[20px] font-light shrink-0" style={{ color: "var(--fg-3)" }}>+</span>
              </summary>
              <div className="px-6 pb-5.5 text-[14.5px] leading-[1.6] max-w-[64ch]" style={{ color: "var(--fg-2)" }}>{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA, ink bg, rounded */}
      <div className="mx-auto max-w-[1360px] px-5 sm:px-10 my-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-end rounded-(--r-3)" style={{ background: "var(--ink)", color: "var(--bg)", padding: "clamp(32px, 7vw, 72px) clamp(20px, 5vw, 48px)" }}>
          <h2 className="text-[36px] sm:text-[48px] font-medium max-w-[14ch]" style={{ lineHeight: 0.98, letterSpacing: "-0.032em", color: "var(--bg)" }}>
            List your practice today. Verified within two business days.
          </h2>
          <div className="flex flex-col gap-4 items-start">
            <p className="text-[15px] max-w-[36ch] leading-[1.5]" style={{ color: "oklch(0.78 0.005 85)", margin: 0 }}>Free to start, three minutes to publish. We email you when verification clears so you know exactly when search traffic kicks in.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login?mode=signup" className="btn-signal-v2 lg" style={{ color: "oklch(0.18 0.05 148)" }}>Create your account →</Link>
              <Link href="/marketplace" className="btn-ghost-v2 lg" style={{ color: "var(--bg)", borderColor: "oklch(0.35 0.008 80)" }}>Browse first</Link>
            </div>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
