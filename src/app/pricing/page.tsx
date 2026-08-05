"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { TogglePill } from "@/components/ds/TogglePill";
import { PlanCard } from "@/components/ds/PlanCard";
import { useRegion } from "@/contexts/RegionContext";
import { type BillingPeriod, type CurrencyCode } from "@/lib/constants/regions";
import { providerBillingApi, type ProviderPlanOption } from "@/lib/api/providerBilling";
import { toPlanCards, toComparison } from "@/lib/pricing/providerPlanView";

/**
 * Pricing page. Provider plans (names, quotas, features, prices) are driven
 * entirely by the admin catalogue via `GET /provider-billing/plans`, so the
 * page stays in sync with whatever is configured in /admin/plans.
 */

const EXAMPLE_SESSION: Record<CurrencyCode, number> = {
  USD: 80, GBP: 65, EUR: 70, NGN: 25_000, KES: 5_000, ZAR: 1_200, AED: 250, INR: 3_000,
};

const GATEWAY_INFO: Record<CurrencyCode, { name: string; pct: number; flat: number }> = {
  USD: { name: "Stripe", pct: 0.029, flat: 0.30 },
  GBP: { name: "Stripe", pct: 0.015, flat: 0.20 },
  EUR: { name: "Stripe", pct: 0.014, flat: 0.25 },
  NGN: { name: "Paystack", pct: 0.015, flat: 100 },
  KES: { name: "Flutterwave", pct: 0.02, flat: 0 },
  ZAR: { name: "Paystack", pct: 0.015, flat: 1 },
  AED: { name: "Stripe", pct: 0.024, flat: 0 },
  INR: { name: "Razorpay", pct: 0.02, flat: 0 },
};

function buildFeeRows(currency: CurrencyCode, fmt: (n: number) => string) {
  const session = EXAMPLE_SESSION[currency];
  const platform = session * 0.05;
  const gw = GATEWAY_INFO[currency];
  const gwFee = Math.round((session * gw.pct + gw.flat) * 100) / 100;
  const total = session + platform + gwFee;
  return {
    rows: [
      { nm: "Session price", sub: "set by provider", member: fmt(session), provider: fmt(session), to: "Provider" },
      { nm: "Platform fee", sub: "5% · member side", member: `+ ${fmt(platform)}`, provider: "—", to: "Binectics" },
      { nm: "Gateway fee", sub: `${gw.name} · ${(gw.pct * 100).toFixed(1)}%${gw.flat ? ` + ${fmt(gw.flat)}` : ""}`, member: `+ ${fmt(gwFee)}`, provider: "—", to: gw.name },
    ],
    totalMember: fmt(total),
    totalProvider: fmt(session),
    monthlyGross: fmt(session * 80),
    monthlyGwFees: fmt(gwFee * 80),
    monthlyNet: fmt(session * 80 - gwFee * 80),
    gwName: gw.name,
  };
}

const REGIONS = [
  { country: "South Africa", code: "ZA · ZAR", gateway: "Paystack", fee: "1.5% + R 1" },
  { country: "Nigeria", code: "NG · NGN", gateway: "Paystack", fee: "1.5% + ₦100" },
  { country: "Kenya", code: "KE · KES", gateway: "M‑Pesa · Flutterwave", fee: "2.0%" },
  { country: "United Kingdom", code: "GB · GBP", gateway: "Stripe", fee: "1.5% + 20p" },
  { country: "United States", code: "US · USD", gateway: "Stripe", fee: "2.9% + 30¢" },
  { country: "UAE", code: "AE · AED", gateway: "Stripe · Tabby", fee: "2.4%" },
  { country: "India", code: "IN · INR", gateway: "Razorpay", fee: "2.0%" },
  { country: "Germany", code: "DE · EUR", gateway: "Stripe", fee: "1.4% + 25¢" },
];

