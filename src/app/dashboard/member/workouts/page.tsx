"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, EmptySlate, PageHeader } from "@/components/ds";
import { progressService, type WorkoutPlan } from "@/lib/api/progress";
import { myProgramsService, type ProgramWorkoutSession } from "@/lib/api/myPrograms";
import { ClientExerciseList } from "@/components/workouts/ClientExerciseList";
import { authorName, sessionExerciseRows } from "@/lib/workouts/clientRows";

function dayLabel(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export default function MemberWorkoutsPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [sessions, setSessions] = useState<ProgramWorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [planRes, progRes] = await Promise.all([
        progressService.getMyWorkoutPlans(),
        myProgramsService.listMine(),
      ]);
      if (!active) return;
      if (planRes.success && planRes.data) setPlans(planRes.data);
      else setError(planRes.message || "We couldn't load your workouts. Try again shortly.");
      // A program's workout sessions are best effort: a failure here never hides the plans.
      const live = (progRes.success && progRes.data ? progRes.data : []).filter((p) => p.status === "active");
      const lists = await Promise.all(live.map((p) => myProgramsService.inlineWorkouts(p._id, p.name)));
      if (!active) return;
      const all = lists.flatMap((r) => (r.success && r.data ? r.data : []));
      setSessions(all.filter((s) => s.status === "pending" || s.status === "scheduled"));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <MemberDashboardShell activeLabel="Workouts">
      <PageHeader
        title="Workouts"
        subtitle="Workouts your trainer or coach assigned. Tick them off in the Binectics app."
      />

      {error && (
        <div
          className="rounded-(--r-3) p-4 text-[13px]"
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <AsyncSpinner size="page" label="Loading workouts" />
      ) : !error && plans.length === 0 && sessions.length === 0 ? (
        <EmptySlate
          message="No workouts yet."
          hint="When a trainer or coach assigns you a workout, it shows up here."
          mt="mt-2"
        />
      ) : !error ? (
        <div className="flex flex-col gap-8 max-w-2xl">
          {plans.length > 0 && (
            <section aria-labelledby="plans-h" className="flex flex-col gap-3">
              <h2 id="plans-h" className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>
                Workout plans
              </h2>
              {plans.map((plan) => {
                const by = authorName(plan);
                return (
                  <Link
                    key={plan._id}
                    href={`/dashboard/member/workouts/${plan._id}`}
                    className="rounded-(--r-3) px-5 py-4 flex flex-col gap-1.5"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                  >
                    <div className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>
                      {plan.title}
                    </div>
                    <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                      {by ? `From ${by}` : "From your provider"} · {plan.exercises?.length ?? 0} exercise
                      {(plan.exercises?.length ?? 0) === 1 ? "" : "s"}
                    </div>
                  </Link>
                );
              })}
            </section>
          )}

          {sessions.length > 0 && (
            <section aria-labelledby="sessions-h" className="flex flex-col gap-6">
              <h2 id="sessions-h" className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>
                Program workouts
              </h2>
              {sessions.map((s) => (
                <div key={s.id} className="flex flex-col gap-3">
                  <div>
                    <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                      {s.title}
                    </div>
                    <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                      {s.programName}
                      {dayLabel(s.scheduledFor) ? ` · ${dayLabel(s.scheduledFor)}` : ""}
                    </div>
                  </div>
                  <ClientExerciseList exercises={sessionExerciseRows(s.exercises)} />
                </div>
              ))}
            </section>
          )}
        </div>
      ) : null}
    </MemberDashboardShell>
  );
}
