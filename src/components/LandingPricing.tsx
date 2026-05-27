"use client";

import { useState } from "react";
import Link from "next/link";
import { useRegion } from "@/contexts/RegionContext";
import { type BillingPeriod, type PlanTier, getMonthlyEquivalent } from "@/lib/constants/regions";

export default function LandingPricing() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const { formatAmount, currency } = useRegion();
  const isAnnual = period === "annual";
  const studioPrice = formatAmount(getMonthlyEquivalent("studio", currency, period));
  const premiumPrice = formatAmount(getMonthlyEquivalent("premium", currency, period));
  const familyPrice = formatAmount(getMonthlyEquivalent("family", currency, period));
  const priceSub = isAnnual ? "/ mo · billed annually" : "/ month";

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="inline-flex rounded-full" style={{ padding: "4px", background: "var(--bg-2)", border: "1px solid var(--border)" }}>
          {(["monthly", "annual"] as const).map((b) => (
            <button key={b} onClick={() => setPeriod(b)} className="px-4.5 py-2 rounded-full text-[13px] font-medium cursor-pointer" style={{ background: period === b ? "var(--bg)" : "transparent", color: period === b ? "var(--ink)" : "var(--fg-3)", boxShadow: period === b ? "0 1px 2px oklch(0 0 0 / 0.06)" : "none", transition: "background var(--motion-fast), color var(--motion-fast)" }}>
              {b === "monthly" ? "Monthly" : "Annual"}
            </button>
          ))}
        </div>
        {isAnnual && (
          <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--signal-ink)" }}>Save ~17%</span>
        )}
      </div>

      {/* Provider plans */}
      <div className="font-mono text-[11px] uppercase tracking-[0.05em] mb-3" style={{ color: "var(--fg-3)" }}>For providers</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-(--r-3) overflow-hidden bg-bg">
        {/* Starter */}
        <div className="p-6 sm:p-7 flex flex-col gap-3.5 border-b sm:border-b-0 sm:border-r border-border">
          <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-fg-3">Starter</div>
          <h3 className="text-[24px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Free</h3>
          <div className="font-mono text-[12px] text-fg-3">For new providers · forever free</div>
          <ul className="flex flex-col gap-1.5 list-none p-0 mt-3">
            {["One marketplace listing", "Up to 50 active members", "QR check-ins included", "5% platform fee on transactions"].map((b) => (
              <li key={b} className="text-[12.5px] text-fg-2 pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-px before:bg-fg-3">{b}</li>
            ))}
          </ul>
          <Link href="/login?mode=signup" className="btn-ghost-v2 md mt-auto self-start">Start free</Link>
        </div>

        {/* Studio */}
        <div className="p-6 sm:p-7 flex flex-col gap-3.5 border-b sm:border-b-0 sm:border-r border-border relative" style={{ background: "var(--bg-2)" }}>
          {isAnnual && (
            <span className="absolute font-mono text-[10.5px] uppercase tracking-[0.05em] inline-flex items-center gap-1.25 rounded-full" style={{ top: "-10px", left: "24px", padding: "4px 10px", background: "var(--ink)", color: "var(--bg)" }}>
              <span className="w-1.25 h-1.25 rounded-full" style={{ background: "var(--signal)" }} />
              Save 2 months
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-fg-3">Studio</span>
            <span className="inline-flex items-center gap-1.25 h-4.5 px-2 rounded-(--r-1) text-[11px] font-medium bg-signal-soft text-signal-ink border border-[oklch(0.88_0.05_148)]">Recommended</span>
          </div>
          <h3 className="text-[24px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            {studioPrice} <span className="font-mono text-[13px] text-fg-3 font-normal">{priceSub}</span>
          </h3>
          <div className="font-mono text-[12px] text-fg-3">For single-location operators</div>
          <ul className="flex flex-col gap-1.5 list-none p-0 mt-3">
            {["Up to 500 active members", "Staff & client management", "Custom payment gateway keys", "Revenue + check-in analytics", "Email digest, in-app inbox"].map((b) => (
              <li key={b} className="text-[12.5px] text-fg-2 pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-px before:bg-fg-3">{b}</li>
            ))}
          </ul>
          <Link href="/login?mode=signup" className="btn-signal-v2 mt-auto self-start" style={{ height: "34px", padding: "0 14px" }}>Choose Studio</Link>
        </div>

        {/* Enterprise */}
        <div className="p-6 sm:p-7 flex flex-col gap-3.5" style={{ background: "var(--ink)" }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "oklch(0.78 0.005 85)" }}>Enterprise</div>
          <h3 className="text-[24px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: "var(--bg)" }}>Custom</h3>
          <div className="font-mono text-[12px]" style={{ color: "oklch(0.78 0.005 85)" }}>Multi-location · multi-country</div>
          <ul className="flex flex-col gap-1.5 list-none p-0 mt-3">
            {["Unlimited locations & members", "Org-level billing & SSO", "Assignment rules & team roles", "Dedicated provider success", "SLA & audit logs"].map((b) => (
              <li key={b} className="text-[12.5px] pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-px" style={{ color: "oklch(0.78 0.005 85)" }}>{b}</li>
            ))}
          </ul>
          <Link href="/contact" className="btn-ghost-v2 md mt-auto self-start" style={{ background: "var(--bg)", color: "var(--ink)", borderColor: "var(--bg)" }}>Talk to us</Link>
        </div>
      </div>

      {/* Member plans */}
      <div className="font-mono text-[11px] uppercase tracking-[0.05em] mb-3 mt-8" style={{ color: "var(--fg-3)" }}>For members</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-(--r-3) overflow-hidden bg-bg">
        {/* Free member */}
        <div className="p-6 sm:p-7 flex flex-col gap-3.5 border-b sm:border-b-0 sm:border-r border-border">
          <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-fg-3">Member</div>
          <h3 className="text-[24px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Free</h3>
          <div className="font-mono text-[12px] text-fg-3">Pay only when you book</div>
          <ul className="flex flex-col gap-1.5 list-none p-0 mt-3">
            {["Unlimited bookings", "QR check-in & streaks", "Workout & meal logs", "5% platform fee at checkout"].map((b) => (
              <li key={b} className="text-[12.5px] text-fg-2 pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-px before:bg-fg-3">{b}</li>
            ))}
          </ul>
          <Link href="/login?mode=signup" className="btn-ghost-v2 md mt-auto self-start">Create account</Link>
        </div>

        {/* Premium */}
        <div className="p-6 sm:p-7 flex flex-col gap-3.5 border-b sm:border-b-0 sm:border-r border-border relative" style={{ background: "var(--bg-2)" }}>
          <span className="absolute font-mono text-[10.5px] uppercase tracking-[0.05em] inline-flex items-center gap-1.25 rounded-full" style={{ top: "-10px", left: "24px", padding: "4px 10px", background: "var(--ink)", color: "var(--bg)" }}>
            <span className="w-1.25 h-1.25 rounded-full" style={{ background: "var(--signal)" }} />
            {isAnnual ? "Save 2 months" : "Coming Aug 2026"}
          </span>
          <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-fg-3">Premium</div>
          <h3 className="text-[24px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            {premiumPrice} <span className="font-mono text-[13px] text-fg-3 font-normal">{priceSub}</span>
          </h3>
          <div className="font-mono text-[12px] text-fg-3">0% platform fee on all bookings</div>
          <ul className="flex flex-col gap-1.5 list-none p-0 mt-3">
            {["Zero platform fee", "Priority booking on full classes", "Early access to new providers", "Priority support · 1h SLA"].map((b) => (
              <li key={b} className="text-[12.5px] text-fg-2 pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-px before:bg-fg-3">{b}</li>
            ))}
          </ul>
          <Link href="/login?mode=signup" className="btn-signal-v2 mt-auto self-start" style={{ height: "34px", padding: "0 14px" }}>Join the waitlist</Link>
        </div>

        {/* Family */}
        <div className="p-6 sm:p-7 flex flex-col gap-3.5" style={{ background: "var(--ink)" }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "oklch(0.78 0.005 85)" }}>Family</div>
          <h3 className="text-[24px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: "var(--bg)" }}>
            {familyPrice} <span className="font-mono text-[13px] font-normal" style={{ color: "oklch(0.78 0.005 85)" }}>{priceSub}</span>
          </h3>
          <div className="font-mono text-[12px]" style={{ color: "oklch(0.78 0.005 85)" }}>Up to 5 family members</div>
          <ul className="flex flex-col gap-1.5 list-none p-0 mt-3">
            {["Single billing for the family", "Youth profiles with guardian controls", "Joint training plans", "Shared streak leaderboard"].map((b) => (
              <li key={b} className="text-[12.5px] pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-px" style={{ color: "oklch(0.78 0.005 85)" }}>{b}</li>
            ))}
          </ul>
          <Link href="/login?mode=signup" className="btn-ghost-v2 md mt-auto self-start" style={{ background: "var(--bg)", color: "var(--ink)", borderColor: "var(--bg)" }}>Join waitlist</Link>
        </div>
      </div>
    </div>
  );
}
