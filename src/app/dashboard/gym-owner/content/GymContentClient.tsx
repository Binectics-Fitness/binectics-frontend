"use client";

import { useEffect, useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { ContentPricingModal } from "@/components/content/ContentPricingModal";
import { AsyncSpinner, DSCard, Eyebrow, ListRow, PageHeader } from "@/components/ds";
import { usePaidContentSeller } from "@/hooks/usePaidContentSeller";
import { programsService, type ProgramTemplate } from "@/lib/api/programs";
import { progressService, type DietPlan } from "@/lib/api/progress";
import { accessToRaw, normalizeAccess } from "@/lib/api/paidContent";
import { accessSummary, isPaid } from "@/lib/paidContent/helpers";
import { DietPlanDeliveryType } from "@/lib/types";

export const GYM_CONTENT_COPY = {
  title: "Programs & meal plans",
  subtitle: "Set each one free or paid. Sales and refunds are under Revenue.",
  empty: "Publish a program or meal plan to price it here.",
  off: "Selling programs and meal plans is not available yet.",
  noPrice: "Only the gym's owner and roles that manage the listing can set prices.",
} as const;

/** Published programs: only those can be priced (a draft can't be charged for). */
export function priceablePrograms(rows: readonly ProgramTemplate[], sellingOn: boolean): ProgramTemplate[] {
  return rows.filter((p) => p.status === "published" && (sellingOn || isPaid(normalizeAccess(p.access))));
}

/** Library meal plans in the platform format (client copies and PDFs can't be sold, D13). */
export function priceableMealPlans(rows: readonly DietPlan[], sellingOn: boolean): DietPlan[] {
  return rows.filter(
    (m) =>
      m.client_profile_id == null &&
      m.client_id == null &&
      m.delivery_type === DietPlanDeliveryType.PLATFORM &&
      String(m.status) !== "archived" &&
      (sellingOn || isPaid(normalizeAccess(m.access))),
  );
}

type Pricing = { kind: "program"; item: ProgramTemplate } | { kind: "meal_plan"; item: DietPlan };

/**
 * Pricing for the gym's programs and library meal plans (paid-content ruling
 * D10: the gym's owner and roles holding marketplace:manage_listing price
 * gym items; a staff trainer may author but not price). Each row opens the
 * same ContentPricingModal the trainer and dietitian pages use. With selling
 * switched off, only items already paid are listed, so they can be set back
 * to free. Mirrors mobile GymContentScreen.
 */
export function GymContentClient() {
  const { on: sellingOn, flagsLoading, canPrice } = usePaidContentSeller();
  const [programs, setPrograms] = useState<ProgramTemplate[] | null>(null);
  const [mealPlans, setMealPlans] = useState<DietPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pricing, setPricing] = useState<Pricing | null>(null);

  useEffect(() => {
    let live = true;
    void Promise.all([programsService.listTemplates(false), progressService.getProviderDietPlans(100)]).then(
      ([p, m]) => {
        if (!live) return;
        if (!p.success || !p.data) {
          setError(p.message || "Check your connection and try again.");
          return;
        }
        setError(null);
        setPrograms(p.data);
        // A workspace without meal plans may be refused the list: that's none, not a failure.
        setMealPlans(m.success && m.data ? m.data : []);
      },
    );
    return () => {
      live = false;
    };
  }, [attempt]);

  const shownPrograms = programs ? priceablePrograms(programs, sellingOn) : [];
  const shownMeals = priceableMealPlans(mealPlans, sellingOn);

  const saved = (raw: Record<string, unknown> | undefined) => {
    if (!pricing) return;
    const id = pricing.item._id;
    if (pricing.kind === "program") {
      setPrograms((list) => (list ?? []).map((x) => (x._id === id ? { ...x, access: raw } : x)));
      setPricing({ kind: "program", item: { ...pricing.item, access: raw } });
    } else {
      setMealPlans((list) => list.map((x) => (x._id === id ? { ...x, access: raw } : x)));
      setPricing({ kind: "meal_plan", item: { ...pricing.item, access: raw } });
    }
  };

  const body = () => {
    if (programs === null || flagsLoading) {
      return error ? (
        <DSCard className="p-5.5 flex flex-col gap-3 items-start">
          <p role="alert" className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
            Couldn&apos;t load these. {error}
          </p>
          <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </DSCard>
      ) : (
        <AsyncSpinner size="page" label="Loading programs and meal plans" />
      );
    }
    if (!canPrice) {
      return (
        <p role="status" className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
          {GYM_CONTENT_COPY.noPrice}
        </p>
      );
    }
    if (shownPrograms.length + shownMeals.length === 0) {
      return (
        <DSCard className="flex flex-col items-center text-center px-6 py-14">
          <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
            Nothing to price yet
          </h2>
          <p className="text-[13.5px] mt-2 max-w-[420px]" style={{ color: "var(--fg-3)" }}>
            {sellingOn ? GYM_CONTENT_COPY.empty : GYM_CONTENT_COPY.off}
          </p>
        </DSCard>
      );
    }
    return (
      <>
        {shownPrograms.length > 0 && (
          <section aria-labelledby="gym-content-programs" className="flex flex-col gap-2">
            <Eyebrow as="h2" id="gym-content-programs">
              Programs
            </Eyebrow>
            <ul className="flex flex-col gap-2">
              {shownPrograms.map((p) => (
                <li key={p._id}>
                  <ListRow
                    title={p.name}
                    meta={accessSummary(normalizeAccess(p.access))}
                    onClick={() => setPricing({ kind: "program", item: p })}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        {shownMeals.length > 0 && (
          <section aria-labelledby="gym-content-meals" className="flex flex-col gap-2">
            <Eyebrow as="h2" id="gym-content-meals">
              Meal plans
            </Eyebrow>
            <ul className="flex flex-col gap-2">
              {shownMeals.map((m) => (
                <li key={m._id}>
                  <ListRow
                    title={m.title}
                    meta={accessSummary(normalizeAccess(m.access))}
                    onClick={() => setPricing({ kind: "meal_plan", item: m })}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </>
    );
  };

  return (
    <GymDashboardShell activeItem={GYM_CONTENT_COPY.title} crumb={GYM_CONTENT_COPY.title}>
      <PageHeader
        className="mb-0!"
        title={GYM_CONTENT_COPY.title}
        subtitle={<span className="block max-w-[60ch]">{GYM_CONTENT_COPY.subtitle}</span>}
      />
      {body()}
      {pricing && (
        <ContentPricingModal
          open
          onClose={() => setPricing(null)}
          kind={pricing.kind}
          itemId={pricing.item._id}
          title={pricing.kind === "program" ? pricing.item.name : pricing.item.title}
          rawAccess={pricing.item.access}
          needsPublish={pricing.kind === "program" && pricing.item.latest_published_version_no < 1}
          onSaved={(access) => saved(accessToRaw(access))}
        />
      )}
    </GymDashboardShell>
  );
}
