"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { useRegion } from "@/contexts/RegionContext";
import { type PlanTier, type BillingPeriod, type CurrencyCode, getMonthlyEquivalent } from "@/lib/constants/regions";

/**
 * Pricing — pricing.html prototype. Pixel-perfect rebuild.
 * Hero: 1.4fr/1fr grid, h1 72px. Audience toggle. Provider + member plans.
 * Fee breakdown table. Feature comparison table. Regional pricing. 7 FAQs. CTA.
 */

interface PricingPlan {
  name: string; meta: string; price: string; priceSub: string; tagline: string; cta: string; divider: string; features: string[];
  text?: boolean; ghost?: boolean; featured?: boolean; ink?: boolean; badge?: string;
}

function buildProviderPlans(fmt: (amount: number) => string, period: BillingPeriod, monthlyEq: (tier: PlanTier) => string): PricingPlan[] {
  const isAnnual = period === "annual";
  return [
    { name: "Starter", meta: "For new providers", price: "Free", priceSub: "forever", text: true, tagline: "List a single profile, take up to 50 active members. Try the rails before you commit.", cta: "Start free →", ghost: true, divider: "Includes", features: ["1 marketplace listing", "Up to 50 active members or clients", "QR check‑in & streak tracking", "Booking, payments, messages", "Standard payment fees apply", "Email support · 24h response"] },
    { name: "Studio", meta: "Solo & single‑location", price: monthlyEq("studio"), priceSub: isAnnual ? "/ mo · billed annually" : "/ month", tagline: isAnnual ? "Pay once a year and save ~17%. For full‑time trainers, dietitians, and single‑location gyms." : "For full‑time trainers, dietitians, and single‑location gyms running a real practice. Cancel any time.", cta: "Choose Studio", featured: true, badge: isAnnual ? "Save 2 months" : undefined, divider: "Everything in Starter, plus", features: ["Up to 500 active members", "Staff & client management", "Custom gateway keys · Stripe / Paystack / Flutterwave", "Revenue + check‑in analytics", "Plan / program builder", "Verified badge after document review", "Provider success Slack channel"] },
    { name: "Enterprise", meta: "Multi‑location · multi‑country", price: "Custom", priceSub: "talk to us", text: true, tagline: "For chains with 3+ locations, corporate wellness contracts, or 5,000+ members. We meet your team and shape a deal.", cta: "Talk to sales →", ink: true, divider: "Everything in Studio, plus", features: ["Unlimited locations & members", "Org‑level billing & SSO", "Assignment rules & team scopes", "Dedicated provider success", "99.95% uptime SLA · audit logs", "Sandbox + staging environments", "API access"] },
  ];
}

function buildMemberPlans(fmt: (amount: number) => string, period: BillingPeriod, monthlyEq: (tier: PlanTier) => string): PricingPlan[] {
  const isAnnual = period === "annual";
  return [
    { name: "Member", meta: "For everyone who books", price: "Free", priceSub: "account", text: true, tagline: "No subscription. You only pay for what you book. The 5% platform fee is shown clearly at checkout — never hidden.", cta: "Create account →", divider: "Includes", features: ["Unlimited bookings", "QR check‑in & streak tracking", "Messaging with your providers", "Workout, weight, and meal logs", "One‑click refund flow if something goes wrong", "Available in 52 countries, 8 currencies"] },
    { name: "Premium", meta: "For frequent bookers", price: monthlyEq("premium"), priceSub: isAnnual ? "/ mo · billed annually" : "/ month", tagline: "Waive the platform fee on every booking, plus priority support and early access to new providers in your city.", cta: "Join the waitlist", featured: true, badge: isAnnual ? "Save 2 months" : "Coming soon", divider: "Everything in Member, plus", features: ["0% platform fee on all bookings", "Priority booking on full classes", "Early access to new verified providers", "Priority human support · 1h SLA", "Cross‑city portability when you travel"] },
    { name: "Family", meta: "Up to 5 people", price: monthlyEq("family"), priceSub: isAnnual ? "/ mo · billed annually" : "/ month", tagline: "One account, five members. Share bookings, manage kids' schedules, see everyone's check‑ins in one feed.", cta: "Join waitlist →", ink: true, divider: "Everything in Premium, plus", features: ["Up to 5 family members", "Single billing across the family", "Youth profiles with guardian controls", "Joint training plans (siblings, couples)", "Shared streak leaderboard"] },
  ];
}

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

