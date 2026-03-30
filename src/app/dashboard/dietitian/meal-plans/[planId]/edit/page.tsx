"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import DietitianSidebar from "@/components/DietitianSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { progressService } from "@/lib/api/progress";
import {
  UserRole,
  PlanStatus,
  DietPlanDeliveryType,
  MealSlot,
} from "@/lib/types";
import type { DietPlan, CreateDietMealRequest } from "@/lib/api/progress";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dietPlanSchema, type DietPlanFormData } from "@/lib/schemas/progress";

// ─── Helpers ───────────────────────────────────────────────────────

const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  [MealSlot.BREAKFAST]: "Breakfast",
  [MealSlot.MORNING_SNACK]: "Morning Snack",
  [MealSlot.LUNCH]: "Lunch",
  [MealSlot.AFTERNOON_SNACK]: "Afternoon Snack",
  [MealSlot.DINNER]: "Dinner",
  [MealSlot.EVENING_SNACK]: "Evening Snack",
};

// ─── Meal Row Editor ──────────────────────────────────────────────

function MealRowEditor({
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
  const fieldErrors = errors?.meals?.[index];

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">
          Meal {index + 1}
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
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Meal Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register(`meals.${index}.meal_type`)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
          >
            <option value="">Select type</option>
            {Object.values(MealSlot).map((slot) => (
              <option key={slot} value={slot}>
                {MEAL_SLOT_LABELS[slot]}
              </option>
            ))}
          </select>
          {fieldErrors?.meal_type && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.meal_type.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            {...register(`meals.${index}.title`)}
            placeholder="e.g. Overnight Oats with Berries"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
          />
          {fieldErrors?.title && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.title.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Description
          </label>
          <textarea
            {...register(`meals.${index}.description`)}
            rows={2}
            placeholder="Describe the meal..."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Calories
          </label>
          <input
            type="number"
            {...register(`meals.${index}.calories`, { valueAsNumber: true })}
            placeholder="e.g. 380"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Notes
          </label>
          <input
            {...register(`meals.${index}.notes`)}
            placeholder="e.g. Prep the night before"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
          />
        </div>
      </div>

      <input
        type="hidden"
        {...register(`meals.${index}.order`, { valueAsNumber: true })}
      />
    </div>
  );
}

// ─── Edit Content ──────────────────────────────────────────────────

function EditDietPlanContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const planId = params.planId as string;
  const profileId = searchParams.get("profileId") || "";

  const { isLoading, isAuthorized } = useRoleGuard(UserRole.DIETITIAN);
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replacingDoc, setReplacingDoc] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const orgId = currentOrg?._id;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DietPlanFormData>({
    resolver: zodResolver(dietPlanSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "meals",
  });

  const loadPlan = useCallback(async () => {
    if (!planId) {
      setError("Missing plan ID");
      setLoadingPlan(false);
      return;
    }
    setError("");
    setLoadingPlan(true);
    try {
      const res = profileId
        ? await progressService.getDietPlanById(profileId, planId)
        : await progressService.getStandaloneDietPlanById(planId);
      if (res.success && res.data) {
        setPlan(res.data);
        const p = res.data;
        reset({
          title: p.title,
          description: p.description || "",
          delivery_type: p.delivery_type,
          meals:
            p.delivery_type === DietPlanDeliveryType.PLATFORM &&
            p.meals.length > 0
              ? p.meals.map((m) => ({
                  meal_type: m.meal_type,
                  title: m.title,
                  description: m.description || undefined,
                  calories: m.calories,
                  notes: m.notes || undefined,
                  order: m.order,
                }))
              : [{ meal_type: "", title: "", order: 1 }],
          dietitian_notes: p.dietitian_notes || "",
        });
      } else {
        setError(res.message || "Diet plan not found");
      }
    } catch {
      setError("Failed to load diet plan");
    }
    setLoadingPlan(false);
  }, [profileId, planId, reset]);

  useEffect(() => {
    if (!isAuthorized || orgLoading) return;
    loadPlan();
  }, [isAuthorized, orgLoading, loadPlan]);

  const onSubmit = async (data: DietPlanFormData) => {
    if (!planId) return;
    setSubmitting(true);
    setError("");

    const meals: CreateDietMealRequest[] = (data.meals || [])
      .filter((m) => m.title.trim() && m.meal_type)
      .map((m, idx) => ({
        meal_type: m.meal_type as MealSlot,
        title: m.title.trim(),
        description: m.description || undefined,
        foods: undefined,
        calories: m.calories || undefined,
        notes: m.notes || undefined,
        order: idx + 1,
      }));

    try {
      const payload = {
        title: data.title.trim(),
        description: data.description || undefined,
        meals:
          plan?.delivery_type === DietPlanDeliveryType.PLATFORM &&
          meals.length > 0
            ? meals
            : undefined,
        dietitian_notes: data.dietitian_notes || undefined,
      };

      const res = profileId
        ? orgId
          ? await progressService.updateDietPlanInOrg(
              orgId,
              profileId,
              planId,
              payload,
            )
          : await progressService.updateDietPlan(profileId, planId, payload)
        : await progressService.updateStandaloneDietPlan(planId, payload);

      if (res.success) {
        router.push(
          `/dashboard/dietitian/meal-plans/${planId}${profileId ? `?profileId=${profileId}` : ""}`,
        );
      } else {
        setError(res.message || "Failed to update diet plan");
      }
    } catch {
      setError("Failed to update diet plan");
    }
    setSubmitting(false);
  };

  const handleReplaceDocument = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF and DOCX files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10 MB");
      return;
    }

    setReplacingDoc(true);
    setError("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = profileId
        ? orgId
          ? await progressService.replaceDietPlanDocumentInOrg(
              orgId,
              profileId,
              planId,
              formData,
            )
          : await progressService.replaceDietPlanDocument(
              profileId,
              planId,
              formData,
            )
        : await progressService.replaceStandaloneDietPlanDocument(
            planId,
            formData,
          );

      if (res.success && res.data) {
        setPlan(res.data);
        setSuccessMsg("Document replaced successfully");
      } else {
        setError(res.message || "Failed to replace document");
      }
    } catch {
      setError("Failed to replace document");
    }
    setReplacingDoc(false);
  };

  if (isLoading || orgLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DietitianSidebar />

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
            Edit Meal Plan
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

        {successMsg && (
          <div className="mb-6 rounded-lg border-2 border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">{successMsg}</p>
          </div>
        )}

        {loadingPlan ? (
          <DashboardLoading />
        ) : !plan ? (
          <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-card)] text-center">
            <p className="text-foreground-secondary">Diet plan not found.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Status Warning */}
            {plan.status === PlanStatus.ARCHIVED && (
              <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  This plan is archived. Editing it will not change its status.
                </p>
              </div>
            )}

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
                    placeholder="e.g. Week 1 — Calorie Deficit Plan"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
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
                    placeholder="Describe the diet plan..."
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1">
                    Dietitian Notes
                  </label>
                  <textarea
                    {...register("dietitian_notes")}
                    rows={2}
                    placeholder="Private notes about this client's dietary needs..."
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Document Replace Section (for document-based plans) */}
            {plan.delivery_type === DietPlanDeliveryType.DOCUMENT && (
              <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Replace Document
                </h2>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue-100">
                    <svg
                      className="h-5 w-5 text-accent-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {plan.document_file_name || "Current document"}
                    </p>
                    {plan.document_file_size && (
                      <p className="text-xs text-foreground-secondary">
                        {(plan.document_file_size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleReplaceDocument}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={replacingDoc}
                      className="inline-flex h-9 items-center rounded-lg border border-accent-blue-300 bg-white px-4 text-sm font-medium text-accent-blue-600 hover:bg-accent-blue-50 disabled:opacity-50"
                    >
                      {replacingDoc ? "Replacing…" : "Replace File"}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-foreground-secondary">
                  Upload a new PDF or DOCX file to replace the current document.
                  The old file will be permanently deleted.
                </p>
              </div>
            )}

            {/* Meals (for platform plans) */}
            {plan.delivery_type === DietPlanDeliveryType.PLATFORM && (
              <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">Meals</h2>
                  <button
                    type="button"
                    onClick={() =>
                      append({
                        meal_type: "",
                        title: "",
                        order: fields.length + 1,
                      })
                    }
                    className="inline-flex items-center gap-1 text-sm font-semibold text-accent-purple-600 hover:text-accent-purple-700"
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
                    Add Meal
                  </button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <MealRowEditor
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
            )}

            {/* Submit */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-accent-purple-500 px-6 text-sm font-semibold text-white hover:bg-accent-purple-600 disabled:opacity-50"
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

// ─── Page wrapper with Suspense ──────────────────────────────────

export default function EditDietPlanPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <EditDietPlanContent />
    </Suspense>
  );
}
