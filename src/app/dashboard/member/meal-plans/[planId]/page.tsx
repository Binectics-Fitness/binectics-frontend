"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner } from "@/components/ds";
import { toast } from "@/components/Toast";
import { progressService, type DietPlan, type DayOfWeek, type DietMeal } from "@/lib/api/progress";
import { DietPlanDeliveryType } from "@/lib/types";
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  SLOT_LABELS,
  mealsForWeekday,
  isWeeklyPlan,
  todayWeekday,
} from "@/lib/progress/weeklyPlan";

type Weekday = Exclude<DayOfWeek, "every_day">;

function MealCard({ meal }: { meal: DietMeal }) {
  return (
    <div className="rounded-(--r-2) px-4 py-3 flex flex-col gap-1" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
          {SLOT_LABELS[meal.meal_type]}
        </span>
        {meal.calories != null && (
          <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
            {meal.calories.toLocaleString()} kcal
          </span>
        )}
      </div>
      <div className="text-[14.5px] font-medium" style={{ color: "var(--ink)" }}>{meal.title}</div>
      {meal.description && (
        <div className="text-[12.5px]" style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>{meal.description}</div>
      )}
      {meal.foods.length > 0 && (
        <div className="text-[12.5px]" style={{ color: "var(--fg-2)", lineHeight: 1.6 }}>
          {meal.foods.join(" · ")}
        </div>
      )}
      {meal.notes && (
        <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)", lineHeight: 1.5 }}>{meal.notes}</div>
      )}
    </div>
  );
}

export default function MemberMealPlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = use(params);
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<Weekday>(todayWeekday());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await progressService.getMyDietPlanById(planId);
      if (!active) return;
      if (res.success && res.data) {
        setPlan(res.data);
        setError(null);
        // View telemetry, fire-and-forget: never block or fail the page.
        void progressService.markMyDietPlanViewed(planId).catch(() => {});
      } else {
        setError(res.message || "We couldn't load this meal plan.");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [planId]);

  const handleDownload = async () => {
    setDownloading(true);
    const res = await progressService.getMyDietPlanDocumentAccess(planId);
    setDownloading(false);
    if (res.success && res.data) {
      window.open(res.data.view_url, "_blank", "noopener");
    } else {
      toast.error(res.message ?? "Could not open the plan document.");
    }
  };

  const isDocument = plan?.delivery_type === DietPlanDeliveryType.DOCUMENT;
  const weekly = plan ? isWeeklyPlan(plan) : false;
  const dayMeals = plan && !isDocument ? mealsForWeekday(plan, day) : [];

  return (
    <MemberDashboardShell activeLabel="Meal plans">
      <Link href="/dashboard/member/meal-plans" className="text-[12.5px] inline-flex items-center gap-1.5 mb-2" style={{ color: "var(--fg-3)" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        All meal plans
      </Link>

      {loading ? (
        <AsyncSpinner size="page" label="Loading meal plan" />
      ) : error || !plan ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error ?? "Meal plan not found."}
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl">
          <div>
            <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>{plan.title}</h1>
            {plan.description && (
              <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>{plan.description}</p>
            )}
          </div>

          {isDocument ? (
            <div className="rounded-(--r-3) p-5 flex flex-col gap-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="text-[13.5px]" style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>
                This plan is a document{plan.document_file_name ? ` (${plan.document_file_name})` : ""}. Open it to see your meals.
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="h-9 px-5 self-start rounded-(--r-2) text-[13px] font-medium disabled:opacity-50"
                style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
              >
                {downloading ? "Opening..." : "Open plan"}
              </button>
            </div>
          ) : (
            <>
              {/* Day selector: the week ahead, today pre-selected. */}
              <div className="flex gap-1 flex-wrap">
                {WEEKDAYS.map((d) => {
                  const active = day === d;
                  const isToday = d === todayWeekday();
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDay(d)}
                      className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
                      style={{
                        background: active ? "var(--ink)" : "var(--bg)",
                        color: active ? "var(--bg)" : "var(--fg-3)",
                        border: active ? "1px solid var(--ink)" : "1px solid var(--border)",
                      }}
                    >
                      {WEEKDAY_LABELS[d].slice(0, 3)}
                      {isToday && !active && <span style={{ marginLeft: 4, color: "var(--signal-ink)" }}>·</span>}
                    </button>
                  );
                })}
              </div>

              {!weekly && (
                <div className="text-[12.5px]" style={{ color: "var(--fg-3)", lineHeight: 1.5 }}>
                  This plan is the same every day.
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                  {WEEKDAY_LABELS[day]}{day === todayWeekday() ? " · today" : ""}
                </div>
                {dayMeals.length === 0 ? (
                  <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                    No meals planned for this day.
                  </div>
                ) : (
                  dayMeals.map((meal, i) => <MealCard key={meal._id ?? i} meal={meal} />)
                )}
              </div>

              {plan.dietitian_notes && (
                <div className="rounded-(--r-2) px-4 py-3" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.05em] mb-1" style={{ color: "var(--fg-3)" }}>
                    From your dietitian
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--fg-2)", lineHeight: 1.6 }}>{plan.dietitian_notes}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </MemberDashboardShell>
  );
}
