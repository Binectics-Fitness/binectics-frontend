"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AsyncSpinner, DSCard, EmptySlate, Eyebrow, StatusPill } from "@/components/ds";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import {
  MemberStatus,
  teamsService,
  type OrganizationMember,
  type TeamRole,
} from "@/lib/api/teams";
import { marketplaceService } from "@/lib/api/marketplace";
import { MembershipSubscriptionStatus, type MembershipSubscription } from "@/lib/types";
import { membershipStatusMeta } from "@/lib/constants/membershipStatus";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { STAFF_TRAINER_ROLE_CODE } from "@/lib/workspaces";
import {
  MEMBER_STATUS_STYLE,
  memberDisplayEmail,
  memberDisplayName,
  memberInitials,
  memberRoleLabel,
  memberUserId,
} from "../staffFilters";

const STAFF_HREF = "/dashboard/gym-owner/staff";

function roleCode(m: OrganizationMember): string | null {
  return typeof m.team_role_id === "object" && m.team_role_id !== null ? m.team_role_id.code : null;
}

function roleId(m: OrganizationMember): string {
  return typeof m.team_role_id === "object" && m.team_role_id !== null ? m.team_role_id._id : m.team_role_id;
}

function subscriberName(sub: MembershipSubscription): string {
  if (typeof sub.member_user_id === "object" && sub.member_user_id !== null) {
    const name = `${sub.member_user_id.first_name ?? ""} ${sub.member_user_id.last_name ?? ""}`.trim();
    return name || sub.member_user_id.email;
  }
  return "Member";
}

function subscriberPlan(sub: MembershipSubscription): string | null {
  if (typeof sub.plan_id === "object" && sub.plan_id !== null) return sub.plan_id.name;
  return null;
}

/**
 * Memberships that still count as members. The API ends a trainer's link to
 * a member once their membership ends, so an ended one with a leftover
 * assignment is no longer the trainer's client. Same set as my-providers.
 */
const LIVE_STATUSES: ReadonlySet<string> = new Set([
  MembershipSubscriptionStatus.ACTIVE,
  MembershipSubscriptionStatus.PAUSED,
  MembershipSubscriptionStatus.PAST_DUE,
]);

/** The gym members assigned to this staff user (ids may arrive as strings or ObjectIds). */
function assignedTo(subs: readonly MembershipSubscription[], userId: string): MembershipSubscription[] {
  return subs.filter(
    (s) =>
      s.assigned_staff_user_id != null &&
      String(s.assigned_staff_user_id) === userId &&
      LIVE_STATUSES.has(s.status),
  );
}

type AssignedState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; subs: MembershipSubscription[] };

/** A fetched result, tagged with the trainer it was fetched for. */
type AssignedResult = { userId: string } & ({ kind: "error"; message: string } | { kind: "ready"; subs: MembershipSubscription[] });

