"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

  const orgId = currentOrg?._id;
  const {
    organization,
    members,
    roles,
    invitations,
    isLoading,
    error,
    loadOrgData,
    inviteMember,
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

  const selectedInviteRoleId = inviteRoleId || roles[0]?._id || "";

  const organizationOptions = useMemo(
    () => organizations.map((org) => ({ label: org.name, value: org._id })),
    [organizations],
  );

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

  async function handleRoleChange(memberId: string, newRoleId: string) {
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
    setGlobalMessage(null);
    const updated = await updateMember(memberId, { status: newStatus });
    if (!updated) {
      setGlobalMessage("Could not update member status.");
    }
  }

  async function handleRemove(memberId: string) {
    setGlobalMessage(null);
    const ok = await removeMember(memberId);
    if (!ok) {
      setGlobalMessage("Could not remove member.");
    }
  }

  async function handleCancelInvite(invitationId: string) {
    setGlobalMessage(null);
    const ok = await cancelInvitation(invitationId);
    if (!ok) {
      setGlobalMessage("Could not cancel invitation.");
    }
  }

  return (
    <MemberDashboardShell activeLabel="Home">
      <div className="flex flex-col gap-5">
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
            <div
              className="rounded-(--r-3) p-4"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label
                    className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    Active organization
                  </label>
                  <div className="mt-1.5">
                    <SearchableSelect
                      value={currentOrg?._id ?? ""}
                      onChange={(nextOrgId) => {
                        const selectedOrg =
                          organizations.find((org) => org._id === nextOrgId) ??
                          null;
                        setCurrentOrg(selectedOrg);
                      }}
                      options={organizationOptions}
                      placeholder="Select organization"
                    />
                  </div>
                </div>
                <div className="text-sm" style={{ color: "var(--fg-2)" }}>
                  {organization ? (
                    <>
                      <div>
                        <strong>{organization.name}</strong>
                      </div>
                      <div style={{ color: "var(--fg-3)" }}>
                        {members.length} members · {invitations.length} pending invites
                      </div>
                    </>
                  ) : (
                    "Select an organization to continue."
                  )}
                </div>
              </div>
            </div>

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
                <p className="text-sm mt-4" style={{ color: "var(--fg-3)" }}>
                  Loading team workspace...
                </p>
              ) : filteredMembers.length === 0 ? (
                <p className="text-sm mt-4" style={{ color: "var(--fg-3)" }}>
                  No members found for this filter.
                </p>
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

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div
                className="rounded-(--r-3) p-4"
                style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              >
                <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
                  Invite member
                </h2>
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
                    {submittingInvite ? "Sending invitation..." : "Send invitation"}
                  </button>
                </form>
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
                          style={{ borderColor: "var(--border-2)", color: "var(--fg-2)", background: "var(--bg)" }}
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
