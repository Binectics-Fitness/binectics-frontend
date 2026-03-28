"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DietitianSidebar from "@/components/DietitianSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { marketplaceService } from "@/lib/api/marketplace";
import { UserRole, MembershipPlanType } from "@/lib/types";
import type { MarketplaceMembershipPlan } from "@/lib/types";

export default function DietitianPlansPage() {
  const { user, isLoading, isAuthorized } = useRoleGuard(UserRole.DIETITIAN);
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const [plans, setPlans] = useState<MarketplaceMembershipPlan[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const orgId = currentOrg?._id;

  const refreshPlans = useCallback(async () => {
    if (!orgId) {
      setPlans([]);
      setLoadingData(false);
      return;
    }
    setError("");
    setLoadingData(true);
    const res = await marketplaceService.getOrgMembershipPlans(orgId);
    if (res.success && res.data) setPlans(res.data);
    else setError(res.message || "Failed to load plans");
    setLoadingData(false);
  }, [orgId]);

  useEffect(() => {
    if (isLoading || orgLoading || !user) return;
    void refreshPlans();
  }, [isLoading, orgLoading, user, refreshPlans]);

  const handleToggle = async (plan: MarketplaceMembershipPlan) => {
    if (!orgId) return;
    setMutatingId(plan._id);
    setError("");
    const res = plan.is_active
      ? await marketplaceService.deactivateOrgMembershipPlan(orgId, plan._id)
      : await marketplaceService.activateOrgMembershipPlan(orgId, plan._id);
    if (res.success) await refreshPlans();
    else setError(res.message || "Failed to update plan");
    setMutatingId(null);
  };

  const handleDelete = (plan: MarketplaceMembershipPlan) => {
    if (!orgId) return;
    requestConfirmation({
      title: "Delete plan?",
      description: `Delete "${plan.name}" permanently? This action cannot be undone.`,
      confirmLabel: "Delete Plan",
      onConfirm: async () => {
        setMutatingId(plan._id);
        const res = await marketplaceService.deleteOrgMembershipPlan(
          orgId,
          plan._id,
        );
        if (res.success) await refreshPlans();
        else setError(res.message || "Failed to delete plan");
        setMutatingId(null);
      },
    });
  };

  const stats = useMemo(() => {
    const activePlans = plans.filter((p) => p.is_active).length;
    const activeMembers = plans.reduce((s, p) => s + p.active_members, 0);
    return { total: plans.length, activePlans, activeMembers };
  }, [plans]);

  if (isLoading || orgLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DietitianSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
              Service Plans
            </h1>
            <p className="mt-1 text-sm text-foreground-secondary">
              Create and manage your dietitian service plans
            </p>
          </div>
          {orgId && (
            <Link
              href="/dashboard/dietitian/plans/create"
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
              Create Plan
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {!orgId ? (
          <div className="rounded-2xl bg-white p-8 shadow-card">
            <EmptyState
              title="No Organization"
              description="Create or join an organization to manage service plans."
              actionLabel="Go to Dashboard"
              actionHref="/dashboard/dietitian"
            />
          </div>
        ) : loadingData ? (
          <DashboardLoading />
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">Total Plans</p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">
                  Active Plans
                </p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {stats.activePlans}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">
                  Active Members
                </p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {stats.activeMembers}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                        Members
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {plans.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-10 text-center text-foreground-secondary"
                        >
                          No plans yet. Create your first plan to get started.
                        </td>
                      </tr>
                    ) : (
                      plans.map((plan) => (
                        <tr key={plan._id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-foreground">
                              {plan.name}
                            </p>
                            {plan.description && (
                              <p className="text-xs text-foreground-secondary line-clamp-1 mt-0.5">
                                {plan.description}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                plan.plan_type ===
                                MembershipPlanType.SUBSCRIPTION
                                  ? "bg-accent-purple-100 text-accent-purple-700"
                                  : "bg-primary-100 text-primary-700"
                              }`}
                            >
                              {plan.plan_type ===
                              MembershipPlanType.SUBSCRIPTION
                                ? "Subscription"
                                : "One-time"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-foreground">
                            {plan.currency} {plan.price}
                          </td>
                          <td className="px-6 py-4 text-foreground-secondary">
                            {plan.duration_days} days
                          </td>
                          <td className="px-6 py-4 text-foreground-secondary">
                            {plan.active_members}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                plan.is_active
                                  ? "bg-primary-100 text-primary-700"
                                  : "bg-neutral-100 text-neutral-600"
                              }`}
                            >
                              {plan.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 text-sm">
                              <button
                                onClick={() => handleToggle(plan)}
                                disabled={mutatingId === plan._id}
                                className="font-medium text-foreground-secondary hover:text-foreground disabled:opacity-50"
                              >
                                {plan.is_active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleDelete(plan)}
                                disabled={mutatingId === plan._id}
                                className="font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
      {confirmationModal}
    </div>
  );
}
