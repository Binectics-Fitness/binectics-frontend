"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, PageHeader } from "@/components/ds";
import { progressService, type WorkoutPlan } from "@/lib/api/progress";
import { ClientExerciseList } from "@/components/workouts/ClientExerciseList";
import { authorName, planExerciseRows } from "@/lib/workouts/clientRows";

export default function MemberWorkoutPlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await progressService.getMyWorkoutPlanById(planId);
      if (!active) return;
      if (res.success && res.data) {
        setPlan(res.data);
        setError(null);
      } else {
        setError(res.message || "We couldn't load this workout.");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [planId]);

  const by = plan ? authorName(plan) : null;
  return (
    <MemberDashboardShell activeLabel="Workouts">
      <Link
        href="/dashboard/member/workouts"
        className="text-[12.5px] inline-flex items-center gap-1.5 mb-2"
        style={{ color: "var(--fg-3)" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        All workouts
      </Link>

      {loading ? (
        <AsyncSpinner size="page" label="Loading workout" />
      ) : error || !plan ? (
        <div
          className="rounded-(--r-3) p-4 text-[13px]"
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}
        >
          {error ?? "Workout not found."}
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl">
          <PageHeader
            className="mb-0!"
            title={plan.title}
            subtitle={[plan.description, by && `From ${by}`].filter(Boolean).join(" · ") || undefined}
          />
          {plan.exercises?.length ? (
            <ClientExerciseList exercises={planExerciseRows(plan.exercises)} />
          ) : (
            <p className="text-[14px]" style={{ color: "var(--fg-2)" }}>
              Your provider hasn&apos;t added exercises to this workout yet.
            </p>
          )}
          {plan.trainer_notes && (
            <div className="rounded-(--r-3) p-4" style={{ background: "var(--bg-2)" }}>
              <div className="text-[13px] font-medium" style={{ color: "var(--fg-2)" }}>
                {by ? `Notes from ${by.split(" ")[0]}` : "Notes from your provider"}
              </div>
              <p className="mt-1 text-[14px]" style={{ color: "var(--fg-2)" }}>
                {plan.trainer_notes}
              </p>
            </div>
          )}
        </div>
      )}
    </MemberDashboardShell>
  );
}
