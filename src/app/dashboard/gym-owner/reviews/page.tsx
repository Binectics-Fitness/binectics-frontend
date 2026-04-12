"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import ProviderReviewsSection from "@/components/ProviderReviewsSection";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { UserRole } from "@/lib/types";
import { useMyOrganizations } from "@/lib/queries/teams";
import { useOrgDashboardStats } from "@/lib/queries/checkins";
import { ReviewTargetType } from "@/lib/api/reviews";

export default function ReviewsPage() {
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
  const { data: orgStats } = useOrgDashboardStats(organizationId);

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

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              Reviews
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              {orgStats
                ? `${(orgStats.average_rating ?? 0).toFixed(1)} average · ${orgStats.review_count ?? 0} reviews`
                : "Manage your gym's member reviews"}
            </p>
          </div>

          {organizationId ? (
            <ProviderReviewsSection
              targetType={ReviewTargetType.GYM}
              targetId={organizationId}
              title="Member Reviews"
              providerOwnerUserId={user?.id ?? null}
              canRespondAsProvider
            />
          ) : (
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-8 text-center">
              <p className="text-foreground/60">
                No organization found. Please complete your gym setup first.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