const COMPARE = [
  { group: "Marketplace", rows: [
    { feature: "Marketplace listings", starter: "1", studio: "5", enterprise: "Unlimited" },
    { feature: "Verified badge", starter: null, studio: true, enterprise: true },
    { feature: "Search ranking boost", starter: null, studio: "Tier 2", enterprise: "Tier 1" },
  ]},
  { group: "Operations", rows: [
    { feature: "Active members / clients", starter: "50", studio: "500", enterprise: "Unlimited" },
    { feature: "Staff seats", starter: "1", studio: "10", enterprise: "Unlimited" },
    { feature: "Multi‑location support", starter: null, studio: "Up to 3", enterprise: true },
    { feature: "Plan / program builder", starter: null, studio: true, enterprise: true },
  ]},
  { group: "Payments", rows: [
    { feature: "Platform fee · paid by member", starter: "5%", studio: "5%", enterprise: "Negotiable" },
    { feature: "Custom gateway keys", starter: null, studio: true, enterprise: true },
    { feature: "Direct settlement to your account", starter: true, studio: true, enterprise: true },
  ]},
  { group: "Support & reliability", rows: [
    { feature: "Email support", starter: "24h SLA", studio: "4h SLA", enterprise: "1h SLA" },
    { feature: "Dedicated provider success", starter: null, studio: "Shared", enterprise: "Named contact" },
    { feature: "Uptime SLA", starter: null, studio: "99.9%", enterprise: "99.95%" },
    { feature: "Audit log access", starter: null, studio: "30 days", enterprise: "2 years · API" },
  ]},
];

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
  { q: "Is there a setup fee or annual contract?", a: "No. Studio is month‑to‑month, cancel any time. Enterprise contracts can be annual or quarterly — your choice. We don't ask for an upfront payment, and we don't claw back fees on cancellation." },
  { q: "What happens if I cross my plan's member limit?", a: <>We email you when you hit 80% and 100%. We don&apos;t auto‑upgrade you. If you stay over for two full months, we&apos;ll move you to Studio or Enterprise — but only after a conversation. <strong style={{ color: "var(--ink)", fontWeight: 500 }}>No surprise charges.</strong></> },
  { q: "Can I use my own payment processor keys?", a: "Yes — Studio and Enterprise providers configure their own Stripe, Paystack, Flutterwave, or Razorpay keys. Payments settle directly to your account. Binectics never holds funds, and your customers see your business name on their statement, not ours." },
  { q: "What does the 5% platform fee actually cover?", a: "Discovery (search, marketplace ranking), payments rails, dispute resolution, verification, SMS & email notifications, fraud protection, and a 24h human SLA. Roughly $2.5M of monthly platform GMV passes through these systems at any time." },
  { q: "Do you offer discounts for non‑profits or community programs?", a: <>Yes. Registered non‑profits get the Studio plan free, plus a reduced 2% platform fee. Apply at <span className="font-mono text-[13px]" style={{ color: "var(--ink)" }}>community@binectics.com</span> with your registration number.</> },
  { q: "What if I'm not happy with my plan?", a: "Downgrade or cancel from settings, instantly. Your data stays exportable for 90 days after closing. We'll prorate the unused part of the month and credit it back to your card within 5 business days." },
  { q: "Does the price change if I add more locations?", a: "Studio includes up to 3 locations. Beyond that, you're on Enterprise — the price depends on member volume and locations, but it's always one fixed monthly number, not a per‑location upcharge that punishes growth." },
];

function Check() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>;
}

