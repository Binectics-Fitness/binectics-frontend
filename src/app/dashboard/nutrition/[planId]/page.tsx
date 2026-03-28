"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import {
  UserRole,
  PlanStatus,
  DietPlanDeliveryType,
  MealSlot,
} from "@/lib/types";
import { progressService } from "@/lib/api/progress";
import type { DietPlan } from "@/lib/api/progress";

const statusColors: Record<string, string> = {
  [PlanStatus.ACTIVE]: "bg-green-100 text-green-700",
  [PlanStatus.INACTIVE]: "bg-neutral-100 text-neutral-600",
  [PlanStatus.ARCHIVED]: "bg-red-100 text-red-600",
};

const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  [MealSlot.BREAKFAST]: "Breakfast",
  [MealSlot.MORNING_SNACK]: "Morning Snack",
  [MealSlot.LUNCH]: "Lunch",
  [MealSlot.AFTERNOON_SNACK]: "Afternoon Snack",
  [MealSlot.DINNER]: "Dinner",
  [MealSlot.EVENING_SNACK]: "Evening Snack",
};

export default function UserDietPlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.planId as string;

  const { isLoading, isAuthorized } = useRoleGuard(UserRole.USER);
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPlan = useCallback(async () => {
    if (!planId) return;
    setLoadingPlan(true);
    try {
      const res = await progressService.getMyDietPlanById(planId);
      if (res.success && res.data) {
        setPlan(res.data);
      } else {
        setError(res.message || "Diet plan not found");
      }
    } catch {
      setError("Failed to load diet plan");
    }
    setLoadingPlan(false);
  }, [planId]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadPlan();
  }, [isAuthorized, loadPlan]);

  const handleDownloadDocument = async () => {
    if (!planId) return;
    setDownloadLoading(true);
    setError("");
    try {
      const res = await progressService.getMyDietPlanDocumentAccess(planId);
      if (res.success && res.data?.download_url) {
        window.open(res.data.download_url, "_blank", "noopener,noreferrer");
      } else {
        setError(
          res.message || "Could not generate download link. Please try again.",
        );
      }
    } catch {
      setError("Failed to access document. The link may have expired.");
    }
    setDownloadLoading(false);
  };

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const dietitianName =
    plan && typeof plan.professional_id === "object"
      ? `${plan.professional_id.first_name} ${plan.professional_id.last_name}`
      : "Dietitian";

  const isDocument = plan?.delivery_type === DietPlanDeliveryType.DOCUMENT;

  const sortedMeals = plan
    ? [...plan.meals].sort((a, b) => a.order - b.order)
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
          Back to Nutrition
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
            <p className="text-foreground-secondary">Diet plan not found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
                    {plan.title}
                  </h1>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    Assigned by {dietitianName} ·{" "}
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
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isDocument
                        ? "bg-accent-blue-100 text-accent-blue-700"
                        : "bg-accent-purple-100 text-accent-purple-700"
                    }`}
                  >
                    {isDocument ? "Document" : "Platform"}
                  </span>
                </div>
              </div>
              {plan.description && (
                <p className="mt-3 text-sm text-foreground-secondary whitespace-pre-wrap">
                  {plan.description}
                </p>
              )}
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-500">Delivery</p>
                <p className="text-sm font-bold text-foreground capitalize">
                  {plan.delivery_type}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-500">
                  {isDocument ? "Document" : "Meals"}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {isDocument
                    ? plan.document_file_name || "Uploaded"
                    : plan.meals.length}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-500">Version</p>
                <p className="text-lg font-bold text-foreground">
                  v{plan.version}
                </p>
              </div>
            </div>

            {/* Document Download */}
            {isDocument && (
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-3">
                  Download Document
                </h2>
                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
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
                      {plan.document_file_name || "Diet Plan Document"}
                    </p>
                    {plan.document_file_size && (
                      <p className="text-xs text-foreground-secondary">
                        {(plan.document_file_size / 1024).toFixed(1)} KB
                      </p>
                    )}
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Secure download — link expires after 15 minutes
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadDocument}
                    disabled={downloadLoading}
                    className="inline-flex h-9 items-center rounded-lg bg-accent-blue-500 px-4 text-sm font-medium text-white hover:bg-accent-blue-600 disabled:opacity-50"
                  >
                    {downloadLoading ? "Loading…" : "Download"}
                  </button>
                </div>
              </div>
            )}

            {/* Dietitian Notes */}
            {plan.dietitian_notes && (
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-2">
                  Dietitian Notes
                </h2>
                <p className="text-sm text-foreground-secondary whitespace-pre-wrap">
                  {plan.dietitian_notes}
                </p>
              </div>
            )}

            {/* Meals (Platform plans) */}
            {!isDocument && sortedMeals.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Meals
                </h2>
                <div className="space-y-4">
                  {sortedMeals.map((meal, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-purple-500 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                              {meal.title}
                            </h3>
                            <span className="rounded-full bg-accent-purple-100 px-2 py-0.5 text-xs font-medium text-accent-purple-700">
                              {MEAL_SLOT_LABELS[meal.meal_type] ||
                                meal.meal_type}
                            </span>
                            {meal.calories != null && (
                              <span className="text-xs text-neutral-400">
                                {meal.calories} kcal
                              </span>
                            )}
                          </div>
                          {meal.description && (
                            <p className="mt-1 text-sm text-neutral-500">
                              {meal.description}
                            </p>
                          )}
                          {meal.foods && meal.foods.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {meal.foods.map((food, fi) => (
                                <span
                                  key={fi}
                                  className="rounded bg-white px-2 py-1 text-xs border border-neutral-200 text-neutral-600"
                                >
                                  {food}
                                </span>
                              ))}
                            </div>
                          )}
                          {meal.notes && (
                            <p className="mt-2 text-xs text-neutral-400 italic">
                              {meal.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