const FAQS = [
  { q: "Is there a setup fee or annual contract?", a: "No. Paid plans are month‑to‑month, cancel any time. Enterprise contracts can be annual or quarterly, whichever you prefer. We don't ask for an upfront payment, and we don't claw back fees on cancellation." },
  { q: "What happens if I cross my plan's member limit?", a: <>We email you when you hit 80% and 100%. We don&apos;t auto‑upgrade you. If you stay over for two full months, we&apos;ll move you to a higher plan, but only after a conversation. <strong style={{ color: "var(--ink)", fontWeight: 500 }}>No surprise charges.</strong></> },
  { q: "Can I use my own payment processor keys?", a: "Yes. On the paid plans you configure your own Stripe, Paystack, Flutterwave, or Razorpay keys, and payments settle directly to your account. Binectics never holds funds, and your customers see your business name on their statement, not ours." },
  { q: "What does the 5% platform fee actually cover?", a: "Discovery (search, marketplace ranking), payment rails, dispute resolution, verification, SMS and email notifications, fraud protection, and a 24h human SLA. Roughly $2.5M of monthly platform GMV passes through these systems at any time." },
  { q: "Do you offer discounts for non‑profits or community programs?", a: <>Yes. Registered non‑profits get the Pro plan free, plus a reduced 2% platform fee. Apply at <span className="font-mono text-[13px]" style={{ color: "var(--ink)" }}>community@binectics.com</span> with your registration number.</> },
  { q: "What if I'm not happy with my plan?", a: "Downgrade or cancel from settings, instantly. Your data stays exportable for 90 days after closing. We'll prorate the unused part of the month and credit it back to your card within 5 business days." },
  { q: "Does the price change if I add more locations?", a: "The Pro plan covers a small number of locations. Beyond that you're on Enterprise, where the price depends on member volume and locations. It's always one fixed monthly number, not a per‑location upcharge that punishes growth." },
];

function Check() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>;
}

