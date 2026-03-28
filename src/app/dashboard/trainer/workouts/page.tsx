"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TrainerSidebar from "@/components/TrainerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { progressService } from "@/lib/api/progress";
import { UserRole, DifficultyLevel, PlanStatus } from "@/lib/types";
import type { ClientProfile, WorkoutPlan } from "@/lib/api/progress";
import { formatLocal } from "@/utils/format";

// ─── Helpers ───────────────────────────────────────────────────────

function clientName(profile: ClientProfile): string {
  if (typeof profile.client_id === "object") {
    return `${profile.client_id.first_name} ${profile.client_id.last_name}`;
  }
  return "Client";
}

function formatDate(iso: string) {
  return formatLocal(iso, "MMM d, yyyy");
}

function difficultyLabel(level?: DifficultyLevel): string {
  if (!level) return "";
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

// ─── Page ──────────────────────────────────────────────────────────

export default function TrainerWorkoutsPage() {
  const { isLoading, isAuthorized } = useRoleGuard(UserRole.TRAINER);
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const orgId = currentOrg?._id;

  // Load client profiles
  const loadProfiles = useCallback(async () => {
    setError("");
    setLoadingProfiles(true);
    try {
      const res = orgId
        ? await progressService.getOrgClientProfiles(orgId)
        : await progressService.getMyClientProfiles();
      if (res.success && res.data) {
        const active = res.data.filter((p) => p.is_active);
        setProfiles(active);
        if (active.length > 0 && !selectedProfileId) {
          setSelectedProfileId(active[0]._id);
        }
      } else {
        setError(res.message || "Failed to load clients");
      }
    } catch {
      setError("Failed to load clients");
    }
    setLoadingProfiles(false);
  }, [orgId, selectedProfileId]);

  // Load workout plans for selected profile
  const loadPlans = useCallback(async () => {
    if (!selectedProfileId) {
      setWorkoutPlans([]);
      return;
    }
    setError("");
    setLoadingPlans(true);
    try {
      const res = orgId
        ? await progressService.getWorkoutPlansInOrg(orgId, selectedProfileId)
        : await progressService.getWorkoutPlans(selectedProfileId);
      if (res.success && res.data) {
        setWorkoutPlans(res.data);
      } else {
        setError(res.message || "Failed to load workout plans");
      }
    } catch {
      setError("Failed to load workout plans");
    }
    setLoadingPlans(false);
  }, [selectedProfileId, orgId]);

  useEffect(() => {
    if (!isAuthorized || orgLoading) return;
    loadProfiles();
  }, [isAuthorized, orgLoading, loadProfiles]);

  useEffect(() => {
    if (!selectedProfileId) return;
    loadPlans();
  }, [selectedProfileId, loadPlans]);

  const handleArchive = (plan: WorkoutPlan) => {
    requestConfirmation({
      title: "Archive workout plan?",
      description: `Archive "${plan.title}"? It will no longer be visible to the client.`,
      confirmLabel: "Archive",
      onConfirm: async () => {
        setArchivingId(plan._id);
        try {
          const res = orgId
            ? await progressService.archiveWorkoutPlanInOrg(
                orgId,
                selectedProfileId,
                plan._id,
              )
            : await progressService.archiveWorkoutPlan(
                selectedProfileId,
                plan._id,
              );
          if (res.success) {
            await loadPlans();
          } else {
            setError(res.message || "Failed to archive plan");
          }
        } catch {
          setError("Failed to archive plan");
        }
        setArchivingId(null);
      },
    });
  };

  if (isLoading || orgLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const activePlans = workoutPlans.filter(
    (p) => p.status === PlanStatus.ACTIVE,
  );
  const inactivePlans = workoutPlans.filter(
    (p) => p.status !== PlanStatus.ACTIVE,
  );

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <TrainerSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
              Workout Plans
            </h1>
            <p className="mt-1 text-sm text-foreground-secondary">
              Create and manage workout plans for your clients
            </p>
          </div>
          {selectedProfileId && (
            <Link
              href={`/dashboard/trainer/workouts/create?profileId=${selectedProfileId}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent-yellow-500 px-5 text-sm font-semibold text-foreground hover:bg-accent-yellow-600"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Workout Plan
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Client Selector */}
        {loadingProfiles ? (
          <DashboardLoading />
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-card)]">
            <EmptyState
              title="No Clients Yet"
              description="Add a client from the Clients page to start creating workout plans."
              actionLabel="Go to Clients"
              actionHref="/dashboard/trainer/clients"
            />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label
                htmlFor="client-select"
                className="block text-sm font-medium text-foreground-secondary mb-2"
              >
                Select Client
              </label>
              <select
                id="client-select"
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
              >
                {profiles.map((p) => (
                  <option key={p._id} value={p._id}>
                    {clientName(p)}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <p className="text-sm text-foreground-secondary">Total Plans</p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {workoutPlans.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <p className="text-sm text-foreground-secondary">
                  Active Plans
                </p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {activePlans.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <p className="text-sm text-foreground-secondary">
                  Total Exercises
                </p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {workoutPlans.reduce((s, p) => s + p.exercises.length, 0)}
                </p>
              </div>
            </div>

            {/* Plans List */}
            {loadingPlans ? (
              <DashboardLoading />
            ) : workoutPlans.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-card)]">
                <EmptyState
                  title="No Workout Plans"
                  description="Create a workout plan for this client to get started."
                  actionLabel="Create Workout Plan"
                  actionHref={`/dashboard/trainer/workouts/create?profileId=${selectedProfileId}`}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {[...activePlans, ...inactivePlans].map((plan) => (
                  <div
                    key={plan._id}
                    className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Link
                            href={`/dashboard/trainer/workouts/${plan._id}?profileId=${selectedProfileId}`}
                            className="text-lg font-bold text-foreground hover:text-accent-yellow-600"
                          >
                            {plan.title}
                          </Link>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(plan.status)}`}
                          >
                            {plan.status}
                          </span>
                          {plan.difficulty_level && (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor(plan.difficulty_level)}`}
                            >
                              {difficultyLabel(plan.difficulty_level)}
                            </span>
                          )}
                          {plan.version > 1 && (
                            <span className="inline-flex items-center rounded-full bg-accent-blue-100 px-2.5 py-0.5 text-xs font-medium text-accent-blue-700">
                              v{plan.version}
                            </span>
                          )}
                        </div>

                        {plan.description && (
                          <p className="text-sm text-foreground-secondary mb-2 line-clamp-2">
                            {plan.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-foreground-secondary">
                          <span>
                            {plan.exercises.length} exercise
                            {plan.exercises.length !== 1 ? "s" : ""}
                          </span>
                          {plan.frequency && <span>{plan.frequency}</span>}
                          <span>Assigned {formatDate(plan.assigned_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/dashboard/trainer/workouts/${plan._id}?profileId=${selectedProfileId}`}
                          className="inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-foreground hover:bg-neutral-50"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/trainer/workouts/${plan._id}/edit?profileId=${selectedProfileId}`}
                          className="inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-foreground hover:bg-neutral-50"
                        >
                          Edit
                        </Link>
                        {plan.status !== PlanStatus.ARCHIVED && (
                          <button
                            onClick={() => handleArchive(plan)}
                            disabled={archivingId === plan._id}
                            className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {archivingId === plan._id
                              ? "Archiving…"
                              : "Archive"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {confirmationModal}
      </main>
    </div>
  );
}
