"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  MembershipSubscription,
  MembershipSubscriptionStatus,
  MembershipPlanType,
} from "@/lib/types";

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusColor(status: MembershipSubscriptionStatus) {
  switch (status) {
    case MembershipSubscriptionStatus.ACTIVE:
      return "bg-primary-500/10 text-primary-700";
    case MembershipSubscriptionStatus.EXPIRED:
      return "bg-gray-100 text-gray-600";
    case MembershipSubscriptionStatus.CANCELLED:
      return "bg-red-50 text-red-600";
    case MembershipSubscriptionStatus.PENDING_PAYMENT:
      return "bg-accent-yellow-500/20 text-foreground";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function statusLabel(status: MembershipSubscriptionStatus) {
  return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<MembershipSubscription[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await marketplaceService.getMyMembershipSubscriptions();
      if (response.success && response.data) {
        setSubscriptions(response.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.setTimeout(() => void loadSubscriptions(), 0);
  }, [loadSubscriptions]);

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;
    setCancellingId(subscriptionId);
    try {
      const response =
        await marketplaceService.cancelMembershipSubscription(subscriptionId);
      if (response.success) {
        void loadSubscriptions();
      }
    } finally {
      setCancellingId(null);
    }
  };

  const getPlanName = (sub: MembershipSubscription) => {
    if (typeof sub.plan_id === "object" && sub.plan_id !== null) {
      return sub.plan_id.name;
    }
    return "Membership Plan";
  };

  const getPlanDetails = (sub: MembershipSubscription) => {
    if (typeof sub.plan_id === "object" && sub.plan_id !== null) {
      return sub.plan_id;
    }
    return null;
  };

  const getListingLabel = (sub: MembershipSubscription) => {
    if (typeof sub.listing_id === "object" && sub.listing_id !== null) {
      return sub.listing_id.headline;
    }
    return null;
  };

  const activeCount = subscriptions.filter(
    (s) => s.status === MembershipSubscriptionStatus.ACTIVE,
  ).length;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground mb-2">
              My Subscriptions
            </h1>
            <p className="text-foreground/60">
              Manage your gym and trainer memberships
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-3">
            <div className="bg-white p-4 shadow-card">
              <p className="text-sm text-foreground/60 mb-1">Total</p>
              <p className="text-2xl font-black text-foreground">
                {subscriptions.length}
              </p>
            </div>
            <div className="bg-white p-4 shadow-card">
              <p className="text-sm text-foreground/60 mb-1">Active</p>
              <p className="text-2xl font-black text-primary-700">
                {activeCount}
              </p>
            </div>
            <div className="col-span-2 bg-white p-4 shadow-card sm:col-span-1">
              <p className="text-sm text-foreground/60 mb-1">
                Total Invested
              </p>
              <p className="text-2xl font-black text-foreground">
                {subscriptions
                  .filter((s) => s.status !== MembershipSubscriptionStatus.CANCELLED)
                  .reduce((sum, s) => sum + s.amount_paid, 0)
                  .toLocaleString()}{" "}
                <span className="text-base font-normal">
                  {subscriptions[0]?.currency ?? "USD"}
                </span>
              </p>
            </div>
          </div>

          {/* Explore CTA */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => router.push("/gyms")}
              className="px-5 py-2.5 bg-accent-blue-500 text-white font-semibold text-sm hover:bg-accent-blue-600 transition-colors"
            >
              Explore Gyms
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white animate-pulse shadow-card"
                />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="bg-white p-12 shadow-card text-center">
              <p className="text-4xl mb-4">🏋️</p>
              <h2 className="text-xl font-bold text-foreground mb-2">
                No subscriptions yet
              </h2>
              <p className="text-foreground/60 mb-6">
                Browse gyms and trainers to find a plan that works for you.
              </p>
              <button
                onClick={() => router.push("/gyms")}
                className="px-6 py-3 bg-primary-500 text-foreground font-semibold hover:bg-primary-600 transition-colors"
              >
                Browse Gyms
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => {
                const planDetails = getPlanDetails(sub);
                const listingLabel = getListingLabel(sub);
                return (
                  <div key={sub._id} className="bg-white p-6 shadow-card">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground text-lg">
                            {getPlanName(sub)}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 font-semibold ${statusColor(sub.status)}`}
                          >
                            {statusLabel(sub.status)}
                          </span>
                          {planDetails && (
                            <span
                              className={`text-xs px-2 py-0.5 font-semibold ${
                                planDetails.plan_type ===
                                MembershipPlanType.SUBSCRIPTION
                                  ? "bg-accent-blue-500/10 text-accent-blue-500"
                                  : "bg-accent-yellow-500/20 text-foreground"
                              }`}
                            >
                              {planDetails.plan_type ===
                              MembershipPlanType.SUBSCRIPTION
                                ? "Subscription"
                                : "One-time"}
                            </span>
                          )}
                        </div>
                        {listingLabel && (
                          <p className="text-sm text-foreground/60 mb-2">
                            {listingLabel}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
                          <span>
                            <span className="font-medium text-foreground">
                              {sub.currency} {sub.amount_paid.toLocaleString()}
                            </span>{" "}
                            paid
                          </span>
                          <span>
                            Started:{" "}
                            <span className="font-medium text-foreground">
                              {formatDate(sub.start_date)}
                            </span>
                          </span>
                          {sub.end_date && (
                            <span>
                              {sub.status === MembershipSubscriptionStatus.ACTIVE
                                ? "Expires:"
                                : "Expired:"}{" "}
                              <span className="font-medium text-foreground">
                                {formatDate(sub.end_date)}
                              </span>
                            </span>
                          )}
                        </div>
                        {planDetails?.features &&
                          planDetails.features.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {planDetails.features
                                .slice(0, 3)
                                .map((f, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-gray-100 text-foreground/70 px-2 py-0.5"
                                  >
                                    {f}
                                  </span>
                                ))}
                              {planDetails.features.length > 3 && (
                                <span className="text-xs text-foreground/50">
                                  +{planDetails.features.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                      {sub.status === MembershipSubscriptionStatus.ACTIVE && (
                        <div className="shrink-0">
                          <button
                            onClick={() => void handleCancel(sub._id)}
                            disabled={cancellingId === sub._id}
                            className="px-4 py-2 border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === sub._id
                              ? "Cancelling..."
                              : "Cancel"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

