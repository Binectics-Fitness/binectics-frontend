"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLoading from "@/components/DashboardLoading";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { checkinsService } from "@/lib/api/checkins";
import {
  MemberStatus,
  teamsService,
  type OrganizationMember,
  type TeamRole,
} from "@/lib/api/teams";
import { type OrgCheckInDashboardStats } from "@/lib/types";
import { formatLocal } from "@/utils/format";

const STATUS_STYLES: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: "bg-primary-100 text-primary-700",
  [MemberStatus.PENDING]: "bg-yellow-100 text-yellow-700",
  [MemberStatus.INACTIVE]: "bg-neutral-100 text-neutral-700",
};

function getMemberUser(member: OrganizationMember) {
  return typeof member.user_id === "object" && member.user_id !== null
    ? member.user_id
    : null;
}

function getMemberRole(member: OrganizationMember): TeamRole | null {
  return typeof member.team_role_id === "object" && member.team_role_id !== null
    ? member.team_role_id
    : null;
}

function getMemberName(member: OrganizationMember): string {
  const user = getMemberUser(member);
  if (!user) return "Unknown team member";
  return `${user.first_name} ${user.last_name}`.trim();
}

function formatStatusLabel(status: MemberStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function TrainerRevenuePage() {
  const params = useParams<{ trainerId: string }>();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated: isAuthorized } =
    useRequireAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const trainerId = params.trainerId;
  const [member, setMember] = useState<OrganizationMember | null>(null);
  const [orgStats, setOrgStats] = useState<OrgCheckInDashboardStats | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || orgLoading || !isAuthorized) return;
    if (!currentOrg?._id) {
      setMember(null);
      setOrgStats(null);
      setIsLoading(false);
      return;
    }

    const organizationId = currentOrg._id;
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [membersResponse, statsResponse] = await Promise.all([
          teamsService.getMembers(organizationId),
          checkinsService.getOrgDashboardStats(organizationId),
        ]);

        if (!mounted) return;

        if (membersResponse.success && membersResponse.data) {
          const matchedMember = membersResponse.data.find(
            (entry) => entry._id === trainerId,
          );
          setMember(matchedMember ?? null);
          if (!matchedMember) {
            setError("Team member not found in the current organization.");
          }
        } else {
          setMember(null);
          setError(
            membersResponse.message ?? "Failed to load staff member details.",
          );
        }

        if (statsResponse.success && statsResponse.data) {
          setOrgStats(statsResponse.data);
        } else {
          setOrgStats(null);
        }
      } catch {
        if (mounted) {
          setMember(null);
          setOrgStats(null);
          setError("Failed to load revenue details.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, [authLoading, currentOrg?._id, isAuthorized, orgLoading, trainerId]);

  const role = useMemo(() => (member ? getMemberRole(member) : null), [member]);

  if (authLoading || orgLoading || isLoading) {
    return <DashboardLoading />;
  }

  if (!isAuthorized) {
    return null;
  }

  if (!currentOrg || !member) {
    return (
      <div className="flex min-h-screen bg-neutral-50">
        <GymOwnerSidebar />
        <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-[var(--shadow-card)]">
            <button
              onClick={() => router.push("/dashboard/gym-owner/staff")}
              className="mb-4 inline-flex items-center gap-2 font-medium text-accent-blue-500 hover:text-accent-blue-700"
            >
              <svg
                className="h-5 w-5"
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
              Back to Staff
            </button>
            <h1 className="text-2xl font-black text-foreground">
              Revenue details unavailable
            </h1>
            <p className="mt-2 text-foreground/60">
              {error ?? "We could not find this team member."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const joinedLabel = member.joined_at
    ? formatLocal(member.joined_at, "MMM d, yyyy")
    : formatLocal(member.created_at, "MMM d, yyyy");

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <button
            onClick={() =>
              router.push(`/dashboard/gym-owner/staff/${trainerId}`)
            }
            className="inline-flex items-center gap-2 font-medium text-accent-blue-500 hover:text-accent-blue-700"
          >
            <svg
              className="h-5 w-5"
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
            Back to Staff Member
          </button>

          <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h1 className="text-3xl font-black text-foreground">
              Revenue Operations
            </h1>
            <p className="mt-1 text-foreground/60">
              {getMemberName(member)} • {role?.name ?? "Unassigned role"} •
              Member since {joinedLabel}
            </p>
            <div className="mt-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[member.status]}`}
              >
                {formatStatusLabel(member.status)}
              </span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm font-medium text-foreground/60">
                Revenue Today
              </p>
              <p className="mt-2 text-3xl font-black text-foreground">
                ${orgStats ? orgStats.revenue_today.toLocaleString() : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm font-medium text-foreground/60">
                Revenue This Week
              </p>
              <p className="mt-2 text-3xl font-black text-foreground">
                ${orgStats ? orgStats.revenue_week.toLocaleString() : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm font-medium text-foreground/60">
                Revenue This Month
              </p>
              <p className="mt-2 text-3xl font-black text-foreground">
                ${orgStats ? orgStats.revenue_month.toLocaleString() : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm font-medium text-foreground/60">
                Active Members
              </p>
              <p className="mt-2 text-3xl font-black text-foreground">
                {orgStats ? orgStats.active_members.toLocaleString() : "—"}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-bold text-foreground">
                Scope of this view
              </h2>
              <p className="mt-3 text-sm leading-6 text-foreground/70">
                Revenue in this section reflects organization-level earnings
                from active memberships and check-ins. Individual staff split
                controls are not yet backed by the API, so this page now avoids
                mock split calculators.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-bold text-foreground">
                Next actions
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/dashboard/gym-owner/revenue")}
                  className="rounded-lg bg-accent-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-blue-600"
                >
                  Open Revenue Dashboard
                </button>
                <button
                  onClick={() =>
                    router.push(`/dashboard/gym-owner/staff/${trainerId}`)
                  }
                  className="rounded-lg border-2 border-neutral-300 px-4 py-2 text-sm font-semibold text-foreground hover:bg-neutral-50"
                >
                  Back to Staff Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
