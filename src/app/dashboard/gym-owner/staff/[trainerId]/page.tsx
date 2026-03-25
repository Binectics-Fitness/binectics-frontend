"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLoading from "@/components/DashboardLoading";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  MemberStatus,
  teamsService,
  type OrganizationMember,
  type TeamRole,
} from "@/lib/api/teams";
import { formatLocal } from "@/utils/format";

const STATUS_STYLES: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: "bg-primary-100 text-primary-700",
  [MemberStatus.PENDING]: "bg-yellow-100 text-yellow-700",
  [MemberStatus.INACTIVE]: "bg-gray-100 text-gray-700",
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

function getMemberInitials(member: OrganizationMember): string {
  const user = getMemberUser(member);
  if (!user) return "?";
  return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
}

function getStatusLabel(status: MemberStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function TrainerDetailPage() {
  const params = useParams<{ trainerId: string }>();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated: isAuthorized } =
    useRequireAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const trainerId = params.trainerId;
  const [member, setMember] = useState<OrganizationMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  useEffect(() => {
    if (authLoading || orgLoading || !isAuthorized) return;
    if (!currentOrg?._id) {
      setMember(null);
      setIsLoading(false);
      return;
    }
    const organizationId = currentOrg._id;

    let mounted = true;

    async function loadMember() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await teamsService.getMembers(organizationId);

        if (!mounted) return;

        if (!response.success || !response.data) {
          setMember(null);
          setError(response.message ?? "Failed to load this team member.");
          return;
        }

        const matchedMember = response.data.find(
          (entry) => entry._id === trainerId,
        );

        if (!matchedMember) {
          setMember(null);
          setError(
            "This team member could not be found in the selected organization.",
          );
          return;
        }

        setMember(matchedMember);
      } catch {
        if (mounted) {
          setMember(null);
          setError("Failed to load this team member.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMember();

    return () => {
      mounted = false;
    };
  }, [authLoading, currentOrg?._id, isAuthorized, orgLoading, trainerId]);

  const role = useMemo(() => {
    if (!member) return null;
    return getMemberRole(member);
  }, [member]);

  async function updateMemberStatus(nextStatus: MemberStatus) {
    if (!currentOrg?._id || !member) return;

    setIsUpdating(true);
    setError(null);
    try {
      const response = await teamsService.updateMember(
        currentOrg._id,
        member._id,
        {
          status: nextStatus,
        },
      );

      if (response.success && response.data) {
        setMember(response.data);
      } else {
        setError(response.message ?? "Failed to update team member status.");
      }
    } catch {
      setError("Failed to update team member status.");
    } finally {
      setIsUpdating(false);
    }
  }

  function handleToggleStatus() {
    if (!member) return;

    const nextStatus =
      member.status === MemberStatus.ACTIVE
        ? MemberStatus.INACTIVE
        : MemberStatus.ACTIVE;

    requestConfirmation({
      title:
        nextStatus === MemberStatus.ACTIVE
          ? "Reactivate this staff member?"
          : "Pause this staff member?",
      description:
        nextStatus === MemberStatus.ACTIVE
          ? "This restores dashboard access for the selected team member."
          : "This removes active dashboard access until you restore the member again.",
      confirmLabel:
        nextStatus === MemberStatus.ACTIVE
          ? "Reactivate Member"
          : "Pause Member",
      confirmVariant: nextStatus === MemberStatus.ACTIVE ? "primary" : "danger",
      onConfirm: async () => {
        await updateMemberStatus(nextStatus);
      },
    });
  }

  function handleRemoveMember() {
    if (!currentOrg?._id || !member) return;

    requestConfirmation({
      title: "Remove this staff member?",
      description:
        "This removes the member from the organization. They will lose team access immediately.",
      confirmLabel: "Remove Member",
      onConfirm: async () => {
        const response = await teamsService.removeMember(
          currentOrg._id,
          member._id,
        );
        if (!response.success) {
          throw new Error(response.message ?? "Failed to remove team member.");
        }
        router.push("/dashboard/gym-owner/staff");
      },
    });
  }

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
          <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-card">
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
              Staff member unavailable
            </h1>
            <p className="mt-2 text-foreground/60">
              {error ?? "We could not load this team member."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const user = getMemberUser(member);
  const joinedLabel = member.joined_at
    ? formatLocal(member.joined_at, "MMM d, yyyy")
    : formatLocal(member.created_at, "MMM d, yyyy");

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <button
            onClick={() => router.push("/dashboard/gym-owner/staff")}
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
            Back to Staff
          </button>

          <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-card lg:flex-row lg:items-start lg:justify-between lg:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-blue-500 text-2xl font-bold text-white">
                {getMemberInitials(member)}
              </div>
              <div>
                <h1 className="text-3xl font-black text-foreground">
                  {getMemberName(member)}
                </h1>
                <p className="mt-1 text-foreground/60">
                  {role?.name ?? "Unassigned role"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[member.status]}`}
                  >
                    {getStatusLabel(member.status)}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-foreground/70">
                    Member since {joinedLabel}
                  </span>
                  {role?.code && (
                    <span className="rounded-full bg-accent-blue-50 px-3 py-1 text-xs font-semibold text-accent-blue-700">
                      {role.code}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                onClick={handleToggleStatus}
                disabled={isUpdating}
                className="rounded-lg border-2 border-accent-blue-500 px-4 py-2 font-semibold text-accent-blue-500 hover:bg-accent-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {member.status === MemberStatus.ACTIVE
                  ? "Pause Access"
                  : "Restore Access"}
              </button>
              <button
                onClick={() => router.push("/dashboard/gym-owner/staff/invite")}
                className="rounded-lg border-2 border-gray-300 px-4 py-2 font-semibold text-foreground hover:bg-gray-50"
              >
                Invite Another Staff Member
              </button>
              <button
                onClick={handleRemoveMember}
                className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
              >
                Remove from Organization
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground">
                  Contact Information
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">
                      Email
                    </p>
                    <p className="mt-1 text-foreground">
                      {user?.email ?? "No email available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">
                      Organization
                    </p>
                    <p className="mt-1 text-foreground">{currentOrg.name}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground">
                  Role Access
                </h2>
                <p className="mt-1 text-sm text-foreground/60">
                  Permissions currently attached to this team member&apos;s
                  assigned role.
                </p>

                {role?.permissions && role.permissions.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full bg-accent-blue-50 px-3 py-1 text-sm font-medium text-accent-blue-700"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-foreground/60">
                    No permissions are attached to this role yet.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground">
                  Member Snapshot
                </h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">
                      Status
                    </p>
                    <p className="mt-1 text-foreground">
                      {getStatusLabel(member.status)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">
                      Joined
                    </p>
                    <p className="mt-1 text-foreground">{joinedLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">
                      Role Code
                    </p>
                    <p className="mt-1 text-foreground">
                      {role?.code ?? "Not assigned"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground">Notes</h2>
                <p className="mt-4 text-sm leading-6 text-foreground/70">
                  Trainer performance, private-session revenue splits, and
                  detailed scheduling are still handled elsewhere in the
                  product. This page now reflects the real team membership
                  record instead of placeholder trainer analytics.
                </p>
              </div>
            </div>
          </div>
          {confirmationModal}
        </div>
      </main>
    </div>
  );
}
