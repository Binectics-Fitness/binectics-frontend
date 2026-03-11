"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  teamsService,
  type Organization,
  type TeamRole,
  type OrganizationMember,
  type TeamInvitation,
  type InviteMemberRequest,
  type AddMemberDirectRequest,
  type CreateTeamRoleRequest,
  MemberStatus,
  InvitationStatus,
  TeamPermission,
} from "@/lib/api/teams";

type Tab = "members" | "roles" | "invitations";

const MEMBER_STATUS_STYLES: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: "bg-green-100 text-green-700",
  [MemberStatus.PENDING]: "bg-yellow-100 text-yellow-700",
  [MemberStatus.INACTIVE]: "bg-neutral-100 text-neutral-500",
};

const INVITATION_STATUS_STYLES: Record<InvitationStatus, string> = {
  [InvitationStatus.PENDING]: "bg-yellow-100 text-yellow-700",
  [InvitationStatus.ACCEPTED]: "bg-green-100 text-green-700",
  [InvitationStatus.EXPIRED]: "bg-neutral-100 text-neutral-500",
  [InvitationStatus.CANCELLED]: "bg-red-100 text-red-600",
};

const PERMISSION_LABELS: Record<TeamPermission, string> = {
  [TeamPermission.VIEW_MEMBERS]: "View Members",
  [TeamPermission.INVITE_MEMBER]: "Invite Members",
  [TeamPermission.REMOVE_MEMBER]: "Remove Members",
  [TeamPermission.UPDATE_MEMBER_ROLE]: "Update Member Role",
  [TeamPermission.DEACTIVATE_MEMBER]: "Deactivate Members",
  [TeamPermission.MANAGE_ROLES]: "Manage Roles",
  [TeamPermission.MANAGE_ORGANIZATION]: "Manage Organization",
  [TeamPermission.CANCEL_INVITATION]: "Cancel Invitations",
  [TeamPermission.VIEW_INVITATIONS]: "View Invitations",
};

