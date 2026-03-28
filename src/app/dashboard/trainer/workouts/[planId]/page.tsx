"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import TrainerSidebar from "@/components/TrainerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { progressService } from "@/lib/api/progress";
import { UserRole, DifficultyLevel, PlanStatus } from "@/lib/types";
import type { WorkoutPlan } from "@/lib/api/progress";
import { formatLocal } from "@/utils/format";

// ─── Helpers ───────────────────────────────────────────────────────

function formatDate(iso: string) {
  return formatLocal(iso, "MMM d, yyyy");
}

function clientFullName(plan: WorkoutPlan): string {
  if (typeof plan.client_id === "object") {
    return `${plan.client_id.first_name} ${plan.client_id.last_name}`;
  }
  return "Client";
}

function difficultyLabel(level?: DifficultyLevel): string {
  if (!level) return "Not set";
  const labels: Record<DifficultyLevel, string> = {
    [DifficultyLevel.BEGINNER]: "Beginner",
    [DifficultyLevel.INTERMEDIATE]: "Intermediate",
    [DifficultyLevel.ADVANCED]: "Advanced",
  };
  return labels[level] || level;
}

function difficultyColor(level?: DifficultyLevel): string {
  if (!level) return "bg-neutral-100 text-neutral-600";
  const colors: Record<DifficultyLevel, string> = {
    [DifficultyLevel.BEGINNER]: "bg-green-100 text-green-700",
    [DifficultyLevel.INTERMEDIATE]:
      "bg-accent-yellow-100 text-accent-yellow-700",
    [DifficultyLevel.ADVANCED]: "bg-red-100 text-red-700",
  };
  return colors[level] || "bg-neutral-100 text-neutral-600";
}

function statusColor(status: PlanStatus): string {
  const colors: Record<PlanStatus, string> = {
    [PlanStatus.ACTIVE]: "bg-green-100 text-green-700",
    [PlanStatus.INACTIVE]: "bg-neutral-100 text-neutral-600",
    [PlanStatus.ARCHIVED]: "bg-red-100 text-red-600",
  };
  return colors[status] || "bg-neutral-100 text-neutral-600";
}

// ─── Detail Content ────────────────────────────────────────────────

function WorkoutPlanDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const planId = params.planId as string;
  const profileId = searchParams.get("profileId") || "";

  const { isLoading, isAuthorized } = useRoleGuard(UserRole.TRAINER);
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [error, setError] = useState("");

  const orgId = currentOrg?._id;

  const loadPlan = useCallback(async () => {
    if (!profileId || !planId) {
      setError("Missing profile or plan ID");
      setLoadingPlan(false);
      return;
    }
    setError("");
    setLoadingPlan(true);
    try {
      const res = orgId
        ? await progressService.getWorkoutPlansInOrg(orgId, profileId)
        : await progressService.getWorkoutPlans(profileId);
      if (res.success && res.data) {
        const found = res.data.find((p) => p._id === planId);
        if (found) {
          setPlan(found);
        } else {
          // Try getting by ID directly (solo endpoint)
          const single = orgId
            ? null // org endpoint doesn't have getById, use list
            : await progressService.getWorkoutPlanById(profileId, planId);
          if (single?.success && single.data) {
            setPlan(single.data);
          } else {
            setError("Workout plan not found");
          }
        }
      } else {
        setError(res.message || "Failed to load workout plan");
      }
    } catch {
      setError("Failed to load workout plan");
    }
    setLoadingPlan(false);
  }, [profileId, planId, orgId]);

  useEffect(() => {
    if (!isAuthorized || orgLoading) return;
    loadPlan();
  }, [isAuthorized, orgLoading, loadPlan]);

  const handleArchive = () => {
    if (!plan) return;
    requestConfirmation({
      title: "Archive workout plan?",
      description: `Archive "${plan.title}"? It will no longer be visible to the client.`,
      confirmLabel: "Archive",
      onConfirm: async () => {
        try {
          const res = orgId
            ? await progressService.archiveWorkoutPlanInOrg(
                orgId,
                profileId,
                plan._id,
              )
            : await progressService.archiveWorkoutPlan(profileId, plan._id);
          if (res.success) {
            router.push("/dashboard/trainer/workouts");
          } else {
            setError(res.message || "Failed to archive plan");
          }
        } catch {
          setError("Failed to archive plan");
        }
      },
    });
  };

  if (isLoading || orgLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <TrainerSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        {/* Back */}
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
          Back to Workout Plans
        </button>

        {error && (
          <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loadingPlan ? (
          <DashboardLoading />
        ) : !plan ? (
          <div className="rounded-2xl bg-white p-8 shadow-card text-center">
            <p className="text-foreground-secondary">Workout plan not found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
                      {plan.title}
                    </h1>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(plan.status)}`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-foreground-secondary mb-3">
                      {plan.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-foreground-secondary">
                    <span>Client: {clientFullName(plan)}</span>
                    <span>Assigned {formatDate(plan.assigned_at)}</span>
                    {plan.version > 1 && <span>Version {plan.version}</span>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/trainer/workouts/${plan._id}/edit?profileId=${profileId}`}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-accent-yellow-500 px-5 text-sm font-semibold text-foreground hover:bg-accent-yellow-600"
                  >
                    Edit Plan
                  </Link>
                  {plan.status !== PlanStatus.ARCHIVED && (
                    <button
                      onClick={handleArchive}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Plan Info */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">Difficulty</p>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${difficultyColor(plan.difficulty_level)}`}
                  >
                    {difficultyLabel(plan.difficulty_level)}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">Frequency</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {plan.frequency || "Not set"}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">Exercises</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {plan.exercises.length}
                </p>
              </div>
            </div>

            {/* Trainer Notes */}
            {plan.trainer_notes && (
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-3">
                  Trainer Notes
                </h2>
                <p className="text-sm text-foreground-secondary whitespace-pre-wrap">
                  {plan.trainer_notes}
                </p>
              </div>
            )}

            {/* Exercises */}
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Exercises ({plan.exercises.length})
              </h2>
              {plan.exercises.length === 0 ? (
                <p className="text-sm text-foreground-secondary">
                  No exercises added yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {plan.exercises
                    .sort((a, b) => a.order - b.order)
                    .map((exercise, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-neutral-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-yellow-100 text-xs font-bold text-accent-yellow-700">
                                {exercise.order}
                              </span>
                              <h3 className="font-semibold text-foreground">
                                {exercise.name}
                              </h3>
                            </div>
                            {exercise.description && (
                              <p className="text-sm text-foreground-secondary mb-2 ml-8">
                                {exercise.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm text-foreground-secondary ml-8">
                              {exercise.sets && (
                                <span className="inline-flex items-center gap-1">
                                  <strong>{exercise.sets}</strong> sets
                                </span>
                              )}
                              {exercise.reps && (
                                <span className="inline-flex items-center gap-1">
                                  <strong>{exercise.reps}</strong> reps
                                </span>
                              )}
                              {exercise.duration_minutes && (
                                <span className="inline-flex items-center gap-1">
                                  <strong>{exercise.duration_minutes}</strong>{" "}
                                  min
                                </span>
                              )}
                              {exercise.rest_seconds != null &&
                                exercise.rest_seconds > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <strong>{exercise.rest_seconds}</strong>s
                                    rest
                                  </span>
                                )}
                            </div>
                            {exercise.notes && (
                              <p className="mt-2 text-xs text-foreground-tertiary ml-8 italic">
                                {exercise.notes}
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

        {confirmationModal}
      </main>
    </div>
  );
}

// ─── Page wrapper with Suspense ────────────────────────────────────

export default function WorkoutPlanDetailPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <WorkoutPlanDetailContent />
    </Suspense>
  );
}
