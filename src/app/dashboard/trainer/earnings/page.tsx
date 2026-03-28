"use client";

import { useState, useEffect } from "react";
import TrainerSidebar from "@/components/TrainerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { UserRole, MembershipSubscriptionStatus } from "@/lib/types";
import type { MembershipSubscription } from "@/lib/types";
import { marketplaceService } from "@/lib/api/marketplace";
import { formatLocal } from "@/utils/format";

function getMemberName(sub: MembershipSubscription): string {
  if (typeof sub.member_user_id === "object" && sub.member_user_id) {
    return `${sub.member_user_id.first_name} ${sub.member_user_id.last_name}`;
  }
  return "Member";
}

function getPlanName(sub: MembershipSubscription): string {
  if (typeof sub.plan_id === "object" && sub.plan_id) {
    return sub.plan_id.name;
  }
  return "Plan";
}

export default function TrainerEarningsPage() {
  const { user, isLoading, isAuthorized } = useRoleGuard(UserRole.TRAINER);
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const [subscriptions, setSubscriptions] = useState<MembershipSubscription[]>(
    [],
  );
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user || orgLoading) return;
    if (!currentOrg) {
      setLoadingData(false);
      return;
    }

    marketplaceService
      .getOrgMembershipSubscriptions(currentOrg._id)
      .then((res) => {
        if (res.success && res.data) setSubscriptions(res.data);
      })
      .finally(() => setLoadingData(false));
  }, [user, currentOrg, orgLoading]);

  if (isLoading || orgLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const activeSubs = subscriptions.filter(
    (s) => s.status === MembershipSubscriptionStatus.ACTIVE,
  );
  const totalRevenue = subscriptions
    .filter(
      (s) =>
        s.status === MembershipSubscriptionStatus.ACTIVE ||
        s.status === MembershipSubscriptionStatus.EXPIRED,
    )
    .reduce((sum, s) => sum + s.amount_paid, 0);
  const activeRevenue = activeSubs.reduce((sum, s) => sum + s.amount_paid, 0);
  const currency = subscriptions[0]?.currency || "USD";

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <TrainerSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
            Earnings
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Track your revenue from membership subscriptions
          </p>
        </div>

        {!currentOrg ? (
          <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-card)] text-center">
            <EmptyState
              title="No Organization"
              description="Create or join an organization to start tracking earnings from membership plans."
              actionLabel="Go to Dashboard"
              actionHref="/dashboard/trainer"
            />
          </div>
        ) : loadingData ? (
          <DashboardLoading />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                    <svg
                      className="h-6 w-6 text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-secondary">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {currency} {totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue-100">
                    <svg
                      className="h-6 w-6 text-accent-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-secondary">
                      Active Subscriptions
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {activeSubs.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-yellow-100">
                    <svg
                      className="h-6 w-6 text-accent-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-secondary">
                      Active Revenue
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {currency} {activeRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-lg font-bold text-foreground">
                Recent Subscriptions
              </h2>

              {subscriptions.length === 0 ? (
                <EmptyState
                  title="No Subscriptions Yet"
                  description="When clients subscribe to your plans, their subscriptions will appear here."
                  actionLabel="Manage Plans"
                  actionHref="/dashboard/trainer/plans"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 text-left">
                        <th className="pb-3 pr-4 font-semibold text-foreground-secondary">
                          Member
                        </th>
                        <th className="pb-3 pr-4 font-semibold text-foreground-secondary">
                          Plan
                        </th>
                        <th className="pb-3 pr-4 font-semibold text-foreground-secondary">
                          Amount
                        </th>
                        <th className="pb-3 pr-4 font-semibold text-foreground-secondary">
                          Status
                        </th>
                        <th className="pb-3 font-semibold text-foreground-secondary">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {subscriptions.slice(0, 20).map((sub) => (
                        <tr key={sub._id}>
                          <td className="py-3 pr-4 font-medium text-foreground">
                            {getMemberName(sub)}
                          </td>
                          <td className="py-3 pr-4 text-foreground-secondary">
                            {getPlanName(sub)}
                          </td>
                          <td className="py-3 pr-4 font-medium text-foreground">
                            {sub.currency} {sub.amount_paid.toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                sub.status ===
                                MembershipSubscriptionStatus.ACTIVE
                                  ? "bg-primary-100 text-primary-700"
                                  : sub.status ===
                                      MembershipSubscriptionStatus.PENDING_PAYMENT
                                    ? "bg-accent-yellow-100 text-accent-yellow-700"
                                    : sub.status ===
                                        MembershipSubscriptionStatus.EXPIRED
                                      ? "bg-neutral-100 text-neutral-600"
                                      : "bg-red-100 text-red-700"
                              }`}
                            >
                              {sub.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 text-foreground-secondary">
                            {formatLocal(sub.created_at, "MMM d, yyyy")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
