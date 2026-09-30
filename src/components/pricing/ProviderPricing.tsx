"use client";

import { useState } from "react";
import Link from "next/link";
import { TogglePill } from "@/components/ds/TogglePill";
import { PlanCard, type PlanCardPlan } from "@/components/ds/PlanCard";
import { useRegion } from "@/contexts/RegionContext";
import { useCurrencyList } from "@/lib/queries/currencies";
import { usePublicPlans } from "@/lib/queries/pricing";
import type {
  BillingInterval,
  PlanAudience,
  PublicProviderPlanOption,
} from "@/lib/api/providerBilling";
import type { PlatformCurrency } from "@/lib/api/currencies";
import {
  FEATURE_LABELS,
  LIMIT_LABELS,
  PROVIDER_AUDIENCES,
  hasYearlyPrices,
  planFeatureLines,
  planPriceView,
  yearlySavingPercent,
} from "@/lib/pricing/publicPlans";

/**
 * Provider plans, straight from the public catalogue
 * (GET /provider-billing/plans) for the visitor's country and the provider
 * type they pick. Prices render in the currency the API returned them in; a
 * price the platform can't charge shows the API's reason instead. While the
 * catalogue loads, or if it fails, the section says so and points to the
 * dashboard rather than showing a made-up number.
 */
export function ProviderPricing({ compare = false }: { compare?: boolean }) {
  const [audience, setAudience] = useState<Exclude<PlanAudience, "ALL">>(PROVIDER_AUDIENCES[0].value);
  const [interval, setBillingInterval] = useState<BillingInterval>("month");
  const { country, isDetected } = useRegion();
  const { data: list } = useCurrencyList();
  const plans = usePublicPlans(country, audience, isDetected);

  const rows = plans.data ?? [];
  const yearly = hasYearlyPrices(rows);
  const shownInterval: BillingInterval = yearly ? interval : "month";

  return (
    <div>
      <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6">
        <TogglePill
          label="For"
          options={PROVIDER_AUDIENCES.map((a) => ({ value: a.value, label: a.label }))}
          value={audience}
          onChange={setAudience}
        />
        {yearly && (
          <TogglePill
            label="Billed"
            options={[
              { value: "month" as const, label: "Monthly" },
              { value: "year" as const, label: "Yearly" },
            ]}
            value={shownInterval}
            onChange={setBillingInterval}
          />
        )}
      </div>

      {plans.isPending ? (
        <PlansSkeleton />
      ) : plans.isError || rows.length === 0 ? (
        <PlansFallback />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-8 sm:pt-10">
            {toCards(rows, shownInterval, list).map((p) => (
              <PlanCard key={p.name} plan={p} />
            ))}
          </div>
          {rows[0]?.currency && (
            <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-center mt-4" style={{ color: "var(--fg-3)" }}>
              Prices in {rows[0].currency}
            </p>
          )}
          {compare && <PlanComparison plans={rows} interval={shownInterval} list={list} />}
        </>
      )}
    </div>
  );
}

/** Plan cards from catalogue rows. Exported for tests. */
export function toCards(
  plans: readonly PublicProviderPlanOption[],
  interval: BillingInterval,
  list?: readonly PlatformCurrency[] | null,
): PlanCardPlan[] {
  const firstPaid = plans.find(
    (p) => p.is_self_serve && ((p.prices.month?.amount_minor ?? 0) > 0 || (p.prices.year?.amount_minor ?? 0) > 0),
  );
  return plans.map((plan) => {
    const view = planPriceView(plan, interval, list);
    const custom = !plan.is_self_serve;
    const free = view.price === "Free";
    const saving = view.interval === "year" ? yearlySavingPercent(plan) : null;
    return {
      name: plan.name,
      meta: custom ? "Talk to us" : free ? "Start here" : "Self-serve",
      price: view.price,
      priceSub: view.priceSub,
      text: view.text,
      tagline: plan.description,
      cta: custom ? "Talk to us" : free ? "Start free" : `Choose ${plan.name}`,
      href: custom ? "/contact" : "/login?mode=signup",
      ghost: free,
      featured: plan === firstPaid,
      ink: custom,
      badge: saving ? `Save ${saving}%` : plan === firstPaid ? "Recommended" : undefined,
      divider: "Includes",
      features: planFeatureLines(plan),
    };
  });
}

