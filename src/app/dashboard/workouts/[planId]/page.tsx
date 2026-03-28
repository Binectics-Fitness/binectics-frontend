"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole, PlanStatus, DifficultyLevel } from "@/lib/types";
import { progressService } from "@/lib/api/progress";
import type { WorkoutPlan } from "@/lib/api/progress";

const difficultyColors: Record<string, string> = {
  [DifficultyLevel.BEGINNER]: "bg-green-100 text-green-700",
  [DifficultyLevel.INTERMEDIATE]: "bg-yellow-100 text-yellow-700",
  [DifficultyLevel.ADVANCED]: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  [PlanStatus.ACTIVE]: "bg-green-100 text-green-700",
  [PlanStatus.INACTIVE]: "bg-neutral-100 text-neutral-600",
  [PlanStatus.ARCHIVED]: "bg-red-100 text-red-600",
};

export default function UserWorkoutPlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.planId as string;

  const { isLoading, isAuthorized } = useRoleGuard(UserRole.USER);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [error, setError] = useState("");

  const loadPlan = useCallback(async () => {
    if (!planId) return;
    setLoadingPlan(true);
    try {
      const res = await progressService.getMyWorkoutPlanById(planId);
      if (res.success && res.data) {
        setPlan(res.data);
      } else {
        setError(res.message || "Workout plan not found");
      }
    } catch {
      setError("Failed to load workout plan");
    }
    setLoadingPlan(false);
  }, [planId]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadPlan();
  }, [isAuthorized, loadPlan]);

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const trainerName =
    plan && typeof plan.professional_id === "object"
      ? `${plan.professional_id.first_name} ${plan.professional_id.last_name}`
      : "Trainer";

  const sortedExercises = plan
    ? [...plan.exercises].sort((a, b) => a.order - b.order)
    : [];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Workouts
        </button>

        {error && (
          <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loadingPlan ? (
          <DashboardLoading />
        ) : !plan ? (
          <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-card)] text-center">
            <p className="text-foreground-secondary">Workout plan not found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
                    {plan.title}
                  </h1>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    Assigned by {trainerName} ·{" "}
                    {new Date(plan.assigned_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      statusColors[plan.status] ??
                      "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {plan.status}
                  </span>
                  {plan.difficulty_level && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        difficultyColors[plan.difficulty_level] ??
                        "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {plan.difficulty_level}
                    </span>
                  )}
                </div>
              </div>
              {plan.description && (
                <p className="mt-3 text-sm text-foreground-secondary whitespace-pre-wrap">
                  {plan.description}
                </p>
              )}
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-500">Exercises</p>
                <p className="text-lg font-bold text-foreground">
                  {plan.exercises.length}
                </p>
              </div>
              {plan.frequency && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs text-neutral-500">Frequency</p>
                  <p className="text-lg font-bold text-foreground">
                    {plan.frequency}
                  </p>
                </div>
              )}
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-500">Version</p>
                <p className="text-lg font-bold text-foreground">
                  v{plan.version}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-500">Updated</p>
                <p className="text-sm font-bold text-foreground">
                  {new Date(plan.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Trainer Notes */}
            {plan.trainer_notes && (
              <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <h2 className="text-lg font-bold text-foreground mb-2">
                  Trainer Notes
                </h2>
                <p className="text-sm text-foreground-secondary whitespace-pre-wrap">
                  {plan.trainer_notes}
                </p>
              </div>
            )}

            {/* Exercises */}
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Exercises
              </h2>
              {sortedExercises.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No exercises in this plan.
                </p>
              ) : (
                <div className="space-y-4">
                  {sortedExercises.map((ex, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-blue-500 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-foreground">
                            {ex.name}
                          </h3>
                          {ex.description && (
                            <p className="mt-1 text-sm text-neutral-500">
                              {ex.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                            {ex.sets != null && (
                              <span className="rounded bg-white px-2 py-1 border border-neutral-200">
                                {ex.sets} sets
                              </span>
                            )}
                            {ex.reps != null && (
                              <span className="rounded bg-white px-2 py-1 border border-neutral-200">
                                {ex.reps} reps
                              </span>
                            )}
                            {ex.duration_minutes != null && (
                              <span className="rounded bg-white px-2 py-1 border border-neutral-200">
                                {ex.duration_minutes} min
                              </span>
                            )}
                            {ex.rest_seconds != null && (
                              <span className="rounded bg-white px-2 py-1 border border-neutral-200">
                                {ex.rest_seconds}s rest
                              </span>
                            )}
                          </div>
                          {ex.notes && (
                            <p className="mt-2 text-xs text-neutral-400 italic">
                              {ex.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
