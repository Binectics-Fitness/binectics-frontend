"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { AddStaffModal } from "@/components/ds/modals/AddStaffModal";
import { teamsService, MemberStatus, InvitationStatus, type OrganizationMember, type TeamInvitation } from "@/lib/api/teams";
import { useOrganization } from "@/contexts/OrganizationContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function memberName(m: OrganizationMember): string {
  if (typeof m.user_id === "object" && m.user_id !== null) {
    return `${m.user_id.first_name} ${m.user_id.last_name}`.trim();
  }
  return "Member";
}

function memberEmail(m: OrganizationMember): string | null {
  if (typeof m.user_id === "object" && m.user_id !== null) return m.user_id.email;
  return null;
}

function roleName(m: OrganizationMember): string {
  if (typeof m.team_role_id === "object" && m.team_role_id !== null) return m.team_role_id.name;
  return "Member";
}

function inviteRoleName(inv: TeamInvitation): string | null {
  if (typeof inv.team_role_id === "object" && inv.team_role_id !== null) return inv.team_role_id.name;
  return null;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const STATUS_STYLE: Record<MemberStatus, { color: string; bg: string; label: string }> = {
  [MemberStatus.ACTIVE]: { color: "var(--signal-ink)", bg: "var(--signal-soft)", label: "Active" },
  [MemberStatus.PENDING]: { color: "oklch(0.42 0.13 75)", bg: "var(--trainer-soft)", label: "Pending" },
  [MemberStatus.INACTIVE]: { color: "var(--fg-3)", bg: "var(--bg-2)", label: "Inactive" },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GymStaffPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (orgLoading || !currentOrg) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        // Invitations are additive UI — a failure there shouldn't blank the staff list.
        const [res, invitesRes] = await Promise.all([
          teamsService.getMembers(currentOrg._id),
          teamsService.getInvitations(currentOrg._id).catch(() => null),
        ]);
        if (!active) return;
        if (res.success && res.data) {
          setMembers(res.data);
          setError(null);
        } else {
          setError(res.message || "We couldn't load your staff.");
        }
        if (invitesRes?.success && invitesRes.data) {
          setPendingInvites(invitesRes.data.filter((i) => i.status === InvitationStatus.PENDING));
        }
      } catch {
        if (active) setError("We couldn't load your staff. Try again shortly.");
      } finally {
        if (active) setLoading(false);
      }
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [currentOrg, orgLoading, reloadKey]);

  const activeCount = useMemo(() => members.filter((m) => m.status === MemberStatus.ACTIVE).length, [members]);

  return (
    <GymDashboardShell
      activeItem="Staff"
      crumb="Staff"
      actions={
        <>
          <button className="btn-ghost-v2 sm">Invite link</button>
          <button className="btn-primary-v2 sm" onClick={() => setAddStaffOpen(true)}>+ Add staff</button>
        </>
      }
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Staff</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {members.length > 0 ? `${members.length} team member${members.length === 1 ? "" : "s"} · ${activeCount} active` : "Your team and their roles"}
        </div>
      </div>

      {!currentOrg && !orgLoading ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-2)" }}>
          Select an organization to view its staff.
        </div>
      ) : error ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load staff</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      ) : null}

      {loading && members.length === 0 ? (
        <AsyncSpinner size="page" label="Loading staff" />
      ) : members.length === 0 && !error && currentOrg ? (
        <div className="rounded-(--r-3) px-4.5 py-6" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <EmptySlate message="No staff yet." hint="Add your first team member to get started." mt="mt-0" />
        </div>
      ) : members.length > 0 ? (
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          {members.map((m, i) => {
            const name = memberName(m);
            const email = memberEmail(m);
            const st = STATUS_STYLE[m.status];
            const joined = m.joined_at ?? m.created_at;
            return (
              <div key={m._id} className="grid gap-4 px-4.5 py-3.5 items-center hover:bg-bg-2" style={{ gridTemplateColumns: "1fr auto auto", borderBottom: i < members.length - 1 ? "1px solid var(--border)" : "none", transition: "background 60ms" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{initials(name)}</span>
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{name}</div>
                    <div className="font-mono text-[12px] truncate mt-0.5" style={{ color: "var(--fg-3)" }}>
                      {roleName(m)}{email ? ` · ${email}` : ""}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
                  {joined ? `Joined ${format(new Date(joined), "MMM yyyy")}` : "—"}
                </span>
                <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium" style={{ color: st?.color, background: st?.bg, border: `1px solid ${st?.color ?? "var(--border)"}` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />{st?.label ?? m.status}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {pendingInvites.length > 0 && (
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>
            Pending invitations ({pendingInvites.length})
          </div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {pendingInvites.map((inv, i) => {
              const role = inviteRoleName(inv);
              return (
                <div key={inv._id} className="grid gap-4 px-4.5 py-3.5 items-center" style={{ gridTemplateColumns: "1fr auto auto", borderBottom: i < pendingInvites.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={{ background: "var(--bg-2)", color: "var(--fg-3)", border: "1px dashed var(--border-2)" }}>{initials(inv.email)}</span>
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium truncate" style={{ color: "var(--ink)" }}>{inv.email}</div>
                      <div className="font-mono text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>{role ?? "Awaiting acceptance"}</div>
                    </div>
                  </div>
                  <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
                    Expires {format(new Date(inv.expires_at), "dd MMM")}
                  </span>
                  <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium" style={{ color: "oklch(0.42 0.13 75)", background: "var(--trainer-soft)", border: "1px solid oklch(0.42 0.13 75)" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />Invited
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AddStaffModal
        open={addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        organizationId={currentOrg?._id ?? null}
        onInvited={() => setReloadKey((k) => k + 1)}
      />
    </GymDashboardShell>
  );
}
