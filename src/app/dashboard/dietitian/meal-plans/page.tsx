"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DietitianSidebar from "@/components/DietitianSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { progressService } from "@/lib/api/progress";
import { UserRole, PlanStatus, DietPlanDeliveryType } from "@/lib/types";
import type { ClientProfile, DietPlan } from "@/lib/api/progress";
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

function deliveryLabel(type: DietPlanDeliveryType): string {
  const labels: Record<DietPlanDeliveryType, string> = {
    [DietPlanDeliveryType.PLATFORM]: "Platform",
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

function statusColor(status: PlanStatus): string {
  const colors: Record<PlanStatus, string> = {
    [PlanStatus.ACTIVE]: "bg-green-100 text-green-700",
    [PlanStatus.INACTIVE]: "bg-neutral-100 text-neutral-600",
    [PlanStatus.ARCHIVED]: "bg-red-100 text-red-600",
  };
  return colors[status] || "bg-neutral-100 text-neutral-600";
}

// ─── Page ──────────────────────────────────────────────────────────

export default function DietitianMealPlansPage() {
  const { isLoading, isAuthorized } = useRoleGuard(UserRole.DIETITIAN);
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const orgId = currentOrg?._id;

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

  const loadPlans = useCallback(async () => {
    if (!selectedProfileId) {
      setDietPlans([]);
      return;
    }
    setError("");
    setLoadingPlans(true);
    try {
      const res = orgId
        ? await progressService.getDietPlansInOrg(orgId, selectedProfileId)
        : await progressService.getDietPlans(selectedProfileId);
      if (res.success && res.data) {
        setDietPlans(res.data);
      } else {
        setError(res.message || "Failed to load diet plans");
      }
    } catch {
      setError("Failed to load diet plans");
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

  const handleArchive = (plan: DietPlan) => {
    requestConfirmation({
      title: "Archive diet plan?",
      description: `Archive "${plan.title}"? It will no longer be visible to the client.`,
      confirmLabel: "Archive",
      onConfirm: async () => {
        setArchivingId(plan._id);
        try {
          const res = orgId
            ? await progressService.archiveDietPlanInOrg(
                orgId,
                selectedProfileId,
                plan._id,
              )
            : await progressService.archiveDietPlan(
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

  const activePlans = dietPlans.filter((p) => p.status === PlanStatus.ACTIVE);
  const inactivePlans = dietPlans.filter((p) => p.status !== PlanStatus.ACTIVE);
  const platformPlans = dietPlans.filter(
    (p) => p.delivery_type === DietPlanDeliveryType.PLATFORM,
  );
  const documentPlans = dietPlans.filter(
    (p) => p.delivery_type === DietPlanDeliveryType.DOCUMENT,
  );

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DietitianSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
              Meal Plans
            </h1>
            <p className="mt-1 text-sm text-foreground-secondary">
              Create and manage diet plans for your clients
            </p>
          </div>
          {selectedProfileId && (
            <Link
              href={`/dashboard/dietitian/meal-plans/create?profileId=${selectedProfileId}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent-purple-500 px-5 text-sm font-semibold text-white hover:bg-accent-purple-600"
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
              New Meal Plan
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
          <div className="rounded-2xl bg-white p-8 shadow-card">
            <EmptyState
              title="No Clients Yet"
              description="Add a client from the Clients page to start creating meal plans."
              actionLabel="Go to Clients"
              actionHref="/dashboard/dietitian/clients"
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
                className="w-full max-w-xs rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
              >
                {profiles.map((p) => (
                  <option key={p._id} value={p._id}>
                    {clientName(p)}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats */}
            <div className="mb-8 grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">Total Plans</p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {dietPlans.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">Active Plans</p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {activePlans.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">
                  Platform Plans
                </p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {platformPlans.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">
                  Document Plans
                </p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {documentPlans.length}
                </p>
              </div>
            </div>

            {/* Plans List */}
            {loadingPlans ? (
              <DashboardLoading />
            ) : dietPlans.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 shadow-card">
                <EmptyState
                  title="No Meal Plans"
                  description="Create a meal plan for this client to get started."
                  actionLabel="Create Meal Plan"
                  actionHref={`/dashboard/dietitian/meal-plans/create?profileId=${selectedProfileId}`}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {[...activePlans, ...inactivePlans].map((plan) => (
                  <div
                    key={plan._id}
                    className="rounded-2xl bg-white p-6 shadow-card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Link
                            href={`/dashboard/dietitian/meal-plans/${plan._id}?profileId=${selectedProfileId}`}
                            className="text-lg font-bold text-foreground hover:text-accent-purple-600"
                          >
                            {plan.title}
                          </Link>
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
                          {plan.delivery_type === DietPlanDeliveryType.PLATFORM && (
                            <span>
                              {plan.meals.length} meal
                              {plan.meals.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {plan.delivery_type === DietPlanDeliveryType.DOCUMENT &&
                            plan.document_file_name && (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="h-3.5 w-3.5"
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
                                {plan.document_file_name}
                              </span>
                            )}
                          <span>Assigned {formatDate(plan.assigned_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/dashboard/dietitian/meal-plans/${plan._id}?profileId=${selectedProfileId}`}
                          className="inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-foreground hover:bg-neutral-50"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/dietitian/meal-plans/${plan._id}/edit?profileId=${selectedProfileId}`}
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
