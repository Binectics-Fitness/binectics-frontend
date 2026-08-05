"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRegion } from "@/contexts/RegionContext";
import { type BillingPeriod } from "@/lib/constants/regions";
import { TogglePill } from "@/components/ds/TogglePill";
import { providerBillingApi, type ProviderPlanOption } from "@/lib/api/providerBilling";
import { toPlanCards } from "@/lib/pricing/providerPlanView";
import type { PlanCardPlan } from "@/components/ds/PlanCard";

const bulletClass =
  "text-[12.5px] pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-px";

function ProviderColumn({ card }: { card: PlanCardPlan }) {
  const ctaHref = card.ink ? "/contact" : "/login?mode=signup";

  // Visual treatment mirrors the plan's role: free = plain, pro = highlighted,
  // enterprise = inverted (ink).
  const containerStyle = card.ink
    ? { background: "var(--ink)" }
    : card.featured
      ? { background: "var(--bg-2)" }
      : undefined;
  const containerClass = card.ink
    ? "p-6 sm:p-8 flex flex-col gap-3.5"
    : "p-6 sm:p-8 flex flex-col gap-3.5 border-b sm:border-b-0 sm:border-r border-border" +
      (card.featured ? " relative" : "");

  const mutedColor = card.ink ? "oklch(0.78 0.005 85)" : undefined;
  const inkColor = card.ink ? "var(--bg)" : "var(--ink)";

  return (
    <div className={containerClass} style={containerStyle}>
      {card.featured && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-fg-3">{card.name}</span>
          <span className="inline-flex items-center gap-1.25 h-4.5 px-2 rounded-(--r-1) text-[11px] font-medium bg-signal-soft text-signal-ink border border-[oklch(0.88_0.05_148)]">Recommended</span>
        </div>
      )}
      {!card.featured && (
        <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: card.ink ? mutedColor : "var(--fg-3)" }}>{card.name}</div>
      )}
      <h3 className="text-[24px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: inkColor }}>
        {card.price}
        {card.priceSub && <span className="font-mono text-[13px] font-normal" style={{ color: card.ink ? mutedColor : "var(--fg-3)" }}> {card.priceSub}</span>}
      </h3>
      <div className="font-mono text-[12px]" style={{ color: card.ink ? mutedColor : "var(--fg-3)" }}>{card.tagline}</div>
      <ul className="flex flex-col gap-1.5 list-none p-0 mt-3">
        {card.features.map((b) => (
          <li key={b} className={bulletClass + (card.ink ? "" : " text-fg-2 before:bg-fg-3")} style={card.ink ? { color: mutedColor } : undefined}>{b}</li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={(card.featured ? "btn-signal-v2" : "btn-ghost-v2 md") + " mt-auto w-full sm:w-auto sm:self-start min-h-11 justify-center"}
        style={
          card.featured
            ? { height: "34px", padding: "0 14px" }
            : card.ink
              ? { background: "var(--bg)", color: "var(--ink)", borderColor: "var(--bg)" }
              : undefined
        }
      >
        {card.cta}
      </Link>
    </div>
  );
}

export default function LandingPricing() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const { country, locale } = useRegion();
  const isAnnual = period === "annual";

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

  const providerCards = providerPlans ? toPlanCards(providerPlans, isAnnual ? "year" : "month", locale) : [];

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <TogglePill
          label="Billed"
          options={[{ value: "monthly" as const, label: "Monthly" }, { value: "annual" as const, label: "Annual" }]}
          value={period}
          onChange={setPeriod}
        />
        {isAnnual && (
          <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--signal-ink)" }}>Save ~17%</span>
        )}
      </div>

      {/* Provider plans */}
      {providerPlans === null && !plansError ? (
        <div className="border border-border rounded-(--r-3) bg-bg mt-3 sm:min-h-[420px] flex items-center justify-center py-16 font-mono text-[12px] uppercase tracking-[0.05em] text-fg-3">Loading plans…</div>
      ) : providerCards.length === 0 ? (
        <div className="border border-border rounded-(--r-3) bg-bg mt-3 py-12 px-6 text-center text-[13.5px] text-fg-2">
          We couldn&apos;t load live pricing right now. See the <Link href="/pricing" className="underline underline-offset-2">pricing page</Link> to try again.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-(--r-3) bg-bg mt-3 sm:min-h-[420px]">
          {providerCards.map((card) => (
            <ProviderColumn key={card.name} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
