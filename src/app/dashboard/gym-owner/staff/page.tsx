"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLoading from "@/components/DashboardLoading";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  InvitationStatus,
  MemberStatus,
  teamsService,
  type OrganizationMember,
  type TeamInvitation,
  type TeamRole,
} from "@/lib/api/teams";
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

function getMemberEmail(member: OrganizationMember): string {
  const user = getMemberUser(member);
  return user?.email ?? "No email available";
}

function getMemberInitials(member: OrganizationMember): string {
  const user = getMemberUser(member);
  if (!user) return "?";
  return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
}

function getRoleLabel(member: OrganizationMember): string {
  return getMemberRole(member)?.name ?? "Unassigned role";
}

function formatStatusLabel(status: MemberStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function StaffPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated: isAuthorized } =
    useRequireAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | MemberStatus>("all");
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || orgLoading || !isAuthorized) return;
    if (!currentOrg?._id) {
      setMembers([]);
      setInvitations([]);
      setIsLoading(false);
      return;
    }
    const organizationId = currentOrg._id;

    let mounted = true;

    async function loadStaff() {
      setIsLoading(true);
      setError(null);
      try {
        const [membersResponse, invitationsResponse] = await Promise.all([
          teamsService.getMembers(organizationId),
          teamsService.getInvitations(organizationId),
        ]);

        if (!mounted) return;

        if (membersResponse.success && membersResponse.data) {
          setMembers(membersResponse.data);
        } else {
          setMembers([]);
        }

        if (invitationsResponse.success && invitationsResponse.data) {
          setInvitations(invitationsResponse.data);
        } else {
          setInvitations([]);
        }

        const failures: string[] = [];
        if (!membersResponse.success) {
          failures.push(
            membersResponse.message ?? "Failed to load team members.",
          );
        }
        if (!invitationsResponse.success) {
          failures.push(
            invitationsResponse.message ??
              "Failed to load pending invitations.",
          );
        }
        if (failures.length > 0) {
          setError(failures.join(" "));
        }
      } catch {
        if (mounted) {
          setMembers([]);
          setInvitations([]);
          setError("Failed to load your staff directory.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStaff();

    return () => {
      mounted = false;
    };
  }, [authLoading, currentOrg?._id, isAuthorized, orgLoading]);

  const filteredMembers = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return members.filter((member) => {
      const roleLabel = getRoleLabel(member).toLowerCase();
      const matchesSearch =
        search.length === 0 ||
        getMemberName(member).toLowerCase().includes(search) ||
        getMemberEmail(member).toLowerCase().includes(search) ||
        roleLabel.includes(search);

      const matchesStatus =
        filterStatus === "all" || member.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [filterStatus, members, searchQuery]);

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === InvitationStatus.PENDING,
  );
  const activeMembers = members.filter(
    (member) => member.status === MemberStatus.ACTIVE,
  ).length;
  const inactiveMembers = members.filter(
    (member) => member.status === MemberStatus.INACTIVE,
  ).length;

  if (authLoading || orgLoading || isLoading) {
    return <DashboardLoading />;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-foreground">
                Staff & Trainers
              </h1>
              <p className="mt-1 text-foreground/60">
                {currentOrg
                  ? `Manage coaches, instructors, and team members for ${currentOrg.name}.`
                  : "Select an organization to manage your staff directory."}
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/gym-owner/staff/invite")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-blue-500 px-6 py-3 font-semibold text-white hover:bg-accent-blue-600"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Invite Staff Member
            </button>
          </div>

          {!currentOrg ? (
            <div className="rounded-xl bg-white p-8 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-bold text-foreground">
                No organization selected
              </h2>
              <p className="mt-2 text-foreground/60">
                Choose or create an organization first so the dashboard can load
                team members and invitations.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
                  <p className="text-sm font-medium text-foreground/60">
                    Total Staff
                  </p>
                  <p className="mt-2 text-3xl font-black text-foreground">
                    {members.length}
                  </p>
                  <p className="mt-1 text-sm text-accent-blue-500">
                    {activeMembers} active right now
                  </p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
                  <p className="text-sm font-medium text-foreground/60">
                    Pending Invites
                  </p>
                  <p className="mt-2 text-3xl font-black text-foreground">
                    {pendingInvitations.length}
                  </p>
                  <p className="mt-1 text-sm text-foreground/60">
                    Waiting for acceptance
                  </p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
                  <p className="text-sm font-medium text-foreground/60">
                    Inactive Members
                  </p>
                  <p className="mt-2 text-3xl font-black text-foreground">
                    {inactiveMembers}
                  </p>
                  <p className="mt-1 text-sm text-foreground/60">
                    Access currently paused
                  </p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
                  <p className="text-sm font-medium text-foreground/60">
                    Role Coverage
                  </p>
                  <p className="mt-2 text-3xl font-black text-foreground">
                    {
                      new Set(members.map((member) => getRoleLabel(member)))
                        .size
                    }
                  </p>
                  <p className="mt-1 text-sm text-foreground/60">
                    Distinct staff roles assigned
                  </p>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      Search staff
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name, email, or role"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full rounded-lg border-2 border-neutral-200 px-4 py-3 focus:border-accent-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="w-full lg:max-w-xs">
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      Filter by status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(event) =>
                        setFilterStatus(
                          event.target.value as "all" | MemberStatus,
                        )
                      }
                      className="w-full rounded-lg border-2 border-neutral-200 px-4 py-3 focus:border-accent-blue-500 focus:outline-none"
                    >
                      <option value="all">All statuses</option>
                      <option value={MemberStatus.ACTIVE}>Active</option>
                      <option value={MemberStatus.PENDING}>Pending</option>
                      <option value={MemberStatus.INACTIVE}>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="rounded-xl bg-white shadow-[var(--shadow-card)]">
                  <div className="border-b border-neutral-100 px-6 py-4">
                    <h2 className="text-lg font-bold text-foreground">
                      Team Directory
                    </h2>
                    <p className="mt-1 text-sm text-foreground/60">
                      {filteredMembers.length} of {members.length} member
                      {members.length === 1 ? "" : "s"} shown
                    </p>
                  </div>

                  {filteredMembers.length === 0 ? (
                    <div className="px-6 py-12 text-center text-foreground/60">
                      No team members matched your current filters.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredMembers.map((member) => (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/gym-owner/staff/${member._id}`,
                            )
                          }
                          className="flex w-full flex-col gap-4 px-6 py-5 text-left hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-blue-500 text-sm font-bold text-white">
                              {getMemberInitials(member)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {getMemberName(member)}
                              </p>
                              <p className="text-sm text-foreground/60">
                                {getMemberEmail(member)}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-accent-blue-50 px-3 py-1 text-xs font-semibold text-accent-blue-700">
                                  {getRoleLabel(member)}
                                </span>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[member.status]}`}
                                >
                                  {formatStatusLabel(member.status)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {member.joined_at
                                ? `Joined ${formatLocal(member.joined_at, "MMM d, yyyy")}`
                                : `Invited ${formatLocal(member.created_at, "MMM d, yyyy")}`}
                            </p>
                            <p className="mt-1 text-sm text-foreground/60">
                              View role, permissions, and access
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
                    <h2 className="text-lg font-bold text-foreground">
                      Pending Invitations
                    </h2>
                    <p className="mt-1 text-sm text-foreground/60">
                      Invitations that still need to be accepted.
                    </p>

                    <div className="mt-4 space-y-3">
                      {pendingInvitations.length === 0 ? (
                        <p className="text-sm text-foreground/60">
                          No pending invites.
                        </p>
                      ) : (
                        pendingInvitations.slice(0, 5).map((invitation) => {
                          const role =
                            typeof invitation.team_role_id === "object" &&
                            invitation.team_role_id !== null
                              ? invitation.team_role_id.name
                              : "Assigned role";

                          return (
                            <div
                              key={invitation._id}
                              className="rounded-lg border border-neutral-200 p-4"
                            >
                              <p className="font-semibold text-foreground">
                                {invitation.email}
                              </p>
                              <p className="mt-1 text-sm text-foreground/60">
                                {role}
                              </p>
                              <p className="mt-2 text-xs text-foreground/60">
                                Expires{" "}
                                {formatLocal(
                                  invitation.expires_at,
                                  "MMM d, yyyy",
                                )}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
                    <h2 className="text-lg font-bold text-foreground">
                      What changed
                    </h2>
                    <ul className="mt-4 space-y-2 text-sm text-foreground/70">
                      <li>
                        Live team members now come from your organization
                        membership data.
                      </li>
                      <li>
                        Role labels are taken from team roles instead of
                        page-level placeholders.
                      </li>
                      <li>
                        Invitation status is surfaced directly from pending team
                        invites.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