export default function GymSingleStaffPage({ params }: { params: Promise<{ staffId: string }> }) {
  const { staffId } = React.use(params);
  const router = useRouter();
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { user } = useAuth();
  const { fmtDate } = useOrgFormat();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const [member, setMember] = useState<OrganizationMember | null>(null);
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [assignedResult, setAssignedResult] = useState<AssignedResult | null>(null);

  const orgId = currentOrg?._id;

  useEffect(() => {
    if (orgLoading || !orgId) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        // Roles only feed the role picker; a failure there shouldn't hide the profile.
        const [res, rolesRes] = await Promise.all([
          teamsService.getMembers(orgId),
          teamsService.getRoles(orgId).catch(() => null),
        ]);
        if (!active) return;
        if (!res.success || !res.data) {
          setError(res.message || "We couldn't load this staff member.");
          return;
        }
        const found = res.data.find((m) => m._id === staffId) ?? null;
        setMember(found);
        setNotFound(!found);
        setError(null);
        if (rolesRes?.success && rolesRes.data) setRoles(rolesRes.data);
      } catch {
        if (active) setError("We couldn't load this staff member. Try again shortly.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [orgId, orgLoading, staffId]);

  const uid = member ? memberUserId(member) : null;
  const isTrainer = member ? roleCode(member) === STAFF_TRAINER_ROLE_CODE : false;

  // A staff trainer's clients are the gym members assigned to them. The org
  // subscriptions list already carries `assigned_staff_user_id`.
  useEffect(() => {
    if (!orgId || !uid || !isTrainer) return;
    let active = true;
    const failed = "We couldn't load their assigned members.";
    void marketplaceService
      .getOrgMembershipSubscriptions(orgId)
      .then((res) => {
        if (!active) return;
        setAssignedResult(
          res.success && res.data
            ? { userId: uid, kind: "ready", subs: assignedTo(res.data, uid) }
            : { userId: uid, kind: "error", message: res.message || failed },
        );
      })
      .catch(() => {
        if (active) setAssignedResult({ userId: uid, kind: "error", message: failed });
      });
    return () => {
      active = false;
    };
  }, [orgId, uid, isTrainer]);

  const assigned: AssignedState =
    assignedResult && assignedResult.userId === uid ? assignedResult : { kind: "loading" };

  // Same authority the Team page uses for role changes and removals.
  const canManage = !!currentOrg && (currentOrg.is_owner === true || currentOrg.can_manage_organization === true);
  const isSelf = !!uid && uid === user?.id;
  const canEdit = canManage && !isSelf;

  const roleOptions = useMemo(() => roles.map((r) => ({ label: r.name, value: r._id })), [roles]);

  async function changeRole(nextRoleId: string) {
    if (!member || !orgId || nextRoleId === roleId(member)) return;
    setSavingRole(true);
    const res = await teamsService.updateMember(orgId, member._id, { team_role_id: nextRoleId });
    setSavingRole(false);
    if (!res.success) {
      toast.error(res.message || "Could not update member role.");
      return;
    }
    const nextRole = roles.find((r) => r._id === nextRoleId);
    setMember((m) => (m ? { ...m, team_role_id: nextRole ?? res.data?.team_role_id ?? nextRoleId } : m));
    toast.success(nextRole ? `Role changed to ${nextRole.name}.` : "Role updated.");
  }

  function confirmRemove() {
    if (!member || !orgId) return;
    const name = memberDisplayName(member);
    requestConfirmation({
      title: `Remove ${name} from your team?`,
      description: "They lose access to this workspace straight away. You can invite them again later.",
      confirmLabel: "Remove",
      confirmVariant: "danger",
      onConfirm: async () => {
        const res = await teamsService.removeMember(orgId, member._id);
        if (!res.success) {
          toast.error(res.message || "Could not remove member.");
          return;
        }
        toast.success(`${name} was removed from your team.`);
        router.push(STAFF_HREF);
      },
    });
  }

  if (!currentOrg && !orgLoading) {
    return (
      <GymDashboardShell activeItem="Staff" crumb="Staff">
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-2)" }}>
          Select an organization to view its staff.
        </div>
      </GymDashboardShell>
    );
  }

  if (loading) {
    return (
      <GymDashboardShell activeItem="Staff" crumb="Staff">
        <AsyncSpinner size="page" label="Loading staff member" />
      </GymDashboardShell>
    );
  }

  if (error) {
    return (
      <GymDashboardShell activeItem="Staff" crumb="Staff">
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load this staff member</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      </GymDashboardShell>
    );
  }

  if (notFound || !member) {
    return (
      <GymDashboardShell activeItem="Staff" crumb="Not found">
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Staff member not found</p>
          <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>
            They may have been removed from your team, or the link is invalid.
          </p>
          <Link href={STAFF_HREF} className="btn-ghost-v2 mt-2">
            Back to staff
          </Link>
        </div>
      </GymDashboardShell>
    );
  }

  const name = memberDisplayName(member);
  const email = memberDisplayEmail(member);
  const role = memberRoleLabel(member);
  const st = MEMBER_STATUS_STYLE[member.status];
  const joined = member.joined_at ?? member.created_at;
  const canMessage = member.status === MemberStatus.ACTIVE && !!uid && !isSelf;

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Email", value: email || "-" },
    {
      label: "Role",
      value:
        canEdit && roleOptions.length > 0 ? (
          <div className="max-w-[260px]">
            <SearchableSelect
              id="staff-role"
              name="team_role_id"
              value={roleId(member)}
              onChange={(value) => void changeRole(value)}
              options={roleOptions}
              placeholder={role}
              disabled={savingRole}
            />
          </div>
        ) : (
          role
        ),
    },
    {
      label: "Status",
      value: (
        <StatusPill tone={st?.tone ?? "neutral"} label={st?.label ?? member.status} />
      ),
    },
    { label: "Joined", value: joined ? fmtDate(joined) : "-" },
  ];

  return (
    <GymDashboardShell activeItem="Staff" crumb={name}>
      <Link href={STAFF_HREF} className="text-[13px] self-start hover:underline" style={{ color: "var(--fg-3)" }}>
        &larr; All staff
      </Link>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-4.5 items-start sm:items-center">
        <span className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-(--r-3) flex items-center justify-center text-[20px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
          {memberInitials(name)}
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>{name}</h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            {role}
            {joined ? ` · joined ${fmtDate(joined)}` : ""}
          </p>
        </div>
        {canMessage && (
          <StartConversationButton recipientUserId={uid!} messagesHref="/dashboard/gym-owner/messages" label="Message" />
        )}
      </div>

      {/* Details */}
      {/* overflow-visible: the role select opens an in-flow dropdown. */}
      <DSCard className="p-5.5 overflow-visible!">
        <h3 className="text-[15px] font-medium mb-4" style={{ color: "var(--ink)" }}>Details</h3>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          {details.map((row) => (
            <div key={row.label}>
              <Eyebrow className="mb-0.5">{row.label}</Eyebrow>
              <div className="text-[13.5px]" style={{ color: "var(--ink)" }}>{row.value}</div>
            </div>
          ))}
        </div>
      </DSCard>

      {/* A staff trainer's assigned members */}
      {isTrainer && (
        <DSCard className="p-5.5">
          <h3 className="text-[15px] font-medium mb-1" style={{ color: "var(--ink)" }}>
            Assigned members{assigned.kind === "ready" ? ` · ${assigned.subs.length}` : ""}
          </h3>
          <p className="text-[13px] mb-3.5" style={{ color: "var(--fg-3)" }}>
            Gym members you&apos;ve assigned to {name}. Assign or move a member from their page.
          </p>
          {assigned.kind === "loading" ? (
            <AsyncSpinner label="Loading assigned members" />
          ) : assigned.kind === "error" ? (
            <div className="text-[13px]" style={{ color: "var(--danger)" }}>{assigned.message}</div>
          ) : assigned.subs.length === 0 ? (
            <EmptySlate message="No members assigned yet." hint="Open a member from Members and choose this trainer." mt="mt-0" />
          ) : (
            <div className="flex flex-col gap-2">
              {assigned.subs.map((sub) => {
                const meta = membershipStatusMeta(sub.status);
                const plan = subscriberPlan(sub);
                return (
                  <Link
                    key={sub._id}
                    href={`/dashboard/gym-owner/members/${sub._id}`}
                    className="flex justify-between items-center gap-3 p-2.5 px-3.5 rounded-(--r-2) hover:underline"
                    style={{ background: "var(--bg-2)" }}
                  >
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{subscriberName(sub)}</div>
                      {plan && (
                        <div className="font-mono text-[11px] mt-0.5 truncate" style={{ color: "var(--fg-3)" }}>{plan}</div>
                      )}
                    </div>
                    <StatusPill tone={meta.tone} label={meta.label} title={meta.hint} className="shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </DSCard>
      )}

      {/* Remove */}
      {canEdit && (
        <DSCard className="p-5.5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Remove from team</h3>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--fg-3)" }}>
              {name} will no longer have access to this workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={confirmRemove}
            className="rounded-(--r-2) border px-3.5 py-2 text-[13px] min-h-11 cursor-pointer"
            style={{ borderColor: "var(--danger)", color: "var(--danger)", background: "transparent" }}
          >
            Remove from team
          </button>
        </DSCard>
      )}

      {confirmationModal}
    </GymDashboardShell>
  );
}