export default function PricingPage() {
  const [audience, setAudience] = useState<"provider" | "member">("provider");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const { formatAmount, currency, regionName } = useRegion();
  const monthlyEq = (tier: PlanTier) => formatAmount(getMonthlyEquivalent(tier, currency, period));
  const plans = audience === "provider"
    ? buildProviderPlans(formatAmount, period, monthlyEq)
    : buildMemberPlans(formatAmount, period, monthlyEq);
  const fee = buildFeeRows(currency, formatAmount);
  const sessionPrice = EXAMPLE_SESSION[currency];

  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar activeLabel="Pricing" />

      {/* Hero — 1.4fr/1fr, h1: 72px, padding: 80px 40px 48px */}
      <section className="mx-auto max-w-360 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] items-end px-5 sm:px-10 pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-12 gap-8 lg:gap-14" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Pricing · Updated 14 May 2026</div>
          <h1 className="text-[48px] sm:text-[60px] lg:text-[72px] font-medium max-w-[14ch]" style={{ lineHeight: 0.96, letterSpacing: "-0.04em", color: "var(--ink)", marginTop: "18px" }}>
            Free to list.<br />You earn, then <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>we earn.</em>
          </h1>
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)", marginTop: "24px" }}>
            No setup fees. No per‑seat charges. No annual lock‑ins. We take a single transparent platform fee on processed payments — the same in Cape Town, Lagos, London, or Mumbai.
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

      {/* Audience + billing toggles */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mx-auto max-w-360 px-5 sm:px-10" style={{ paddingTop: "28px" }}>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>I&apos;m a</span>
          <div className="inline-flex rounded-full" style={{ padding: "4px", background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            {(["provider", "member"] as const).map((a) => (
              <button key={a} onClick={() => setAudience(a)} className="px-4.5 py-2.5 min-h-11 rounded-full text-[13px] font-medium cursor-pointer" style={{ background: audience === a ? "var(--bg)" : "transparent", color: audience === a ? "var(--ink)" : "var(--fg-3)", boxShadow: audience === a ? "0 1px 2px oklch(0 0 0 / 0.06)" : "none", transition: "background var(--motion-fast), color var(--motion-fast)" }}>
                {a === "provider" ? "Provider" : "Member"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>Billed</span>
          <div className="inline-flex rounded-full" style={{ padding: "4px", background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            {(["monthly", "annual"] as const).map((b) => (
              <button key={b} onClick={() => setPeriod(b)} className="px-4.5 py-2.5 min-h-11 rounded-full text-[13px] font-medium cursor-pointer" style={{ background: period === b ? "var(--bg)" : "transparent", color: period === b ? "var(--ink)" : "var(--fg-3)", boxShadow: period === b ? "0 1px 2px oklch(0 0 0 / 0.06)" : "none", transition: "background var(--motion-fast), color var(--motion-fast)" }}>
                {b === "monthly" ? "Monthly" : "Annual"}
              </button>
            ))}
          </div>
          {period === "annual" && (
            <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--signal-ink)" }}>Save ~17%</span>
          )}
        </div>
      </div>

      {/* Plans — 3-col, padding: 28px 28px 24px */}
      <section className="mx-auto max-w-360 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-5 sm:px-10 pt-8 sm:pt-10">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-(--r-3) flex flex-col relative ${p.featured ? "bg-bg-2" : p.ink ? "" : "bg-bg"}`} style={{ padding: "28px 28px 24px", gap: "16px", border: `1px solid ${p.featured || p.ink ? "var(--ink)" : "var(--border)"}`, background: p.ink ? "var(--ink)" : undefined, color: p.ink ? "var(--bg)" : undefined }}>
            {(p.featured || p.badge) && (
              <span className="absolute font-mono text-[10.5px] uppercase tracking-[0.05em] inline-flex items-center gap-1.25 rounded-full" style={{ top: "-10px", left: "24px", padding: "4px 10px", background: p.ink ? "var(--signal)" : "var(--ink)", color: p.ink ? "oklch(0.18 0.05 148)" : "var(--bg)" }}>
                <span className="w-1.25 h-1.25 rounded-full" style={{ background: p.ink ? "oklch(0.18 0.05 148)" : "var(--signal)" }} />
                {p.badge || "Most picked"}
              </span>
            )}
            <div className="flex justify-between items-baseline">
              <div className="text-[16px] font-medium" style={{ letterSpacing: "-0.005em", color: p.ink ? "var(--bg)" : "var(--ink)" }}>{p.name}</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: p.ink ? "oklch(0.65 0.005 85)" : "var(--fg-3)" }}>{p.meta}</div>
            </div>
            <div className={`font-medium flex items-baseline gap-2 flex-wrap ${p.text ? "text-[36px]" : "text-[32px] sm:text-[56px]"}`} style={{ letterSpacing: "-0.04em", lineHeight: 1, color: p.ink ? "var(--bg)" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
              {p.price}<small className="font-mono text-[12px] sm:text-[14px] font-normal" style={{ color: p.ink ? "oklch(0.7 0.005 85)" : "var(--fg-3)" }}>{p.priceSub}</small>
            </div>
            <p className="text-[13.5px] leading-[1.5] max-w-[32ch]" style={{ color: p.ink ? "oklch(0.82 0.005 85)" : "var(--fg-2)" }}>{p.tagline}</p>
            <Link href={p.ink ? "#" : "/login?mode=signup"} className={`${p.featured ? "btn-primary-v2" : p.ink ? "btn-signal-v2" : "btn-ghost-v2"} w-full justify-center min-h-11`} style={p.ink ? { color: "oklch(0.18 0.05 148)" } : undefined}>{p.cta}</Link>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.05em]" style={{ borderTop: `1px solid ${p.ink ? "oklch(0.3 0.008 80)" : "var(--border)"}`, marginTop: "4px", paddingTop: "16px", color: p.ink ? "oklch(0.7 0.005 85)" : "var(--fg-3)" }}>{p.divider}</div>
            <ul className="flex flex-col gap-2.25 list-none p-0 m-0">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2.5 items-start text-[13.5px] leading-[1.5]" style={{ color: p.ink ? "oklch(0.85 0.005 85)" : "var(--fg-2)" }}>
                  <span className="w-2.5 h-1.5 border-l-[1.5px] border-b-[1.5px] -rotate-45 shrink-0 mt-[5px]" style={{ borderColor: p.ink ? "var(--signal)" : "var(--ink)" }} />
                  <span dangerouslySetInnerHTML={{ __html: f.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--ink);font-weight:500">$1</strong>') }} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Fee breakdown — 1.4fr/1fr grid */}
      <section className="mx-auto max-w-360 mt-10 sm:mt-16 px-5 sm:px-10 pb-10 sm:pb-16" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-16 items-end mb-8">
          <h2 className="text-[40px] font-medium leading-[1.05] max-w-[14ch]" style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}>What you <em className="font-serif font-normal italic">actually</em> pay.</h2>
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
        <p className="text-[15.5px] max-w-[56ch] leading-[1.55] mt-4" style={{ color: "var(--fg-2)" }}>The same data lives in your dashboard once you&apos;ve signed up.</p>
        <div className="rounded-(--r-3) overflow-x-auto mt-8" style={{ border: "1px solid var(--border)" }}>
          {/* Header */}
          <div className="grid" style={{ gridTemplateColumns: "1.6fr repeat(3, 1fr)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)", minWidth: "600px" }}>
            {[{ name: "Feature", price: "Compare side by side" }, { name: "Starter", price: "Free" }, { name: "Studio", price: `${monthlyEq("studio")} / mo${period === "annual" ? " · annual" : ""}`, featured: true }, { name: "Enterprise", price: "Custom" }].map((c) => (
              <div key={c.name} className="py-4.5 px-5" style={{ borderRight: "1px solid var(--border)", background: c.featured ? "var(--ink)" : undefined }}>
                <div className="text-[15px] font-medium" style={{ letterSpacing: "-0.005em", color: c.featured ? "var(--bg)" : "var(--ink)" }}>{c.name}</div>
                <div className="font-mono text-[12px] uppercase tracking-[0.04em] mt-1" style={{ color: c.featured ? "oklch(0.65 0.005 85)" : "var(--fg-3)" }}>{c.price}</div>
              </div>
            ))}
          </div>
          {/* Rows */}
          {COMPARE.map((g) => (
            <div key={g.group}>
              <div className="font-mono text-[11px] uppercase tracking-[0.05em] px-5 py-2" style={{ background: "var(--bg-3)", color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>{g.group}</div>
              {g.rows.map((r) => (
                <div key={r.feature} className="grid" style={{ gridTemplateColumns: "1.6fr repeat(3, 1fr)", borderBottom: "1px solid var(--border)", minWidth: "600px" }}>
                  <div className="px-5 py-3 text-[13.5px] flex items-center" style={{ color: "var(--fg-2)", borderRight: "1px solid var(--border)" }}>{r.feature}</div>
                  {[r.starter, r.studio, r.enterprise].map((v, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-2 text-[13.5px]" style={{ borderRight: "1px solid var(--border)", background: i === 1 ? "var(--bg-2)" : undefined, color: "var(--ink)" }}>
                      {v === null ? <span style={{ color: "var(--fg-4)" }}>—</span> : v === true ? <Check /> : <span className="font-mono text-[13px]" style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Regional pricing — 4-col cards */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-10 sm:py-16" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-[40px] font-medium leading-none max-w-[14ch]" style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}>The same deal, in every country.</h2>
        <p className="text-[15.5px] max-w-[56ch] leading-[1.55] mt-4" style={{ color: "var(--fg-2)" }}>52 countries · 8 currencies. We route payments through the gateway that works best where you are — the percentage we take stays the same.</p>
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
          <p className="text-[15.5px] max-w-[36ch] leading-[1.55] mt-4" style={{ color: "var(--fg-2)" }}>If yours isn&apos;t here, email <span className="font-mono text-[14px]" style={{ color: "var(--ink)" }}>sales@binectics.com</span> — most replies within 2 hours, weekdays SAST.</p>
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
