"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { UserRole } from "@/lib/types";
import { useMyOrganizations } from "@/lib/queries/teams";
import { useOrgDashboardStats } from "@/lib/queries/checkins";
import { formatCurrency } from "@/utils/format";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0 });
}

export default function GymOwnerRevenuePage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated: isAuthorized } =
    useRequireAuth();
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const organizationId = currentOrg?._id;
  const [canView, setCanView] = useState(false);
  const [resolving, setResolving] = useState(true);

  const isNonOwnerRole =
    !authLoading &&
    isAuthorized &&
    !!user &&
    user.role !== UserRole.GYM_OWNER &&
    user.role !== UserRole.ADMIN;

  const { data: myOrgs } = useMyOrganizations(isNonOwnerRole);
  const { data: orgStats, isLoading: statsLoading } =
    useOrgDashboardStats(organizationId);

  useEffect(() => {
    if (authLoading || !isAuthorized || !user) return;
    if (user.role === UserRole.GYM_OWNER || user.role === UserRole.ADMIN) {
      setCanView(true);
      setResolving(false);
      return;
    }
    if (myOrgs === undefined) return;
    if (myOrgs.some((o) => o.is_owner)) {
      setCanView(true);
    } else {
      router.replace("/dashboard");
    }
    setResolving(false);
  }, [authLoading, isAuthorized, user, myOrgs, router]);

  if (authLoading || resolving) return <DashboardLoading />;
  if (!isAuthorized || !canView) return null;

  const today = orgStats?.revenue_today ?? 0;
  const week = orgStats?.revenue_week ?? 0;
  const month = orgStats?.revenue_month ?? 0;
  const currency = currentOrg?.currency || "USD";

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              Revenue &amp; Earnings
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              Track your gym&apos;s financial performance
            </p>
          </div>

          {/* Revenue Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">Today</p>
              <p className="text-3xl font-black text-foreground mt-2">
                {statsLoading ? "—" : formatCurrency(today, currency)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                This Week
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {statsLoading ? "—" : formatCurrency(week, currency)}
              </p>
            </div>
            <div className="bg-primary-50 border-2 border-primary-200 rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                This Month
              </p>
              <p className="text-3xl font-black text-primary-600 mt-2">
                {statsLoading ? "—" : formatCurrency(month, currency)}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                Active Members
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {statsLoading ? "—" : fmt(orgStats?.active_members ?? 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                Avg. Rating
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {statsLoading
                  ? "—"
                  : (orgStats?.average_rating ?? 0).toFixed(1)}
              </p>
              <p className="text-sm text-foreground/60 mt-1">
                {statsLoading ? "" : `${orgStats?.review_count ?? 0} reviews`}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                Check-ins This Month
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {statsLoading ? "—" : fmt(orgStats?.month_check_ins ?? 0)}
              </p>
            </div>
          </div>

          {/* Revenue Breakdown Visual */}
          <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6 mb-8">
            <h3 className="text-lg font-bold text-foreground mb-6">
              Revenue Breakdown
            </h3>
            {statsLoading ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-foreground/60">Loading revenue data…</p>
              </div>
            ) : month === 0 ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-foreground/60">
                  No revenue recorded this month yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bar: Today */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground/60">Today</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(today, currency)}
                    </span>
                  </div>
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (today / month) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                {/* Bar: This Week */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground/60">This Week</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(week, currency)}
                    </span>
                  </div>
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-blue-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (week / month) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                {/* Bar: This Month */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground/60">This Month</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(month, currency)}
                    </span>
                  </div>
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-purple-500 rounded-full w-full" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Check-ins */}
          {orgStats?.recent_check_ins &&
            orgStats.recent_check_ins.length > 0 && (
              <div className="bg-white rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200">
                  <h3 className="text-lg font-bold text-foreground">
                    Recent Check-ins
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {orgStats.recent_check_ins.slice(0, 10).map((ci) => {
                    const memberName =
                      typeof ci.member_user_id === "object" &&
                      ci.member_user_id
                        ? `${ci.member_user_id.first_name} ${ci.member_user_id.last_name}`
                        : "Member";
                    return (
                      <div
                        key={ci._id}
                        className="px-6 py-3 flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {memberName}
                        </span>
                        <span className="text-sm text-foreground/60">
                          {new Date(ci.checked_in_at).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