function PlansSkeleton() {
  return (
    <div aria-busy="true" className="pt-8 sm:pt-10">
      <p className="sr-only">Prices are loading</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-(--r-3) flex flex-col gap-4 animate-pulse"
            style={{ padding: "28px", border: "1px solid var(--border)", background: "var(--bg)", minHeight: "320px" }}
          >
            <div className="h-4 w-24 rounded-(--r-1)" style={{ background: "var(--bg-3)" }} />
            <div className="h-10 w-40 rounded-(--r-1)" style={{ background: "var(--bg-3)" }} />
            <div className="h-3 w-full rounded-(--r-1)" style={{ background: "var(--bg-2)" }} />
            <div className="h-3 w-3/4 rounded-(--r-1)" style={{ background: "var(--bg-2)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlansFallback() {
  return (
    <div
      className="rounded-(--r-3) mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"
      style={{ padding: "24px", border: "1px solid var(--border)", background: "var(--bg-2)" }}
    >
      <div>
        <div className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Prices are loading</div>
        <p className="text-[14px] leading-[1.55] mt-1 max-w-[52ch]" style={{ color: "var(--fg-2)" }}>
          We couldn&apos;t show plans just now. Every plan and its price, in your currency, is in your dashboard once you sign up. Starting is free.
        </p>
      </div>
      <Link href="/login?mode=signup" className="btn-ghost-v2 md min-h-11 justify-center shrink-0">
        See plans in your dashboard
      </Link>
    </div>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Included">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

/** Side-by-side limits and features, one column per catalogue plan. */
function PlanComparison({
  plans,
  interval,
  list,
}: {
  plans: readonly PublicProviderPlanOption[];
  interval: BillingInterval;
  list?: readonly PlatformCurrency[] | null;
}) {
  const cols = `minmax(160px,1.6fr) repeat(${plans.length}, minmax(110px,1fr))`;
  const minWidth = `${160 + plans.length * 130}px`;
  const cell = { borderRight: "1px solid var(--border)" } as const;
  return (
    <div className="mt-12 sm:mt-16">
      <h2 className="text-[32px] sm:text-[40px] font-medium leading-none max-w-[14ch]" style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}>
        The whole table.
      </h2>
      <p className="text-[15.5px] max-w-[56ch] leading-[1.55] mt-4" style={{ color: "var(--fg-2)" }}>
        The same data lives in your dashboard once you&apos;ve signed up.
      </p>
      <div className="rounded-(--r-3) overflow-x-auto mt-8" style={{ border: "1px solid var(--border)" }}>
        <div className="grid" style={{ gridTemplateColumns: cols, borderBottom: "1px solid var(--border)", background: "var(--bg-2)", minWidth }}>
          <div className="py-4.5 px-5" style={cell}>
            <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Plan</div>
          </div>
          {plans.map((p) => {
            const v = planPriceView(p, interval, list);
            return (
              <div key={p.code} className="py-4.5 px-5" style={cell}>
                <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{p.name}</div>
                <div className="font-mono text-[12px] mt-1" style={{ color: "var(--fg-3)" }}>
                  {v.text ? v.price : `${v.price} ${v.priceSub}`}
                </div>
              </div>
            );
          })}
        </div>
        {LIMIT_LABELS.map(({ key, noun }) => (
          <div key={key} className="grid" style={{ gridTemplateColumns: cols, borderBottom: "1px solid var(--border)", minWidth }}>
            <div className="px-5 py-3 text-[13.5px]" style={{ ...cell, color: "var(--fg-2)" }}>{noun.charAt(0).toUpperCase() + noun.slice(1)}</div>
            {plans.map((p) => {
              const v = p.limits?.[key];
              return (
                <div key={p.code} className="px-5 py-3 font-mono text-[13px]" style={{ ...cell, color: "var(--ink)" }}>
                  {v === null || v === undefined ? "Unlimited" : v === 0 ? "-" : v.toLocaleString("en")}
                </div>
              );
            })}
          </div>
        ))}
        {FEATURE_LABELS.filter(({ key }) => plans.some((p) => p.features?.[key] !== undefined)).map(({ key, label }) => (
          <div key={key} className="grid" style={{ gridTemplateColumns: cols, borderBottom: "1px solid var(--border)", minWidth }}>
            <div className="px-5 py-3 text-[13.5px]" style={{ ...cell, color: "var(--fg-2)" }}>{label}</div>
            {plans.map((p) => (
              <div key={p.code} className="px-5 py-3 flex items-center" style={cell}>
                {p.features?.[key] ? <Check /> : <span style={{ color: "var(--fg-4)" }}>-</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
