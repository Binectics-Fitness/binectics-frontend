"use client";

import { useState, useEffect } from "react";
import TrainerSidebar from "@/components/TrainerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { UserRole, MembershipSubscriptionStatus } from "@/lib/types";
import type { MembershipSubscription } from "@/lib/types";
import {
  progressService,
  type DashboardStats,
  type ClientProfile,
} from "@/lib/api/progress";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import {
  reviewsService,
  ReviewTargetType,
  type ReviewAggregate,
} from "@/lib/api/reviews";
import { marketplaceService } from "@/lib/api/marketplace";

export default function TrainerAnalyticsPage() {
  const { user, isLoading, isAuthorized } = useRoleGuard(UserRole.TRAINER);
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [reviewAgg, setReviewAgg] = useState<ReviewAggregate | null>(null);
  const [subscriptions, setSubscriptions] = useState<MembershipSubscription[]>(
    [],
  );
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user || orgLoading) return;

    const promises: Promise<void>[] = [];

    promises.push(
      progressService.getDashboardStats().then((res) => {
        if (res.success && res.data) setDashboardStats(res.data);
      }),
    );

    const clientsPromise = currentOrg
      ? progressService.getOrgClientProfiles(currentOrg._id)
      : progressService.getMyClientProfiles();
    promises.push(
      clientsPromise.then((res) => {
        if (res.success && res.data) setClients(res.data);
      }),
    );

    promises.push(
      consultationsService.getProviderBookings({}).then((res) => {
        if (res.success && res.data) setBookings(res.data);
      }),
    );

    promises.push(
      reviewsService
        .getTargetAggregate(ReviewTargetType.TRAINER, user.id)
        .then((res) => {
          if (res.success && res.data) setReviewAgg(res.data);
        }),
    );

    if (currentOrg) {
      promises.push(
        marketplaceService
          .getOrgMembershipSubscriptions(currentOrg._id)
          .then((res) => {
            if (res.success && res.data) setSubscriptions(res.data);
          }),
      );
    }

    Promise.all(promises).finally(() => setLoadingData(false));
  }, [user, currentOrg, orgLoading]);

  if (isLoading || orgLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  if (loadingData)
    return (
      <div className="flex min-h-screen bg-neutral-50">
        <TrainerSidebar />
        <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
          <DashboardLoading />
        </main>
      </div>
    );

  const completedBookings = bookings.filter(
    (b) => b.status === ConsultationBookingStatus.COMPLETED,
  );
  const cancelledBookings = bookings.filter(
    (b) => b.status === ConsultationBookingStatus.CANCELLED,
  );
  const noShowBookings = bookings.filter(
    (b) => b.status === ConsultationBookingStatus.NO_SHOW,
  );
  const completionRate =
    bookings.length > 0
      ? Math.round((completedBookings.length / bookings.length) * 100)
      : 0;
  const activeClients = clients.filter((c) => c.is_active).length;
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

  const hasData =
    (dashboardStats && dashboardStats.total_clients > 0) ||
    bookings.length > 0 ||
    (reviewAgg && reviewAgg.totalReviews > 0);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <TrainerSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Overview of your training performance
          </p>
        </div>

        {!hasData ? (
          <div className="rounded-2xl bg-white p-8 shadow-card">
            <EmptyState
              title="No Data Yet"
              description="Start working with clients to see your analytics here."
              actionLabel="Go to Dashboard"
              actionHref="/dashboard/trainer"
            />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">
                  Total Clients
                </p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {dashboardStats?.total_clients ?? clients.length}
                </p>
                <p className="mt-1 text-sm text-primary-600">
                  {activeClients} active
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">
                  Total Sessions
                </p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {bookings.length}
                </p>
                <p className="mt-1 text-sm text-primary-600">
                  {completedBookings.length} completed
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">Avg Rating</p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {reviewAgg ? reviewAgg.averageRating.toFixed(1) : "—"}
                </p>
                <p className="mt-1 text-sm text-foreground-secondary">
                  {reviewAgg?.totalReviews ?? 0} reviews
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-card">
                <p className="text-sm text-foreground-secondary">
                  Completion Rate
                </p>
                <p className="mt-1 text-3xl font-black text-foreground">
                  {completionRate}%
                </p>
                <p className="mt-1 text-sm text-foreground-secondary">
                  of all sessions
                </p>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Session Breakdown */}
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="mb-4 text-lg font-bold text-foreground">
                  Session Breakdown
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      label: "Completed",
                      count: completedBookings.length,
                      color: "bg-primary-500",
                    },
                    {
                      label: "Cancelled",
                      count: cancelledBookings.length,
                      color: "bg-red-500",
                    },
                    {
                      label: "No Show",
                      count: noShowBookings.length,
                      color: "bg-accent-yellow-500",
                    },
                    {
                      label: "Pending/Confirmed",
                      count:
                        bookings.length -
                        completedBookings.length -
                        cancelledBookings.length -
                        noShowBookings.length,
                      color: "bg-accent-blue-500",
                    },
                  ].map((item) => {
                    const pct =
                      bookings.length > 0
                        ? (item.count / bookings.length) * 100
                        : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">{item.label}</span>
                          <span className="text-foreground-secondary">
                            {item.count}
                          </span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-neutral-100">
                          <div
                            className={`h-2 rounded-full ${item.color} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revenue & Subscriptions */}
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="mb-4 text-lg font-bold text-foreground">
                  Revenue Overview
                </h2>
                {currentOrg ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4">
                      <span className="text-sm text-foreground-secondary">
                        Total Revenue
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {subscriptions[0]?.currency || "USD"}{" "}
                        {totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4">
                      <span className="text-sm text-foreground-secondary">
                        Active Subscriptions
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {activeSubs.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4">
                      <span className="text-sm text-foreground-secondary">
                        Pending Requests
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {dashboardStats?.pending_requests ?? 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground-secondary">
                    Create an organization to track subscription revenue.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
