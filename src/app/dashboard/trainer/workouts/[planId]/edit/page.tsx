"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import TrainerSidebar from "@/components/TrainerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { progressService } from "@/lib/api/progress";
import { UserRole, DifficultyLevel, PlanStatus } from "@/lib/types";
import type {
  WorkoutPlan,
  CreateWorkoutExerciseRequest,
} from "@/lib/api/progress";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  workoutPlanSchema,
  type WorkoutPlanFormData,
} from "@/lib/schemas/progress";

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
            Name *
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
            {...register(`exercises.${index}.sets`)}
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
            {...register(`exercises.${index}.reps`)}
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
            {...register(`exercises.${index}.duration_minutes`)}
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
            {...register(`exercises.${index}.rest_seconds`)}
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

      <input type="hidden" {...register(`exercises.${index}.order`)} />
    </div>
  );
}

// ─── Edit Content ──────────────────────────────────────────────────

function EditWorkoutPlanContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const planId = params.planId as string;
  const profileId = searchParams.get("profileId") || "";

  const { isLoading, isAuthorized } = useRoleGuard(UserRole.TRAINER);
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const orgId = currentOrg?._id;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WorkoutPlanFormData>({
    resolver: zodResolver(workoutPlanSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "exercises",
  });

  const loadPlan = useCallback(async () => {
    if (!profileId || !planId) {
      setError("Missing profile or plan ID");
      setLoadingPlan(false);
      return;
    }
    setError("");
    setLoadingPlan(true);
    try {
      const res = await progressService.getWorkoutPlanById(profileId, planId);
      if (res.success && res.data) {
        setPlan(res.data);
        const p = res.data;
        reset({
          title: p.title,
          description: p.description || "",
          exercises:
            p.exercises.length > 0
              ? p.exercises.map((e) => ({
                  name: e.name,
                  description: e.description || undefined,
                  sets: e.sets,
                  reps: e.reps,
                  duration_minutes: e.duration_minutes,
                  rest_seconds: e.rest_seconds,
                  order: e.order,
                  notes: e.notes || undefined,
                }))
              : [{ name: "", order: 1 }],
          trainer_notes: p.trainer_notes || "",
          frequency: p.frequency || "",
          difficulty_level: p.difficulty_level || "",
        });
      } else {
        setError(res.message || "Workout plan not found");
      }
    } catch {
      setError("Failed to load workout plan");
    }
    setLoadingPlan(false);
  }, [profileId, planId, reset]);

  useEffect(() => {
    if (!isAuthorized || orgLoading) return;
    loadPlan();
  }, [isAuthorized, orgLoading, loadPlan]);

  const onSubmit = async (data: WorkoutPlanFormData) => {
    if (!profileId || !planId) return;
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
        ? await progressService.updateWorkoutPlanInOrg(
            orgId,
            profileId,
            planId,
            payload,
          )
        : await progressService.updateWorkoutPlan(profileId, planId, payload);

      if (res.success) {
        router.push(
          `/dashboard/trainer/workouts/${planId}?profileId=${profileId}`,
        );
      } else {
        setError(res.message || "Failed to update workout plan");
      }
    } catch {
      setError("Failed to update workout plan");
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
            Edit Workout Plan
          </h1>
          {plan && (
            <p className="mt-1 text-sm text-foreground-secondary">
              Editing &ldquo;{plan.title}&rdquo; — saving will increment the
              version
            </p>
          )}
        </div>

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Status */}
            {plan.status === PlanStatus.ARCHIVED && (
              <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  This plan is archived. Editing it will not change its status.
                </p>
              </div>
            )}

            {/* Plan Details */}
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Plan Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">
                    Title *
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
            <div className="rounded-2xl bg-white p-6 shadow-card">
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
                {submitting ? "Saving…" : "Save Changes"}
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

// ─── Page wrapper with Suspense ────────────────────────────────────

export default function EditWorkoutPlanPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <EditWorkoutPlanContent />
    </Suspense>
  );
}
