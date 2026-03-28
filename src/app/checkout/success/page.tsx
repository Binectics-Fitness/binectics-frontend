"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceService } from "@/lib/api/marketplace";
import type {
  MarketplaceListing,
  MarketplaceMembershipPlan,
} from "@/lib/types";
import { MembershipPlanType } from "@/lib/types";
import DashboardLoading from "@/components/DashboardLoading";
import { Button } from "@/components/Button";
import { formatPrice } from "@/lib/api/payment";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const listingId = searchParams.get("listing");
  const planId = searchParams.get("plan");

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [plan, setPlan] = useState<MarketplaceMembershipPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!listingId || !planId) return;
    setLoading(true);
    try {
      const [listingRes, plansRes] = await Promise.all([
        marketplaceService.getListingById(listingId),
        marketplaceService.getPublicListingPlans(listingId),
      ]);
      if (listingRes.success && listingRes.data) setListing(listingRes.data);
      if (plansRes.success && plansRes.data) {
        const p = plansRes.data.find((p) => p._id === planId);
        if (p) setPlan(p);
      }
    } finally {
      setLoading(false);
    }
  }, [listingId, planId]);

  useEffect(() => {
    if (!authLoading && user) void loadData();
  }, [user, authLoading, loadData]);

  if (authLoading || loading) return <DashboardLoading />;

  const displayName =
    listing && typeof listing.professional_id === "object"
      ? `${listing.professional_id.first_name} ${listing.professional_id.last_name}`
      : (listing?.headline ?? "Provider");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] p-6 sm:p-10 max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground mb-3">
          Subscription Activated!
        </h1>
        <p className="text-foreground-secondary mb-8">
          Your subscription has been successfully activated. You now have access
          to all included services.
        </p>

        {plan && (
          <div className="bg-neutral-50 rounded-xl p-5 mb-8 text-left">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">Provider</span>
                <span className="font-medium text-foreground">
                  {displayName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">Plan</span>
                <span className="font-medium text-foreground">{plan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">Type</span>
                <span className="font-medium text-foreground">
                  {plan.plan_type === MembershipPlanType.SUBSCRIPTION
                    ? "Subscription"
                    : "One-time"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">Duration</span>
                <span className="font-medium text-foreground">
                  {plan.duration_days} days
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-neutral-200 pt-2 mt-2">
                <span className="font-semibold text-foreground">Amount</span>
                <span className="font-bold text-foreground">
                  {plan.price === 0
                    ? "Free"
                    : formatPrice(plan.price, plan.currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => router.push("/dashboard/subscriptions")}
            className="flex-1"
          >
            View My Subscriptions
          </Button>
          <Button
            onClick={() => router.push("/marketplace")}
            variant="secondary"
            className="flex-1"
          >
            Browse Marketplace
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <SuccessContent />
    </Suspense>
  );
}
