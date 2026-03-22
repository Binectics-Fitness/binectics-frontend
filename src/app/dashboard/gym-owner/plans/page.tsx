"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceMembershipPlan } from "@/lib/types";
import { MembershipPlanType } from "@/lib/types";

export default function GymOwnerPlansPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const [plans, setPlans] = useState<MarketplaceMembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutatingPlanId, setIsMutatingPlanId] = useState<string | null>(null);
  const [pageError, setPageError] = useState("");

  const organizationId = currentOrg?._id;

  const refreshPlans = useCallback(async () => {
    if (!organizationId) {
      setPlans([]);
      setIsLoading(false);
      return;
    }

    setPageError("");
    setIsLoading(true);

    const response = await marketplaceService.getOrgMembershipPlans(organizationId);
    if (response.success && response.data) {
      setPlans(response.data);
    } else {
      setPageError(response.message || "Failed to load membership plans");
    }

    setIsLoading(false);
  }, [organizationId]);

  useEffect(() => {
    if (authLoading || orgLoading || !user) return;

    const timerId = window.setTimeout(() => {
      void refreshPlans();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [authLoading, orgLoading, user, refreshPlans]);

  const handleToggleStatus = async (plan: MarketplaceMembershipPlan) => {
    if (!organizationId) return;

    setIsMutatingPlanId(plan._id);
    setPageError("");

    const response = plan.is_active
      ? await marketplaceService.deactivateOrgMembershipPlan(organizationId, plan._id)
      : await marketplaceService.activateOrgMembershipPlan(organizationId, plan._id);

    if (response.success) {
      await refreshPlans();
    } else {
      setPageError(response.message || "Failed to update plan status");
    }

    setIsMutatingPlanId(null);
  };

  const handleDeletePlan = (plan: MarketplaceMembershipPlan) => {
    if (!organizationId) return;

    requestConfirmation({
      title: "Delete plan?",
      description: `Delete \"${plan.name}\" permanently? This action cannot be undone.`,
      confirmLabel: "Delete Plan",
      onConfirm: async () => {
        setIsMutatingPlanId(plan._id);
        const response = await marketplaceService.deleteOrgMembershipPlan(
          organizationId,
          plan._id,
        );

        if (response.success) {
          await refreshPlans();
        } else {
          setPageError(response.message || "Failed to delete plan");
        }

        setIsMutatingPlanId(null);
      },
    });
  };

  const stats = useMemo(() => {
    const activePlans = plans.filter((plan) => plan.is_active).length;
    const activeMembers = plans.reduce((sum, plan) => sum + plan.active_members, 0);
    const averagePrice =
      plans.length > 0
        ? Math.round(plans.reduce((sum, plan) => sum + plan.price, 0) / plans.length)
        : 0;

    return { totalPlans: plans.length, activePlans, activeMembers, averagePrice };
  }, [plans]);

  if (authLoading || orgLoading || isLoading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">Membership Plans</h1>
              <p className="text-foreground/60 mt-1">
                Create and manage your gym&apos;s membership pricing plans
              </p>
            </div>
            <Link
              href="/dashboard/gym-owner/plans/create"
              className="h-12 px-6 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600 transition-colors inline-flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Plan
            </Link>
          </div>

          {pageError && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-800">{pageError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total Plans</p>
              <p className="text-3xl font-black text-foreground mt-2">{stats.totalPlans}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Active Plans</p>
              <p className="text-3xl font-black text-foreground mt-2">{stats.activePlans}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Active Members</p>
              <p className="text-3xl font-black text-foreground mt-2">{stats.activeMembers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Avg Plan Price</p>
              <p className="text-3xl font-black text-foreground mt-2">${stats.averagePrice}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Plan</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Members</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-foreground/60">
                        No membership plans yet. Create your first plan to get started.
                      </td>
                    </tr>
                  ) : (
                    plans.map((plan) => (
                      <tr key={plan._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">{plan.name}</p>
                          {plan.description && (
                            <p className="text-xs text-foreground/60 line-clamp-1 mt-1">{plan.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              plan.plan_type === MembershipPlanType.SUBSCRIPTION
                                ? "bg-accent-blue-100 text-accent-blue-700"
                                : "bg-primary-100 text-primary-700"
                            }`}
                          >
                            {plan.plan_type === MembershipPlanType.SUBSCRIPTION
                              ? "Subscription"
                              : "One-time"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground">
                          {plan.currency} {plan.price}
                        </td>
                        <td className="px-6 py-4 text-foreground/70">{plan.duration_days} days</td>
                        <td className="px-6 py-4 text-foreground/70">{plan.active_members}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              plan.is_active
                                ? "bg-primary-100 text-primary-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {plan.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <Link
                              href={`/dashboard/gym-owner/plans/${plan._id}`}
                              className="text-accent-blue-500 hover:text-accent-blue-700 font-medium"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(plan)}
                              disabled={isMutatingPlanId === plan._id}
                              className="text-foreground/70 hover:text-foreground font-medium disabled:opacity-50"
                            >
                              {plan.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan)}
                              disabled={isMutatingPlanId === plan._id}
                              className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
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
        </div>
      </main>
      {confirmationModal}
    </div>
  );
}
