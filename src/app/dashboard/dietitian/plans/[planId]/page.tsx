"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DietitianSidebar from "@/components/DietitianSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceMembershipPlan } from "@/lib/types";
import { UserRole, MembershipPlanType } from "@/lib/types";

export default function DietitianPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();
  const { user, isLoading: authLoading } = useRoleGuard(UserRole.DIETITIAN);
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const planId = params.planId as string;
  const organizationId = currentOrg?._id;

  const [plan, setPlan] = useState<MarketplaceMembershipPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [pageError, setPageError] = useState("");

  const loadPlan = useCallback(async () => {
    if (!organizationId || !planId) return;
    setIsLoading(true);
    setPageError("");
    const response = await marketplaceService.getOrgMembershipPlanById(
      organizationId,
      planId,
    );
    if (response.success && response.data) {
      setPlan(response.data);
    } else {
      setPageError(response.message || "Failed to load plan");
    }
    setIsLoading(false);
  }, [organizationId, planId]);

  useEffect(() => {
    if (authLoading || orgLoading || !user) return;
    void loadPlan();
  }, [authLoading, orgLoading, user, loadPlan]);

  const handleToggleStatus = async () => {
    if (!organizationId || !plan) return;
    setIsMutating(true);
    const response = plan.is_active
      ? await marketplaceService.deactivateOrgMembershipPlan(
          organizationId,
          plan._id,
        )
      : await marketplaceService.activateOrgMembershipPlan(
          organizationId,
          plan._id,
        );
    if (response.success && response.data) setPlan(response.data);
    else setPageError(response.message || "Failed to update plan status");
    setIsMutating(false);
  };

  const handleDeletePlan = () => {
    if (!organizationId || !plan) return;
    requestConfirmation({
      title: "Delete plan?",
      description:
        "All active subscriptions should be migrated before deleting this plan.",
      confirmLabel: "Delete Plan",
      onConfirm: async () => {
        setIsMutating(true);
        const response = await marketplaceService.deleteOrgMembershipPlan(
          organizationId,
          plan._id,
        );
        if (response.success) {
          router.push("/dashboard/dietitian/plans");
          return;
        }
        setPageError(response.message || "Failed to delete plan");
        setIsMutating(false);
      },
    });
  };

  if (authLoading || orgLoading || isLoading) return <DashboardLoading />;

  if (!user || !plan) {
    return (
      <div className="flex min-h-screen bg-background">
        <DietitianSidebar />
        <main className="md:ml-64 flex-1 p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-foreground/70">
              {pageError || "Plan not found"}
            </p>
            <Link
              href="/dashboard/dietitian/plans"
              className="inline-flex mt-4 text-accent-purple-500 hover:text-accent-purple-700 font-medium"
            >
              Back to plans
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DietitianSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push("/dashboard/dietitian/plans")}
            className="text-accent-purple-500 hover:text-accent-purple-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
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
            Back to Plans
          </button>

          {pageError && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-800">{pageError}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">
                {plan.name}
              </h1>
              <p className="text-foreground/60 mt-1">
                {plan.description || "No description provided"}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/dietitian/plans/${plan._id}/edit`}
                className="px-4 py-2 border-2 border-accent-purple-500 text-accent-purple-700 font-semibold rounded-lg hover:bg-accent-purple-50"
              >
                Edit Plan
              </Link>
              <button
                onClick={handleDeletePlan}
                disabled={isMutating}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                Delete Plan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">Price</p>
              <p className="text-3xl font-black text-foreground mt-2">
                {plan.currency} {plan.price}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">Duration</p>
              <p className="text-3xl font-black text-foreground mt-2">
                {plan.duration_days}d
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">Type</p>
              <p className="text-3xl font-black text-foreground mt-2">
                {plan.plan_type === MembershipPlanType.SUBSCRIPTION
                  ? "Sub"
                  : "One"}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">Status</p>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mt-2 ${plan.is_active ? "bg-primary-100 text-primary-700" : "bg-neutral-100 text-neutral-700"}`}
              >
                {plan.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Plan Features
            </h3>
            {plan.features.length === 0 ? (
              <p className="text-sm text-foreground/50">
                No features configured.
              </p>
            ) : (
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-foreground"
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-accent-purple-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleToggleStatus}
                disabled={isMutating}
                className="px-4 py-2 border-2 border-foreground/20 text-foreground font-semibold rounded-lg hover:bg-foreground/5 disabled:opacity-50"
              >
                {plan.is_active ? "Deactivate Plan" : "Activate Plan"}
              </button>
              <button
                onClick={handleDeletePlan}
                disabled={isMutating}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      </main>
      {confirmationModal}
    </div>
  );
}
