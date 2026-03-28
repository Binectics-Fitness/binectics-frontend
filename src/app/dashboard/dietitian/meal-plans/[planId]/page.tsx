"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import DietitianSidebar from "@/components/DietitianSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { progressService } from "@/lib/api/progress";
import { UserRole, PlanStatus, DietPlanDeliveryType, MealSlot } from "@/lib/types";
import type { DietPlan } from "@/lib/api/progress";
import { formatLocal } from "@/utils/format";

// ─── Helpers ───────────────────────────────────────────────────────

function formatDate(iso: string) {
  return formatLocal(iso, "MMM d, yyyy");
}

function clientFullName(plan: DietPlan): string {
  if (typeof plan.client_id === "object") {
    return `${plan.client_id.first_name} ${plan.client_id.last_name}`;
  }
  return "Client";
}

function statusColor(status: PlanStatus): string {
  const colors: Record<PlanStatus, string> = {
    [PlanStatus.ACTIVE]: "bg-green-100 text-green-700",
    [PlanStatus.INACTIVE]: "bg-neutral-100 text-neutral-600",
    [PlanStatus.ARCHIVED]: "bg-red-100 text-red-600",
  };
  return colors[status] || "bg-neutral-100 text-neutral-600";
}

function deliveryLabel(type: DietPlanDeliveryType): string {
  const labels: Record<DietPlanDeliveryType, string> = {
    [DietPlanDeliveryType.PLATFORM]: "Platform Meals",
    [DietPlanDeliveryType.DOCUMENT]: "Document",
  };
  return labels[type] || type;
}

function deliveryColor(type: DietPlanDeliveryType): string {
  const colors: Record<DietPlanDeliveryType, string> = {
    [DietPlanDeliveryType.PLATFORM]: "bg-accent-purple-100 text-accent-purple-700",
    [DietPlanDeliveryType.DOCUMENT]: "bg-accent-blue-100 text-accent-blue-700",
  };
  return colors[type] || "bg-neutral-100 text-neutral-600";
}

const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  [MealSlot.BREAKFAST]: "Breakfast",
  [MealSlot.MORNING_SNACK]: "Morning Snack",
  [MealSlot.LUNCH]: "Lunch",
  [MealSlot.AFTERNOON_SNACK]: "Afternoon Snack",
  [MealSlot.DINNER]: "Dinner",
  [MealSlot.EVENING_SNACK]: "Evening Snack",
};

function mealSlotLabel(slot: MealSlot): string {
  return MEAL_SLOT_LABELS[slot] || slot;
}

// ─── Detail Content ────────────────────────────────────────────────

function DietPlanDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const planId = params.planId as string;
  const profileId = searchParams.get("profileId") || "";

  const { isLoading, isAuthorized } = useRoleGuard(UserRole.DIETITIAN);
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [downloadingDoc, setDownloadingDoc] = useState(false);
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
        ? await progressService.getDietPlansInOrg(orgId, profileId)
        : await progressService.getDietPlans(profileId);
      if (res.success && res.data) {
        const found = res.data.find((p) => p._id === planId);
        if (found) {
          setPlan(found);
        } else {
          const single = orgId
            ? null
            : await progressService.getDietPlanById(profileId, planId);
          if (single?.success && single.data) {
            setPlan(single.data);
          } else {
            setError("Diet plan not found");
          }
        }
      } else {
        setError(res.message || "Failed to load diet plan");
      }
    } catch {
      setError("Failed to load diet plan");
    }
    setLoadingPlan(false);
  }, [profileId, planId, orgId]);

  useEffect(() => {
    if (!isAuthorized || orgLoading) return;
    loadPlan();
  }, [isAuthorized, orgLoading, loadPlan]);

  const handleDownloadDocument = async () => {
    if (!plan) return;
    setDownloadingDoc(true);
    try {
      const res = orgId
        ? await progressService.getDietPlanDocumentAccessInOrg(
            orgId,
            profileId,
            plan._id,
          )
        : await progressService.getDietPlanDocumentAccess(profileId, plan._id);
      if (res.success && res.data?.download_url) {
        window.open(res.data.download_url, "_blank", "noopener,noreferrer");
      } else {
        setError(res.message || "Failed to get download link");
      }
    } catch {
      setError("Failed to get download link. The signed URL may have expired — please try again.");
    }
    setDownloadingDoc(false);
  };

  const handleArchive = () => {
    if (!plan) return;
    requestConfirmation({
      title: "Archive diet plan?",
      description: `Archive "${plan.title}"? It will no longer be visible to the client.`,
      confirmLabel: "Archive",
      onConfirm: async () => {
        try {
          const res = orgId
            ? await progressService.archiveDietPlanInOrg(
                orgId,
                profileId,
                plan._id,
              )
            : await progressService.archiveDietPlan(profileId, plan._id);
          if (res.success) {
            router.push("/dashboard/dietitian/meal-plans");
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
      <DietitianSidebar />

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
          Back to Meal Plans
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
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${deliveryColor(plan.delivery_type)}`}
                    >
                      {deliveryLabel(plan.delivery_type)}
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
                    href={`/dashboard/dietitian/meal-plans/${plan._id}/edit?profileId=${profileId}`}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-accent-purple-500 px-5 text-sm font-semibold text-white hover:bg-accent-purple-600"
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

            {/* Plan Info Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">
                  Delivery Type
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${deliveryColor(plan.delivery_type)}`}
                  >
                    {deliveryLabel(plan.delivery_type)}
                  </span>
                </div>
              </div>
              {plan.delivery_type === DietPlanDeliveryType.PLATFORM && (
                <div className="rounded-2xl bg-white p-6 shadow-card">
                  <p className="text-sm text-foreground-secondary">Meals</p>
                  <p className="mt-1 text-3xl font-black text-foreground">
                    {plan.meals.length}
                  </p>
                </div>
              )}
              {plan.delivery_type === DietPlanDeliveryType.DOCUMENT &&
                plan.document_file_name && (
                  <div className="rounded-2xl bg-white p-6 shadow-card">
                    <p className="text-sm text-foreground-secondary">
                      Document
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground truncate">
                      {plan.document_file_name}
                    </p>
                    {plan.document_file_size && (
                      <p className="text-xs text-foreground-secondary mt-0.5">
                        {(plan.document_file_size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                )}
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">Version</p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {plan.version}
                </p>
              </div>
            </div>

            {/* Document Download Section */}
            {plan.delivery_type === DietPlanDeliveryType.DOCUMENT && (
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Document Access
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue-100">
                    <svg
                      className="h-6 w-6 text-accent-blue-600"
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
                      {plan.document_file_name || "Uploaded document"}
                    </p>
                    <p className="text-xs text-foreground-secondary">
                      Secure download — link expires after 15 minutes
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadDocument}
                    disabled={downloadingDoc}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent-blue-500 px-5 text-sm font-semibold text-white hover:bg-accent-blue-600 disabled:opacity-50"
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    {downloadingDoc ? "Getting link…" : "Download"}
                  </button>
                </div>
              </div>
            )}

            {/* Dietitian Notes */}
            {plan.dietitian_notes && (
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-3">
                  Dietitian Notes
                </h2>
                <p className="text-sm text-foreground-secondary whitespace-pre-wrap">
                  {plan.dietitian_notes}
                </p>
              </div>
            )}

            {/* Meals List (platform plans only) */}
            {plan.delivery_type === DietPlanDeliveryType.PLATFORM &&
              plan.meals.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-card">
                  <h2 className="text-lg font-bold text-foreground mb-4">
                    Meals
                  </h2>
                  <div className="space-y-4">
                    {[...plan.meals]
                      .sort((a, b) => a.order - b.order)
                      .map((meal, idx) => (
                        <div
                          key={idx}
                          className="flex gap-4 rounded-xl border border-neutral-200 p-4"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-purple-100 text-sm font-bold text-accent-purple-700">
                            {meal.order}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="text-sm font-bold text-foreground">
                                {meal.title}
                              </h3>
                              <span className="inline-flex items-center rounded-full bg-accent-purple-50 px-2 py-0.5 text-xs font-medium text-accent-purple-700">
                                {mealSlotLabel(meal.meal_type)}
                              </span>
                              {meal.calories && (
                                <span className="text-xs text-foreground-secondary">
                                  {meal.calories} kcal
                                </span>
                              )}
                            </div>
                            {meal.description && (
                              <p className="text-sm text-foreground-secondary mb-1">
                                {meal.description}
                              </p>
                            )}
                            {meal.foods && meal.foods.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {meal.foods.map((food, fi) => (
                                  <span
                                    key={fi}
                                    className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-foreground-secondary"
                                  >
                                    {food}
                                  </span>
                                ))}
                              </div>
                            )}
                            {meal.notes && (
                              <p className="mt-1 text-xs text-foreground-secondary italic">
                                {meal.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {confirmationModal}
      </main>
    </div>
  );
}

// ─── Page wrapper with Suspense ──────────────────────────────────

export default function DietPlanDetailPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DietPlanDetailContent />
    </Suspense>
  );
}
