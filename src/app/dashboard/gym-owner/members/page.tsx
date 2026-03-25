"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  MembershipSubscription,
  MembershipSubscriptionStatus,
  MembershipPlanType,
} from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────

function getMember(sub: MembershipSubscription) {
  if (typeof sub.member_user_id === "object" && sub.member_user_id !== null) {
    return sub.member_user_id;
  }
  return null;
}

function getMemberName(sub: MembershipSubscription) {
  const m = getMember(sub);
  return m ? `${m.first_name} ${m.last_name}` : "Unknown Member";
}

function getMemberEmail(sub: MembershipSubscription) {
  const m = getMember(sub);
  return m?.email ?? "";
}

function getPlanName(sub: MembershipSubscription) {
  if (typeof sub.plan_id === "object" && sub.plan_id !== null) {
    return sub.plan_id.name;
  }
  return "Membership Plan";
}

function getPlanType(sub: MembershipSubscription) {
  if (typeof sub.plan_id === "object" && sub.plan_id !== null) {
    return sub.plan_id.plan_type;
  }
  return null;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadge(status: MembershipSubscriptionStatus) {
  switch (status) {
    case MembershipSubscriptionStatus.ACTIVE:
      return "bg-primary-500/10 text-primary-700";
    case MembershipSubscriptionStatus.EXPIRED:
      return "bg-gray-100 text-gray-600";
    case MembershipSubscriptionStatus.CANCELLED:
      return "bg-red-100 text-red-700";
    case MembershipSubscriptionStatus.PENDING_PAYMENT:
      return "bg-accent-yellow-500/20 text-foreground";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function statusLabel(status: MembershipSubscriptionStatus) {
  return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isNewThisMonth(sub: MembershipSubscription) {
  const now = new Date();
  const created = new Date(sub.created_at);
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth()
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function GymOwnerMembersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const [subscriptions, setSubscriptions] = useState<MembershipSubscription[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    MembershipSubscriptionStatus | "all"
  >("all");
  const [planFilter, setPlanFilter] = useState("all");

  const organizationId = currentOrg?._id;

  const loadMembers = useCallback(async () => {
    if (!organizationId) {
      setSubscriptions([]);
      setIsLoading(false);
      return;
    }
    setPageError("");
    setIsLoading(true);
    const response =
      await marketplaceService.getOrgMembershipSubscriptions(organizationId);
    if (response.success && response.data) {
      setSubscriptions(response.data);
    } else {
      setPageError(response.message ?? "Failed to load members");
    }
    setIsLoading(false);
  }, [organizationId]);

  useEffect(() => {
    if (authLoading || orgLoading || !user) return;
    const id = window.setTimeout(() => void loadMembers(), 0);
    return () => window.clearTimeout(id);
  }, [authLoading, orgLoading, user, loadMembers]);

  const uniquePlanNames = useMemo(() => {
    const names = new Set(subscriptions.map(getPlanName));
    return Array.from(names).sort();
  }, [subscriptions]);

  const filtered = useMemo(() => {
    return subscriptions.filter((sub) => {
      if (statusFilter !== "all" && sub.status !== statusFilter) return false;
      if (planFilter !== "all" && getPlanName(sub) !== planFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = getMemberName(sub).toLowerCase();
        const email = getMemberEmail(sub).toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      return true;
    });
  }, [subscriptions, statusFilter, planFilter, searchQuery]);

  const stats = useMemo(
    () => ({
      total: subscriptions.length,
      active: subscriptions.filter(
        (s) => s.status === MembershipSubscriptionStatus.ACTIVE,
      ).length,
      expired: subscriptions.filter(
        (s) =>
          s.status === MembershipSubscriptionStatus.EXPIRED ||
          s.status === MembershipSubscriptionStatus.CANCELLED,
      ).length,
      newThisMonth: subscriptions.filter(isNewThisMonth).length,
    }),
    [subscriptions],
  );

  if (authLoading || orgLoading) return <DashboardLoading />;
  if (!user) return <DashboardLoading />;

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">Members</h1>
            <p className="text-foreground/60 mt-1">
              Manage your gym members and subscriptions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
            <div className="bg-white shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">
                Total Subscriptions
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {stats.total}
              </p>
            </div>
            <div className="bg-white shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Active</p>
              <p className="text-3xl font-black text-primary-700 mt-2">
                {stats.active}
              </p>
            </div>
            <div className="bg-white shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">
                Expired / Cancelled
              </p>
              <p className="text-3xl font-black text-red-500 mt-2">
                {stats.expired}
              </p>
            </div>
            <div className="bg-white shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">
                New This Month
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {stats.newThisMonth}
              </p>
            </div>
          </div>

          {pageError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
              {pageError}
            </div>
          )}

          <div className="bg-white shadow-card p-4 mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-blue-500 text-sm"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as MembershipSubscriptionStatus | "all",
                  )
                }
                className="px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue-500 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value={MembershipSubscriptionStatus.ACTIVE}>
                  Active
                </option>
                <option value={MembershipSubscriptionStatus.EXPIRED}>
                  Expired
                </option>
                <option value={MembershipSubscriptionStatus.CANCELLED}>
                  Cancelled
                </option>
                <option value={MembershipSubscriptionStatus.PENDING_PAYMENT}>
                  Pending Payment
                </option>
              </select>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue-500 bg-white"
              >
                <option value="all">All Plans</option>
                {uniquePlanNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white shadow-card overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 animate-pulse rounded"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-4xl mb-4">👥</p>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {subscriptions.length === 0
                    ? "No members yet"
                    : "No results match your filters"}
                </h3>
                <p className="text-sm text-foreground/60">
                  {subscriptions.length === 0
                    ? "Members will appear here once they subscribe to one of your plans."
                    : "Try adjusting your search or filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                        Member
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                        Plan
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                        Amount Paid
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                        Started
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                        Expires
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((sub) => {
                      const planType = getPlanType(sub);
                      return (
                        <tr key={sub._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-foreground">
                              {getMemberName(sub)}
                            </p>
                            {getMemberEmail(sub) && (
                              <p className="text-sm text-foreground/60">
                                {getMemberEmail(sub)}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-foreground font-medium">
                              {getPlanName(sub)}
                            </p>
                            {planType && (
                              <span
                                className={`text-xs px-2 py-0.5 font-semibold ${
                                  planType === MembershipPlanType.SUBSCRIPTION
                                    ? "bg-accent-blue-500/10 text-accent-blue-500"
                                    : "bg-accent-yellow-500/20 text-foreground"
                                }`}
                              >
                                {planType === MembershipPlanType.SUBSCRIPTION
                                  ? "Subscription"
                                  : "One-time"}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold ${statusBadge(sub.status)}`}
                            >
                              {statusLabel(sub.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-foreground font-medium">
                            {sub.currency} {sub.amount_paid.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-foreground/70 text-sm">
                            {formatDate(sub.start_date)}
                          </td>
                          <td className="px-6 py-4 text-foreground/70 text-sm">
                            {formatDate(sub.end_date)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-sm text-foreground/60">
                  Showing {filtered.length} of {subscriptions.length}{" "}
                  {subscriptions.length === 1
                    ? "subscription"
                    : "subscriptions"}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