export default function OrgDetailPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const { isLoading: authLoading, isAuthenticated: isAuthorized } =
    useRequireAuth();

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add member modal (invite or direct)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [addMode, setAddMode] = useState<"invite" | "direct">("invite");

  // Invite-by-email form
  const [inviteForm, setInviteForm] = useState<InviteMemberRequest>({
    email: "",
    team_role_id: "",
  });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Direct-add form
  const [directForm, setDirectForm] = useState<AddMemberDirectRequest>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    team_role_id: "",
  });
  const [directAdding, setDirectAdding] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  // Create role modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState<CreateTeamRoleRequest>({
    name: "",
    code: "",
    permissions: [],
  });
  const [creatingRole, setCreatingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    if (orgId && !authLoading && isAuthorized) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, authLoading, isAuthorized]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [orgRes, membersRes, rolesRes, invitesRes] = await Promise.all([
        teamsService.getOrganization(orgId),
        teamsService.getMembers(orgId),
        teamsService.getRoles(orgId),
        teamsService.getInvitations(orgId),
      ]);
      if (orgRes.success && orgRes.data) setOrg(orgRes.data);
      if (membersRes.success && membersRes.data) setMembers(membersRes.data);
      if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
      if (invitesRes.success && invitesRes.data)
        setInvitations(invitesRes.data);
      const errors: string[] = [];
      if (!orgRes.success)
        errors.push(orgRes.message ?? "Failed to load organization.");
      if (!membersRes.success)
        errors.push(membersRes.message ?? "Failed to load members.");
      if (!rolesRes.success)
        errors.push(rolesRes.message ?? "Failed to load roles.");
      if (!invitesRes.success)
        errors.push(invitesRes.message ?? "Failed to load invitations.");
      if (errors.length > 0) setError(errors.join(" "));
    } catch {
      setError("Failed to load organization data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    try {
      const res = await teamsService.inviteMember(orgId, inviteForm);
      if (res.success && res.data) {
        // Reload all data to get populated fields
        await loadAll();
        setShowInviteModal(false);
        setInviteForm({ email: "", team_role_id: "" });
        setActiveTab("invitations");
      } else {
        setInviteError(res.message ?? "Failed to send invitation.");
      }
    } catch {
      setInviteError("Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  }

  async function handleAddDirect(e: React.FormEvent) {
    e.preventDefault();
    setDirectAdding(true);
    setDirectError(null);
    try {
      const res = await teamsService.addMemberDirect(orgId, directForm);
      if (res.success && res.data) {
        // Reload all data to get populated fields
        await loadAll();
        setShowInviteModal(false);
        setDirectForm({
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          team_role_id: "",
        });
        setActiveTab("members");
      } else {
        setDirectError(res.message ?? "Failed to add member.");
      }
    } catch {
      setDirectError("Failed to add member.");
    } finally {
      setDirectAdding(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await teamsService.removeMember(orgId, memberId);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m._id !== memberId));
      } else {
        setError(res.message ?? "Failed to remove member.");
      }
    } catch {
      setError("Failed to remove member.");
    }
  }

  async function handleDeactivateMember(
    memberId: string,
    current: MemberStatus,
  ) {
    const newStatus =
      current === MemberStatus.ACTIVE
        ? MemberStatus.INACTIVE
        : MemberStatus.ACTIVE;
    const res = await teamsService.updateMember(orgId, memberId, {
      status: newStatus,
    });
    if (res.success && res.data) {
      setMembers((prev) =>
        prev.map((m) => (m._id === memberId ? { ...m, status: newStatus } : m)),
      );
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    if (!confirm("Cancel this invitation?")) return;
    try {
      const res = await teamsService.cancelInvitation(orgId, invitationId);
      if (res.success) {
        setInvitations((prev) =>
          prev.map((i) =>
            i._id === invitationId
              ? { ...i, status: InvitationStatus.CANCELLED }
              : i,
          ),
        );
      } else {
        setError(res.message ?? "Failed to cancel invitation.");
      }
    } catch {
      setError("Failed to cancel invitation.");
    }
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    setCreatingRole(true);
    setRoleError(null);
    try {
      const res = await teamsService.createRole(orgId, roleForm);
      if (res.success && res.data) {
        setRoles((prev) => [...prev, res.data!]);
        setShowRoleModal(false);
        setRoleForm({ name: "", code: "", permissions: [] });
      } else {
        setRoleError(res.message ?? "Failed to create role.");
      }
    } catch {
      setRoleError("Failed to create role.");
    } finally {
      setCreatingRole(false);
    }
  }

  async function handleDeleteRole(roleId: string) {
    if (
      !confirm(
        "Delete this role? Members using it will keep their assignment until updated.",
      )
    )
      return;
    await teamsService.deleteRole(orgId, roleId);
    setRoles((prev) => prev.filter((r) => r._id !== roleId));
  }

  function togglePermission(perm: TeamPermission) {
    setRoleForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  }

  function getRoleName(roleId: string) {
    return roles.find((r) => r._id === roleId)?.name ?? roleId;
  }

  const tabClass = (tab: Tab) =>
    `px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === tab
        ? "border-foreground text-foreground"
        : "border-transparent text-foreground-secondary hover:text-foreground"
    }`;

  if (authLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center ml-64">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </main>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-8 ml-64">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error ?? "Organization not found."}
          </div>
          <Link
            href="/dashboard/team"
            className="mt-4 inline-block text-sm text-accent-blue-500 hover:underline"
          >
            ← Back to Team
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-8 ml-64">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-foreground-secondary">
          <Link
            href="/dashboard/team"
            className="hover:text-foreground transition-colors"
          >
            Team
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{org.name}</span>
        </div>

        {/* Org Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500 text-2xl font-black text-foreground">
              {org.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">
                {org.name}
              </h1>
              {org.description && (
                <p className="mt-0.5 text-sm text-foreground-secondary">
                  {org.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Add Member
          </button>
        </div>

        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-2xl font-black text-foreground">
              {members.filter((m) => m.status === MemberStatus.ACTIVE).length}
            </p>
            <p className="mt-0.5 text-xs text-foreground-secondary">
              Active Members
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-2xl font-black text-foreground">
              {roles.filter((r) => !r.is_default).length}
            </p>
            <p className="mt-0.5 text-xs text-foreground-secondary">
              Custom Roles
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-2xl font-black text-foreground">
              {
                invitations.filter((i) => i.status === InvitationStatus.PENDING)
                  .length
              }
            </p>
            <p className="mt-0.5 text-xs text-foreground-secondary">
              Pending Invitations
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200 mb-6">
          <nav className="flex gap-2 -mb-px">
            <button
              className={tabClass("members")}
              onClick={() => setActiveTab("members")}
            >
              Members ({members.length})
            </button>
            <button
              className={tabClass("roles")}
              onClick={() => setActiveTab("roles")}
            >
              Roles ({roles.length})
            </button>
            <button
              className={tabClass("invitations")}
              onClick={() => setActiveTab("invitations")}
            >
              Invitations (
              {
                invitations.filter((i) => i.status === InvitationStatus.PENDING)
                  .length
              }
              )
            </button>
          </nav>
        </div>

        {/* ─── MEMBERS TAB ─── */}
        {activeTab === "members" && (
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            {members.length === 0 ? (
              <div className="py-16 text-center text-sm text-foreground-secondary">
                No members yet.{" "}
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-accent-blue-500 hover:underline font-semibold"
                >
                  Add the first one →
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                      Joined
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {members.map((member) => (
                    <tr
                      key={member._id}
                      className="hover:bg-neutral-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-bold text-foreground">
                            {(() => {
                              const user = typeof member.user_id === 'object' ? member.user_id : null;
                              const name = user ? `${user.first_name} ${user.last_name}` : '?';
                              return name.charAt(0).toUpperCase();
                            })()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {(() => {
                                const user = typeof member.user_id === 'object' ? member.user_id : null;
                                return user ? `${user.first_name} ${user.last_name}` : '—';
                              })()}
                            </p>
                            <p className="text-xs text-foreground-secondary">
                              {typeof member.user_id === 'object' ? member.user_id.email : '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {typeof member.team_role_id === "object" && member.team_role_id?.name
                          ? member.team_role_id.name
                          : getRoleName(member.team_role_id as string)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${MEMBER_STATUS_STYLES[member.status]}`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground-secondary">
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleDeactivateMember(member._id, member.status)
                            }
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-secondary border border-neutral-200 hover:bg-neutral-50 transition-colors"
                          >
                            {member.status === MemberStatus.ACTIVE
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─── ROLES TAB ─── */}
        {activeTab === "roles" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-foreground-secondary">
                Default roles are shared across all organizations. Custom roles
                are specific to this organization.
              </p>
              <button
                onClick={() => setShowRoleModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-foreground hover:bg-neutral-50 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Custom Role
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {roles.map((role) => (
                <div
                  key={role._id}
                  className={`rounded-2xl border p-5 ${role.is_default ? "border-neutral-200 bg-white" : "border-accent-blue-500/20 bg-white"}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">
                          {role.name}
                        </h3>
                        {role.is_default && (
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-mono text-foreground-secondary">
                        {role.code}
                      </p>
                    </div>
                    {!role.is_default && (
                      <button
                        onClick={() => handleDeleteRole(role._id)}
                        className="text-neutral-300 hover:text-red-500 transition-colors"
                        title="Delete role"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {role.permissions.length > 0 ? (
                      role.permissions.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-foreground-secondary"
                        >
                          {PERMISSION_LABELS[p] ?? p}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-400">
                        No permissions
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── INVITATIONS TAB ─── */}
        {activeTab === "invitations" && (
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            {invitations.length === 0 ? (
              <div className="py-16 text-center text-sm text-foreground-secondary">
                No invitations sent yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground-secondary">
                      Expires
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {invitations.map((inv) => (
                    <tr
                      key={inv._id}
                      className="hover:bg-neutral-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {inv.email}
                      </td>
                      <td className="px-6 py-4 text-foreground-secondary">
                        {typeof inv.team_role_id === "object" && inv.team_role_id?.name
                          ? inv.team_role_id.name
                          : getRoleName(inv.team_role_id as string)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${INVITATION_STATUS_STYLES[inv.status]}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground-secondary">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status === InvitationStatus.PENDING && (
                          <button
                            onClick={() => handleCancelInvitation(inv._id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* ─── ADD MEMBER MODAL ─── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 p-6">
              <h2 className="text-xl font-bold text-foreground">Add Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex border-b border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setAddMode("invite");
                  setInviteError(null);
                  setDirectError(null);
                }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  addMode === "invite"
                    ? "border-b-2 border-foreground text-foreground"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                Send Invite
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddMode("direct");
                  setInviteError(null);
                  setDirectError(null);
                }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  addMode === "direct"
                    ? "border-b-2 border-foreground text-foreground"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                Add Directly
              </button>
            </div>

            {/* ── Send Invite form ── */}
            {addMode === "invite" && (
              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <p className="text-sm text-foreground-secondary">
                  An invitation link will be emailed to the address below. They
                  must accept to join.
                </p>
                {inviteError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {inviteError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="colleague@example.com"
                    className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={inviteForm.team_role_id}
                    onChange={(e) =>
                      setInviteForm((f) => ({
                        ...f,
                        team_role_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Select a role...</option>
                    {roles.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 transition-colors disabled:opacity-60"
                  >
                    {inviting ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </form>
            )}

            {/* ── Add Directly form ── */}
            {addMode === "direct" && (
              <form onSubmit={handleAddDirect} className="p-6 space-y-4">
                <p className="text-sm text-foreground-secondary">
                  A new account will be created and the member can log in
                  immediately with the password you set.
                </p>
                {directError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {directError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={directForm.first_name}
                      onChange={(e) =>
                        setDirectForm((f) => ({
                          ...f,
                          first_name: e.target.value,
                        }))
                      }
                      placeholder="John"
                      className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={directForm.last_name}
                      onChange={(e) =>
                        setDirectForm((f) => ({
                          ...f,
                          last_name: e.target.value,
                        }))
                      }
                      placeholder="Doe"
                      className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={directForm.email}
                    onChange={(e) =>
                      setDirectForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="member@example.com"
                    className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={directForm.password}
                    onChange={(e) =>
                      setDirectForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="Min. 8 characters"
                    className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={directForm.team_role_id}
                    onChange={(e) =>
                      setDirectForm((f) => ({
                        ...f,
                        team_role_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Select a role...</option>
                    {roles.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={directAdding}
                    className="flex-1 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 transition-colors disabled:opacity-60"
                  >
                    {directAdding ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── CREATE ROLE MODAL ─── */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 p-6">
              <h2 className="text-xl font-bold text-foreground">
                Create Custom Role
              </h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateRole} className="p-6 space-y-4">
              {roleError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {roleError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. Front Desk"
                    className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm text-foreground placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roleForm.code}
                    onChange={(e) =>
                      setRoleForm((f) => ({
                        ...f,
                        code: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      }))
                    }
                    placeholder="e.g. front_desk"
                    className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Object.values(TeamPermission).map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-2.5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="h-4 w-4 rounded border-neutral-300 accent-primary-500"
                      />
                      <span className="text-sm text-foreground">
                        {PERMISSION_LABELS[perm]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="flex-1 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 transition-colors disabled:opacity-60"
                >
                  {creatingRole ? "Creating..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
