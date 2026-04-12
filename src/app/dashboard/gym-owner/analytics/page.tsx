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

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0 });
}

export default function GymOwnerAnalyticsPage() {
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

  const todayCI = orgStats?.today_check_ins ?? 0;
  const weekCI = orgStats?.week_check_ins ?? 0;
  const monthCI = orgStats?.month_check_ins ?? 0;

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-8">
            Analytics
          </h1>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
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
                Monthly Revenue
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {statsLoading
                  ? "—"
                  : `$${fmt(orgStats?.revenue_month ?? 0)}`}
              </p>
            </div>
          </div>

          {/* Check-in Stats */}
          <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6 mb-8">
            <h3 className="text-lg font-bold text-foreground mb-6">
              Check-in Activity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-foreground/60">Today</p>
                <p className="text-2xl font-black text-foreground mt-1">
                  {statsLoading ? "—" : fmt(todayCI)}
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-foreground/60">
                  This Week
                </p>
                <p className="text-2xl font-black text-foreground mt-1">
                  {statsLoading ? "—" : fmt(weekCI)}
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-foreground/60">
                  This Month
                </p>
                <p className="text-2xl font-black text-foreground mt-1">
                  {statsLoading ? "—" : fmt(monthCI)}
                </p>
              </div>
            </div>

            {/* Simple visual bar comparison */}
            {!statsLoading && monthCI > 0 && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground/60">Today</span>
                    <span className="font-semibold">{fmt(todayCI)}</span>
                  </div>
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (todayCI / monthCI) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground/60">This Week</span>
                    <span className="font-semibold">{fmt(weekCI)}</span>
                  </div>
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-blue-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (weekCI / monthCI) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground/60">This Month</span>
                    <span className="font-semibold">{fmt(monthCI)}</span>
                  </div>
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-purple-500 rounded-full w-full" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Revenue Comparison */}
          <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
            <h3 className="text-lg font-bold text-foreground mb-6">
              Revenue Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-foreground/60">Today</p>
                <p className="text-2xl font-black text-foreground mt-1">
                  {statsLoading
                    ? "—"
                    : `$${fmt(orgStats?.revenue_today ?? 0)}`}
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-foreground/60">
                  This Week
                </p>
                <p className="text-2xl font-black text-foreground mt-1">
                  {statsLoading
                    ? "—"
                    : `$${fmt(orgStats?.revenue_week ?? 0)}`}
                </p>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-sm font-medium text-foreground/60">
                  This Month
                </p>
                <p className="text-2xl font-black text-primary-600 mt-1">
                  {statsLoading
                    ? "—"
                    : `$${fmt(orgStats?.revenue_month ?? 0)}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