export default function PricingPage() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const { formatAmount, currency, regionName, country, locale } = useRegion();

  const [providerPlans, setProviderPlans] = useState<ProviderPlanOption[] | null>(null);
  const [plansError, setPlansError] = useState(false);

  useEffect(() => {
    let active = true;
    providerBillingApi
      .listPlans(country)
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) {
          setProviderPlans(res.data);
          setPlansError(false);
        } else {
          setPlansError(true);
        }
      })
      .catch(() => {
        if (active) setPlansError(true);
      });
    return () => {
      active = false;
    };
  }, [country]);

  const interval = period === "annual" ? "year" : "month";
  const providerCards = providerPlans ? toPlanCards(providerPlans, interval, locale) : [];
  const comparison = providerPlans && providerPlans.length > 0 ? toComparison(providerPlans, interval, locale) : null;
  const fee = buildFeeRows(currency, formatAmount);
  const sessionPrice = EXAMPLE_SESSION[currency];

  const plansLoading = providerPlans === null && !plansError;
  const plansUnavailable = plansError || (providerPlans !== null && providerPlans.length === 0);

  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar activeLabel="Pricing" />

      {/* Hero — 1.4fr/1fr, h1: 72px, padding: 80px 40px 48px */}
      <section className="mx-auto max-w-360 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] items-end px-5 sm:px-10 pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-12 gap-8 lg:gap-14" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Pricing</div>
          <h1 className="text-[48px] sm:text-[60px] lg:text-[72px] font-medium max-w-[14ch]" style={{ lineHeight: 0.96, letterSpacing: "-0.04em", color: "var(--ink)", marginTop: "18px" }}>
            Free to list.<br />You earn, then <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>we earn.</em>
          </h1>
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)", marginTop: "24px" }}>
            No setup fees, no per‑seat charges, and no annual lock‑ins. We take a single transparent platform fee on processed payments, the same in Cape Town, Lagos, London, or Mumbai. Every provider plan includes the copilot, and founding‑cohort pricing stays locked after launch.
          </p>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.05em] flex flex-col gap-3 pb-3" style={{ color: "var(--fg-3)" }}>
          {[{ k: "Take rate · members", v: "5%" }, { k: "Take rate · providers", v: "0%" }, { k: "Gateway fees", v: "Passed through" }, { k: "Hidden fees", v: "None" }].map((r, i) => (
            <div key={r.k} className="flex justify-between gap-6" style={{ paddingBottom: i < 3 ? "12px" : 0, borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
              <span>{r.k}</span>
              <strong className="text-[14px] font-medium uppercase-none" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none", letterSpacing: "-0.005em" }}>{r.v}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Billing toggle */}
      <div className="flex justify-center items-center gap-3 mx-auto max-w-360 px-5 sm:px-10" style={{ paddingTop: "28px" }}>
        <TogglePill
          label="Billed"
          options={[{ value: "monthly" as const, label: "Monthly" }, { value: "annual" as const, label: "Annual" }]}
          value={period}
          onChange={setPeriod}
        />
        {period === "annual" && (
          <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--signal-ink)" }}>Save ~17%</span>
        )}
      </div>

      {/* Plans — 3-col, padding: 28px 28px 24px */}
      {plansLoading ? (
        <section className="mx-auto max-w-360 px-5 sm:px-10 pt-8 sm:pt-10">
          <div className="py-16 text-center font-mono text-[12px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>Loading plans…</div>
        </section>
      ) : plansUnavailable ? (
        <section className="mx-auto max-w-360 px-5 sm:px-10 pt-8 sm:pt-10">
          <div className="rounded-(--r-3) py-10 px-6 text-center text-[14px]" style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}>
            We couldn&apos;t load live pricing right now. Please refresh the page to try again.
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-360 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-5 sm:px-10 pt-8 sm:pt-10">
          {providerCards.map((p) => (
            <PlanCard key={p.name} plan={p} />
          ))}
        </section>
      )}

      {/* Fee breakdown — 1.4fr/1fr grid */}
      <section className="mx-auto max-w-360 mt-10 sm:mt-16 px-5 sm:px-10 pb-10 sm:pb-16" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-16 items-end mb-8">
          <h2 className="text-[40px] font-medium leading-[1.05] max-w-[14ch]" style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}>What you actually pay.</h2>
          <p className="text-[16px] leading-[1.55] max-w-[56ch]" style={{ color: "var(--fg-2)", margin: 0 }}>A worked example: a member books a {formatAmount(sessionPrice)} session with a local trainer using a card via {fee.gwName}. Here&apos;s where every unit goes. <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>Amounts shown in {currency}.</span></p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          {/* Fee table */}
          <div className="rounded-(--r-3) overflow-x-auto" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="grid font-mono text-[11px] uppercase tracking-[0.04em]" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px", padding: "12px 18px", background: "var(--bg-2)", borderBottom: "1px solid var(--border)", color: "var(--fg-3)", minWidth: "480px" }}>
              <span>Line item</span><span className="text-right">Member pays</span><span className="text-right">Provider keeps</span><span className="text-right">Goes to</span>
            </div>
            {fee.rows.map((r) => (
              <div key={r.nm} className="grid items-center" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px", padding: "14px 18px", borderBottom: "1px solid var(--border)", minWidth: "480px" }}>
                <div><div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{r.nm}</div><div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.75" style={{ color: "var(--fg-3)" }}>{r.sub}</div></div>
                <div className="font-mono text-[14px] text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.member}</div>
                <div className="font-mono text-[14px] text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.provider}</div>
                <div className="font-mono text-[14px] text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.to}</div>
              </div>
            ))}
            <div className="grid items-center" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px", padding: "14px 18px", background: "var(--bg-2)", minWidth: "480px" }}>
              <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>Total · on the card</div>
              <div className="text-[16px] font-medium text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{fee.totalMember}</div>
              <div className="text-[16px] font-medium text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{fee.totalProvider}</div>
              <div className="font-mono text-[11px] text-right" style={{ color: "var(--fg-3)" }}>Settled overnight</div>
            </div>
          </div>
          {/* Aside */}
          <div className="rounded-(--r-3) flex flex-col gap-3.5" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", padding: "24px" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Why this works</div>
            <p className="font-serif italic text-[22px] leading-[1.3]" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>&ldquo;The provider sets a price and gets that price. We charge the convenience to whoever benefits from it most.&rdquo;</p>
            <div className="rounded-(--r-2) p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] mb-2" style={{ color: "var(--fg-3)" }}>Your monthly take · {regionName}</div>
              {[{ k: `80 sessions @ ${formatAmount(sessionPrice)}`, v: fee.monthlyGross }, { k: "Binectics fee", v: formatAmount(0) }, { k: "Gateway fees", v: `− ${fee.monthlyGwFees}` }].map((r) => (
                <div key={r.k} className="flex justify-between py-1 text-[13px]"><span style={{ color: "var(--fg-3)" }}>{r.k}</span><span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{r.v}</span></div>
              ))}
              <div className="flex justify-between pt-2 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>Net to your account</span>
                <span className="font-mono font-medium" style={{ color: "var(--signal-ink)", fontVariantNumeric: "tabular-nums" }}>{fee.monthlyNet}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-10 sm:py-16" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-[40px] font-medium leading-none max-w-[14ch]" style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}>The whole table.</h2>
        <p className="text-[15.5px] max-w-[56ch] leading-[1.55] mt-4" style={{ color: "var(--fg-2)" }}>Every provider plan, compared side by side. The same data lives in your dashboard once you&apos;ve signed up.</p>
        {comparison ? (
          <div className="rounded-(--r-3) overflow-x-auto mt-8" style={{ border: "1px solid var(--border)" }}>
            {/* Header */}
            <div className="grid" style={{ gridTemplateColumns: `1.6fr repeat(${comparison.planHeaders.length}, 1fr)`, borderBottom: "1px solid var(--border)", background: "var(--bg-2)", minWidth: "600px" }}>
              <div className="py-4.5 px-5" style={{ borderRight: "1px solid var(--border)" }}>
                <div className="text-[15px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Feature</div>
                <div className="font-mono text-[12px] uppercase tracking-[0.04em] mt-1" style={{ color: "var(--fg-3)" }}>Compare side by side</div>
              </div>
              {comparison.planHeaders.map((c) => (
                <div key={c.name} className="py-4.5 px-5" style={{ borderRight: "1px solid var(--border)", background: c.featured ? "var(--ink)" : undefined }}>
                  <div className="text-[15px] font-medium" style={{ letterSpacing: "-0.005em", color: c.featured ? "var(--bg)" : "var(--ink)" }}>{c.name}</div>
                  <div className="font-mono text-[12px] uppercase tracking-[0.04em] mt-1" style={{ color: c.featured ? "oklch(0.65 0.005 85)" : "var(--fg-3)" }}>{c.priceLabel}</div>
                </div>
              ))}
            </div>
            {/* Rows */}
            {comparison.groups.map((g) => (
              <div key={g.group}>
                <div className="font-mono text-[11px] uppercase tracking-[0.05em] px-5 py-2" style={{ background: "var(--bg-3)", color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>{g.group}</div>
                {g.rows.map((r) => (
                  <div key={r.feature} className="grid" style={{ gridTemplateColumns: `1.6fr repeat(${comparison.planHeaders.length}, 1fr)`, borderBottom: "1px solid var(--border)", minWidth: "600px" }}>
                    <div className="px-5 py-3 text-[13.5px] flex items-center" style={{ color: "var(--fg-2)", borderRight: "1px solid var(--border)" }}>{r.feature}</div>
                    {r.cells.map((v, i) => (
                      <div key={i} className="px-5 py-3 flex items-center gap-2 text-[13.5px]" style={{ borderRight: "1px solid var(--border)", background: comparison.planHeaders[i]?.featured ? "var(--bg-2)" : undefined, color: "var(--ink)" }}>
                        {v === null ? <span style={{ color: "var(--fg-4)" }}>—</span> : v === true ? <Check /> : <span className="font-mono text-[13px]" style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center font-mono text-[12px] uppercase tracking-[0.05em] mt-8" style={{ color: "var(--fg-3)" }}>
            {plansError ? "Comparison unavailable right now." : "Loading comparison…"}
          </div>
        )}
      </section>

      {/* Regional pricing — 4-col cards */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-10 sm:py-16" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-[40px] font-medium leading-none max-w-[14ch]" style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}>The same deal, in every country.</h2>
        <p className="text-[15.5px] max-w-[56ch] leading-[1.55] mt-4" style={{ color: "var(--fg-2)" }}>52 countries · 8 currencies. We route payments through the gateway that works best where you are, and the percentage we take stays the same.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
          {REGIONS.map((r) => (
            <div key={r.country} className="flex flex-col gap-2.5 rounded-(--r-3)" style={{ padding: "18px 20px", border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
                <strong className="text-[14px] font-medium block mb-0.5" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none", letterSpacing: "-0.005em" }}>{r.country}</strong>
                {r.code}
              </div>
              <div>
                <div className="font-mono text-[12px]" style={{ color: "var(--ink)" }}>{r.gateway}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-1" style={{ color: "var(--fg-3)" }}>{r.fee}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ — 1fr/2fr grid, details/summary */}
      <section className="mx-auto max-w-360 grid grid-cols-1 lg:grid-cols-[1fr_2fr] items-start" style={{ padding: "clamp(32px, 6vw, 64px) clamp(20px, 5vw, 40px)", gap: "clamp(24px, 5vw, 64px)", borderBottom: "1px solid var(--border)" }}>
        <div>
          <h2 className="text-[40px] font-medium leading-none max-w-[14ch]" style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}>The questions we get most.</h2>
          <p className="text-[15.5px] max-w-[36ch] leading-[1.55] mt-4" style={{ color: "var(--fg-2)" }}>If yours isn&apos;t here, email <span className="font-mono text-[14px]" style={{ color: "var(--ink)" }}>sales@binectics.com</span>. Most replies land within 2 hours, weekdays SAST.</p>
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

      {/* CTA — ink bg, rounded, 72px padding */}
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
