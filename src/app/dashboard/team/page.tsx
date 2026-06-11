"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { OrganizationContextBanner } from "@/components/ds/OrganizationContextBanner";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import SearchableSelect from "@/components/SearchableSelect";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrgManagement } from "@/hooks/useTeams";
import {
  MemberStatus,
  type OrganizationMember,
  type TeamInvitation,
} from "@/lib/api/teams";

function roleNameFromMember(member: OrganizationMember): string {
  return typeof member.team_role_id === "string"
    ? member.team_role_id
    : member.team_role_id.name;
}

function roleIdFromMember(member: OrganizationMember): string {
  return typeof member.team_role_id === "string"
    ? member.team_role_id
    : member.team_role_id._id;
}

function userFullName(member: OrganizationMember): string {
  if (typeof member.user_id === "string") {
    return "Member";
  }

  const first = member.user_id.first_name ?? "";
  const last = member.user_id.last_name ?? "";
  const fullName = `${first} ${last}`.trim();
  return fullName || "Member";
}

function userEmail(member: OrganizationMember): string {
  if (typeof member.user_id === "string") {
    return "-";
  }

  return member.user_id.email;
}

function roleNameFromInvitation(invite: TeamInvitation): string {
  return typeof invite.team_role_id === "string"
    ? invite.team_role_id
    : invite.team_role_id.name;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function TeamWorkspacePage() {
  const { organizations, currentOrg, setCurrentOrg, isLoading: orgLoading } =
    useOrganization();
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [directFirstName, setDirectFirstName] = useState("");
  const [directLastName, setDirectLastName] = useState("");
  const [directEmail, setDirectEmail] = useState("");
  const [directRoleId, setDirectRoleId] = useState("");
  const [directPassword, setDirectPassword] = useState("");
  const [submittingDirect, setSubmittingDirect] = useState(false);

  const orgId = currentOrg?._id;
  const {
    members,
    roles,
    invitations,
    isLoading,
    error,
    loadOrgData,
    inviteMember,
    addMemberDirect,
    updateMember,
    removeMember,
    cancelInvitation,
  } = useOrgManagement(orgId ?? "");

  useEffect(() => {
    if (!orgId) return;
    void loadOrgData();
  }, [orgId, loadOrgData]);

  const roleOptions = useMemo(
    () => roles.map((role) => ({ label: role.name, value: role._id })),
    [roles],
  );


  const selectedDirectRoleId = directRoleId || roles[0]?._id || "";

  // Get current user's permissions from their role in the active organization
  const userPermissions = useMemo(() => {
    if (!currentOrg) return [];
    const isOwner = currentOrg.is_owner ?? false;
    const canManage = currentOrg.can_manage_organization ?? false;
    if (isOwner || canManage) {
      return [
        "team:view_members",
        "team:invite_member",
        "team:remove_member",
        "team:update_member_role",
        "team:manage_organization",
        "team:cancel_invitation",
        "team:view_invitations",
      ];
    }
    return ["team:view_members", "team:view_invitations"];
  }, [currentOrg]);

  // Check if current user can perform actions
  const canInvite = userPermissions.includes("team:invite_member");
  const canRemove = userPermissions.includes("team:remove_member");
  const canUpdateRole = userPermissions.includes("team:update_member_role");
  const canManageOrg = userPermissions.includes("team:manage_organization");

  const selectedInviteRoleId = inviteRoleId || roles[0]?._id || "";

  const statusOptions = [
    { label: "Pending", value: MemberStatus.PENDING },
    { label: "Active", value: MemberStatus.ACTIVE },
    { label: "Inactive", value: MemberStatus.INACTIVE },
  ];

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;

    return members.filter((member) => {
      const name = userFullName(member).toLowerCase();
      const email = userEmail(member).toLowerCase();
      const roleName = roleNameFromMember(member).toLowerCase();
      return (
        name.includes(query) || email.includes(query) || roleName.includes(query)
      );
    });
  }, [members, search]);

  async function handleInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canInvite) {
      setGlobalMessage("You don&apos;t have permission to invite members.");
      return;
    }
    if (!inviteEmail || !selectedInviteRoleId || !orgId) return;

    setSubmittingInvite(true);
    setGlobalMessage(null);
    const invited = await inviteMember({
      email: inviteEmail.trim(),
      team_role_id: selectedInviteRoleId,
    });

    if (invited) {
      setInviteEmail("");
      setGlobalMessage("Invitation sent successfully.");
    } else {
      setGlobalMessage("Unable to send invitation. Please try again.");
    }
    setSubmittingInvite(false);
  }



  async function handleDirectAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!directFirstName || !directLastName || !directEmail || !directPassword || !selectedDirectRoleId || !orgId) return;

    setSubmittingDirect(true);
    setGlobalMessage(null);
    const added = await addMemberDirect({
      first_name: directFirstName,
      last_name: directLastName,
      email: directEmail.trim(),
      password: directPassword,
      team_role_id: selectedDirectRoleId,
    });

    if (added) {
      setDirectFirstName("");
      setDirectLastName("");
      setDirectEmail("");
      setDirectPassword("");
      setGlobalMessage("Member added and invited successfully.");
    } else {
      setGlobalMessage("Unable to add member. Please try again.");
    }
    setSubmittingDirect(false);
  }


  async function handleRoleChange(memberId: string, newRoleId: string) {
    if (!canUpdateRole) {
      setGlobalMessage("You don&apos;t have permission to update member roles.");
      return;
    }
    setGlobalMessage(null);
    const updated = await updateMember(memberId, { team_role_id: newRoleId });
    if (!updated) {
      setGlobalMessage("Could not update member role.");
    }
  }

  async function handleStatusChange(
    memberId: string,
    newStatus: MemberStatus,
  ) {
    if (!canManageOrg) {
      setGlobalMessage("You don&apos;t have permission to update member status.");
      return;
    }
    setGlobalMessage(null);
    const updated = await updateMember(memberId, { status: newStatus });
    if (!updated) {
      setGlobalMessage("Could not update member status.");
    }
  }

  async function handleRemove(memberId: string) {
    if (!canRemove) {
      setGlobalMessage("You don&apos;t have permission to remove members.");
      return;
    }
    setGlobalMessage(null);
    const ok = await removeMember(memberId);
    if (!ok) {
      setGlobalMessage("Could not remove member.");
    }
  }

  async function handleCancelInvite(invitationId: string) {
    if (!canManageOrg) {
      setGlobalMessage("You don&apos;t have permission to cancel invitations.");
      return;
    }
    setGlobalMessage(null);
    const ok = await cancelInvitation(invitationId);
    if (!ok) {
      setGlobalMessage("Could not cancel invitation.");
    }
  }

  return (
    <MemberDashboardShell activeLabel="Team">
      <div className="flex flex-col gap-5">
        <OrganizationContextBanner
          label="Team organization"
          helperText="Switch organizations to manage the right staff roster and invitations."
          organizations={organizations}
          currentOrg={currentOrg}
          onChange={setCurrentOrg}
        />

        <div>
          <div
            className="font-mono text-[11px] uppercase tracking-[0.06em]"
            style={{ color: "var(--fg-3)" }}
          >
            Workspace
          </div>
          <h1
            className="text-[30px] font-medium mt-1"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Team management
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--fg-3)" }}>
            Manage organization members, assign roles, and control pending
            invitations.
          </p>
        </div>

        {orgLoading ? (
          <div className="rounded-(--r-3) p-4" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            Loading organizations...
          </div>
        ) : organizations.length === 0 ? (
          <div className="rounded-(--r-3) p-4" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <p className="text-sm" style={{ color: "var(--fg-2)" }}>
              You are not part of an organization yet.
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--fg-3)" }}>
              Create an organization from onboarding or ask an owner/admin to
              invite you.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div
                className="rounded-(--r-3) p-3 text-sm"
                style={{ border: "1px solid var(--danger)", background: "var(--danger-soft)", color: "var(--danger)" }}
              >
                {error}
              </div>
            )}

            {globalMessage && (
              <div
                className="rounded-(--r-3) p-3 text-sm"
                style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}
              >
                {globalMessage}
              </div>
            )}

            <section
              className="rounded-(--r-3) p-4"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
                  Members
                </h2>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search members by name, role, or email"
                  className="w-full sm:max-w-[320px] rounded-(--r-2) border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                />
              </div>

              {isLoading ? (
                <AsyncSpinner label="Loading team workspace" />
              ) : filteredMembers.length === 0 ? (
                <EmptySlate message="No members found for this filter." />
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full min-w-[840px] border-collapse text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                          Member
                        </th>
                        <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                          Email
                        </th>
                        <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                          Role
                        </th>
                        <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                          Status
                        </th>
                        <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                          Joined
                        </th>
                        <th className="text-left py-2" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member._id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td className="py-3 pr-4" style={{ color: "var(--ink)" }}>
                            {userFullName(member)}
                          </td>
                          <td className="py-3 pr-4" style={{ color: "var(--fg-2)" }}>
                            {userEmail(member)}
                          </td>
                          <td className="py-3 pr-4 w-[220px]">
                            <SearchableSelect
                              value={roleIdFromMember(member)}
                              onChange={(value) => {
                                void handleRoleChange(member._id, value);
                              }}
                              options={roleOptions}
                              placeholder={roleNameFromMember(member)}
                            />
                          </td>
                          <td className="py-3 pr-4 w-[180px]">
                            <SearchableSelect
                              value={member.status}
                              onChange={(value) => {
                                void handleStatusChange(member._id, value as MemberStatus);
                              }}
                              options={statusOptions}
                              placeholder="Status"
                            />
                          </td>
                          <td className="py-3 pr-4" style={{ color: "var(--fg-2)" }}>
                            {formatDate(member.joined_at ?? member.created_at)}
                          </td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => {
                                void handleRemove(member._id);
                              }}
                              className="rounded-(--r-2) border px-3 py-1.5 text-sm"
                              style={{ borderColor: "var(--danger)", color: "var(--danger)", background: "transparent" }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div
                className="rounded-(--r-3) p-4"
                style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              >
                <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
                  Invite member by email
                </h2>
                {!canInvite ? (
                  <p className="text-sm mt-4" style={{ color: "var(--fg-3)" }}>
                    You don&apos;t have permission to invite members.
                  </p>
                ) : (
                  <form className="mt-4 flex flex-col gap-3" onSubmit={handleInviteSubmit}>
                  <div>
                    <label
                      className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                      style={{ color: "var(--fg-3)" }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="person@domain.com"
                      className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                    />
                  </div>
                  <div>
                    <label
                      className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                      style={{ color: "var(--fg-3)" }}
                    >
                      Team role
                    </label>
                    <div className="mt-1.5">
                      <SearchableSelect
                        value={selectedInviteRoleId}
                        onChange={setInviteRoleId}
                        options={roleOptions}
                        placeholder="Select role"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingInvite || !selectedInviteRoleId}
                    className="rounded-(--r-2) px-4 py-2 text-sm font-medium"
                    style={{
                      background: submittingInvite || !selectedInviteRoleId ? "var(--bg-3)" : "var(--ink)",
                      color: submittingInvite || !selectedInviteRoleId ? "var(--fg-4)" : "var(--bg)",
                      cursor: submittingInvite || !selectedInviteRoleId ? "not-allowed" : "pointer",
                    }}
                  >
                    {submittingInvite ? "Sending..." : "Send invitation"}
                  </button>
                  </form>
                )}
              </div>


              <div
                className="rounded-(--r-3) p-4"
                style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              >
                <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
                  Add member directly
                </h2>
                {!canManageOrg ? (
                  <p className="text-sm mt-4" style={{ color: "var(--fg-3)" }}>
                    You don&apos;t have permission to add members directly.
                  </p>
                ) : (
                  <form className="mt-4 flex flex-col gap-3" onSubmit={handleDirectAdd}>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label
                          className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                          style={{ color: "var(--fg-3)" }}
                        >
                          First name
                        </label>
                        <input
                          type="text"
                          required
                          value={directFirstName}
                          onChange={(event) => setDirectFirstName(event.target.value)}
                          placeholder="John"
                          className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                          style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                        />
                      </div>
                      <div>
                        <label
                          className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                          style={{ color: "var(--fg-3)" }}
                        >
                          Last name
                        </label>
                        <input
                          type="text"
                          required
                          value={directLastName}
                          onChange={(event) => setDirectLastName(event.target.value)}
                          placeholder="Doe"
                          className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                          style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                        style={{ color: "var(--fg-3)" }}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={directEmail}
                        onChange={(event) => setDirectEmail(event.target.value)}
                        placeholder="john@example.com"
                        className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                        style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                      />
                    </div>
                    <div>
                      <label
                        className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                        style={{ color: "var(--fg-3)" }}
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={directPassword}
                        onChange={(event) => setDirectPassword(event.target.value)}
                        placeholder="••••••••"
                        className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                        style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                      />
                    </div>
                    <div>
                      <label
                        className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                        style={{ color: "var(--fg-3)" }}
                      >
                        Team role
                      </label>
                      <div className="mt-1.5">
                        <SearchableSelect
                          value={selectedDirectRoleId}
                          onChange={setDirectRoleId}
                          options={roleOptions}
                          placeholder="Select role"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={submittingDirect || !selectedDirectRoleId}
                      className="rounded-(--r-2) px-4 py-2 text-sm font-medium"
                      style={{
                        background:
                          submittingDirect || !selectedDirectRoleId
                            ? "var(--bg-3)"
                            : "var(--ink)",
                        color:
                          submittingDirect || !selectedDirectRoleId
                            ? "var(--fg-4)"
                            : "var(--bg)",
                        cursor:
                          submittingDirect || !selectedDirectRoleId
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {submittingDirect ? "Adding..." : "Add member"}
                    </button>
                  </form>
                )}
              </div>

              <div
                className="rounded-(--r-3) p-4"
                style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              >
                <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
                  Pending invitations
                </h2>
                {invitations.length === 0 ? (
                  <p className="text-sm mt-4" style={{ color: "var(--fg-3)" }}>
                    No pending invitations.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {invitations.map((invitation) => (
                      <li
                        key={invitation._id}
                        className="rounded-(--r-2) p-3 flex items-center justify-between gap-3"
                        style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}
                      >
                        <div>
                          <div className="text-sm" style={{ color: "var(--ink)" }}>
                            {invitation.email}
                          </div>
                          <div className="font-mono text-[11px] uppercase mt-1" style={{ color: "var(--fg-3)", letterSpacing: "0.04em" }}>
                            {roleNameFromInvitation(invitation)} · expires {formatDate(invitation.expires_at)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            void handleCancelInvite(invitation._id);
                          }}
                          className="rounded-(--r-2) border px-3 py-1.5 text-sm"
                          style={{
                            borderColor: canManageOrg
                              ? "var(--border-2)"
                              : "var(--border)",
                            color: canManageOrg ? "var(--fg-2)" : "var(--fg-4)",
                            background: "var(--bg)",
                            opacity: canManageOrg ? 1 : 0.5,
                            cursor: canManageOrg ? "pointer" : "not-allowed",
                          }}
                        >
                          Cancel
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 text-sm" style={{ color: "var(--fg-3)" }}>
                  Invite acceptance link is available at{" "}
                  <Link href="/teams/invite/accept" style={{ color: "var(--ink)", textDecoration: "underline" }}>
                    /teams/invite/accept
                  </Link>
                  .
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </MemberDashboardShell>
  );
}
