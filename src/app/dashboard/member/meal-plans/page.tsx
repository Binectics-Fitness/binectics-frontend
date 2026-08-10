"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { progressService, type DietPlan } from "@/lib/api/progress";
import { DietPlanDeliveryType } from "@/lib/types";
import { isWeeklyPlan, planDays } from "@/lib/progress/weeklyPlan";

function providerName(plan: DietPlan): string | null {
  if (typeof plan.created_by === "object" && plan.created_by !== null) {
    return `${plan.created_by.first_name} ${plan.created_by.last_name}`.trim();
  }
  return null;
}

function mealCount(plan: DietPlan): number {
  return planDays(plan).reduce((n, d) => n + d.meals.length, 0);
}

export default function MemberMealPlansPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await progressService.getMyDietPlans();
      if (!active) return;
      if (res.success && res.data) {
        setPlans(res.data);
        setError(null);
      } else {
        setError(res.message || "We couldn't load your meal plans. Try again shortly.");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <MemberDashboardShell activeLabel="Meal plans">
      <div className="mb-1">
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Meal plans
        </h1>
        <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
          Plans from your dietitian. Open one to see the week ahead and plan your shopping.
        </p>
      </div>

      {error && (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <AsyncSpinner size="page" label="Loading meal plans" />
      ) : !error && plans.length === 0 ? (
        <EmptySlate
          message="No meal plans yet."
          hint="When your dietitian assigns you a plan, it shows up here."
          mt="mt-2"
        />
      ) : !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isDocument = plan.delivery_type === DietPlanDeliveryType.DOCUMENT;
            const provider = providerName(plan);
            return (
              <Link
                key={plan._id}
                href={`/dashboard/member/meal-plans/${plan._id}`}
                className="rounded-(--r-3) px-5 py-4 flex flex-col gap-1.5"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {isDocument ? (
                    <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--bg-3)", color: "var(--fg-3)" }}>
                      Document
                    </span>
                  ) : isWeeklyPlan(plan) ? (
                    <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--signal-soft, var(--bg-3))", color: "var(--signal-ink)" }}>
                      Weekly plan
                    </span>
                  ) : null}
                </div>
                <div className="text-[16px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
                  {plan.title}
                </div>
                <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                  {provider ? `From ${provider}` : "From your dietitian"}
                  {!isDocument && ` · ${mealCount(plan)} meal${mealCount(plan) === 1 ? "" : "s"}`}
                </div>
                {plan.description && (
                  <div className="text-[13px] line-clamp-2" style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>
                    {plan.description}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : null}
    </MemberDashboardShell>
  );
}
