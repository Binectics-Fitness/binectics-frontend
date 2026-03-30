"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TrainerSidebar from "@/components/TrainerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { progressService } from "@/lib/api/progress";
import { UserRole, DifficultyLevel } from "@/lib/types";
import type {
  ClientProfile,
  CreateWorkoutExerciseRequest,
} from "@/lib/api/progress";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  workoutPlanSchema,
  type WorkoutPlanFormData,
} from "@/lib/schemas/progress";

// ─── Helpers ───────────────────────────────────────────────────────

function clientName(profile: ClientProfile): string {
  if (typeof profile.client_id === "object") {
    return `${profile.client_id.first_name} ${profile.client_id.last_name}`;
  }
  return "Client";
}

// ─── Exercise Row Editor ───────────────────────────────────────────

function ExerciseRowEditor({
  index,
  register,
  remove,
  errors,
  totalCount,
}: {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  remove: (index: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
  totalCount: number;
}) {
  const fieldErrors = errors?.exercises?.[index];

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">
          Exercise {index + 1}
        </h4>
        {totalCount > 1 && (
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register(`exercises.${index}.name`)}
            placeholder="e.g. Barbell Bench Press"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
          />
          {fieldErrors?.name && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Sets
          </label>
          <input
            type="number"
            {...register(`exercises.${index}.sets`, { valueAsNumber: true })}
            placeholder="e.g. 4"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Reps
          </label>
          <input
            type="number"
            {...register(`exercises.${index}.reps`, { valueAsNumber: true })}
            placeholder="e.g. 10"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Duration (min)
          </label>
          <input
            type="number"
            {...register(`exercises.${index}.duration_minutes`, { valueAsNumber: true })}
            placeholder="e.g. 5"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Rest (sec)
          </label>
          <input
            type="number"
            {...register(`exercises.${index}.rest_seconds`, { valueAsNumber: true })}
            placeholder="e.g. 90"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Notes
          </label>
          <input
            {...register(`exercises.${index}.notes`)}
            placeholder="e.g. Focus on controlled eccentric"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
          />
        </div>
      </div>

      <input type="hidden" {...register(`exercises.${index}.order`, { valueAsNumber: true })} />
    </div>
  );
}

// ─── Form Content (uses useSearchParams) ───────────────────────────

function CreateWorkoutPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProfileId = searchParams.get("profileId") || "";

  const { isLoading, isAuthorized } = useRoleGuard(UserRole.TRAINER);
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] =
    useState(preselectedProfileId);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const orgId = currentOrg?._id;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WorkoutPlanFormData>({
    resolver: zodResolver(workoutPlanSchema),
    defaultValues: {
      title: "",
      description: "",
      exercises: [{ name: "", sets: undefined, reps: undefined, order: 1 }],
      trainer_notes: "",
      frequency: "",
      difficulty_level: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "exercises",
  });

  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const res = orgId
        ? await progressService.getOrgClientProfiles(orgId)
        : await progressService.getMyClientProfiles();
      if (res.success && res.data) {
        const active = res.data.filter((p) => p.is_active);
        setProfiles(active);
        if (!selectedProfileId && active.length > 0) {
          setSelectedProfileId(active[0]._id);
        }
      }
    } catch {
      setError("Failed to load clients");
    }
    setLoadingProfiles(false);
  }, [orgId, selectedProfileId]);

  useEffect(() => {
    if (!isAuthorized || orgLoading) return;
    loadProfiles();
  }, [isAuthorized, orgLoading, loadProfiles]);

  const onSubmit = async (data: WorkoutPlanFormData) => {
    if (!selectedProfileId) {
      setError("Please select a client");
      return;
    }
    setSubmitting(true);
    setError("");

    const exercises: CreateWorkoutExerciseRequest[] = (data.exercises || [])
      .filter((e) => e.name.trim())
      .map((e, idx) => ({
        name: e.name.trim(),
        description: e.description || undefined,
        sets: e.sets || undefined,
        reps: e.reps || undefined,
        duration_minutes: e.duration_minutes || undefined,
        rest_seconds: e.rest_seconds || undefined,
        order: idx + 1,
        notes: e.notes || undefined,
      }));

    try {
      const payload = {
        title: data.title.trim(),
        description: data.description || undefined,
        exercises: exercises.length > 0 ? exercises : undefined,
        trainer_notes: data.trainer_notes || undefined,
        frequency: data.frequency || undefined,
        difficulty_level:
          (data.difficulty_level as DifficultyLevel) || undefined,
      };

      const res = orgId
        ? await progressService.createWorkoutPlanInOrg(
            orgId,
            selectedProfileId,
            payload,
          )
        : await progressService.createWorkoutPlan(selectedProfileId, payload);

      if (res.success && res.data) {
        router.push(
          `/dashboard/trainer/workouts/${res.data._id}?profileId=${selectedProfileId}`,
        );
      } else {
        setError(res.message || "Failed to create workout plan");
      }
    } catch {
      setError("Failed to create workout plan");
    }
    setSubmitting(false);
  };

  if (isLoading || orgLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <TrainerSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
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
            Back
          </button>
          <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
            Create Workout Plan
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Build a structured workout routine for your client
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loadingProfiles ? (
          <DashboardLoading />
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-card)]">
            <EmptyState
              title="No Clients"
              description="Add a client first before creating a workout plan."
              actionLabel="Go to Clients"
              actionHref="/dashboard/trainer/clients"
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Client Selection */}
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-bold text-foreground mb-4">Client</h2>
              <select
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

            {/* Plan Details */}
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Plan Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("title")}
                    placeholder="e.g. Upper Body Hypertrophy A"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Describe the workout plan..."
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">
                      Frequency
                    </label>
                    <input
                      {...register("frequency")}
                      placeholder="e.g. 3x per week"
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-1">
                      Difficulty Level
                    </label>
                    <select
                      {...register("difficulty_level")}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
                    >
                      <option value="">Select difficulty</option>
                      <option value={DifficultyLevel.BEGINNER}>Beginner</option>
                      <option value={DifficultyLevel.INTERMEDIATE}>
                        Intermediate
                      </option>
                      <option value={DifficultyLevel.ADVANCED}>Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">
                    Trainer Notes
                  </label>
                  <textarea
                    {...register("trainer_notes")}
                    rows={2}
                    placeholder="Private notes about this client's needs..."
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground focus:border-accent-yellow-500 focus:outline-none focus:ring-1 focus:ring-accent-yellow-500"
                  />
                </div>
              </div>
            </div>

            {/* Exercises */}
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Exercises</h2>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      name: "",
                      order: fields.length + 1,
                    })
                  }
                  className="inline-flex items-center gap-1 text-sm font-semibold text-accent-yellow-600 hover:text-accent-yellow-700"
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
                  Add Exercise
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <ExerciseRowEditor
                    key={field.id}
                    index={index}
                    register={register}
                    remove={remove}
                    errors={errors}
                    totalCount={fields.length}
                  />
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-accent-yellow-500 px-6 text-sm font-semibold text-foreground hover:bg-accent-yellow-600 disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create Workout Plan"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 text-sm font-medium text-foreground hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

// ─── Lazy-import EmptyState only when needed ──────────────────────

import { EmptyState } from "@/components/EmptyState";

// ─── Page wrapper with Suspense (required for useSearchParams) ────

export default function CreateWorkoutPlanPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <CreateWorkoutPlanContent />
    </Suspense>
  );
}
