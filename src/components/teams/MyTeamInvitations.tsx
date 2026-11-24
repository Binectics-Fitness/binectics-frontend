"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { teamsService, type MyTeamInvitation } from "@/lib/api/teams";
import { getDashboardRoute } from "@/lib/constants/routes";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { teamInviteFailure, teamInviteIsGone, teamInviteRole } from "@/lib/teamInvites";
import { UserRole } from "@/lib/types";
import { inviteDestination } from "@/lib/workspaces";

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; items: MyTeamInvitation[] };

/**
 * The signed-in person's pending invitations to a workspace's team, answered
 * here with Accept or Decline instead of the emailed link. Shows nothing when
 * there are none unless `showEmpty` (the invitations page itself) asks for a
 * line saying so.
 */
export function MyTeamInvitations({ showEmpty = false }: { showEmpty?: boolean } = {}) {
  const { user, refreshUser } = useAuth();
  const orgs = useOptionalOrganization();
  const { fmtDate } = useOrgFormat();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // The workspace just joined and who the person is now; the destination is
  // read at render, after the workspaces were refreshed.
  const [joined, setJoined] = useState<{ organizationId: string; as: { id: string; role: string } | null } | null>(null);

  const fetchInvitations = useCallback(async () => {
    const res = await teamsService.getMyInvitations();
    // An API without the route has nothing to list; that is not a failure.
    if (res.success || res.status === 404) {
      setLoad({ state: "ready", items: res.success && Array.isArray(res.data) ? res.data : [] });
    } else {
      setLoad({ state: "error", message: "Couldn't load your team invitations." });
    }
  }, []);

  useEffect(() => {
    // Reads on mount; the state it sets comes from the API, not from props.
    const kick = window.setTimeout(() => void fetchInvitations(), 0);
    return () => window.clearTimeout(kick);
  }, [fetchInvitations]);

  const drop = (id: string) =>
    setLoad((prev) => (prev.state === "ready" ? { state: "ready", items: prev.items.filter((i) => i.id !== id) } : prev));

  async function accept(invitation: MyTeamInvitation) {
    if (busyId) return;
    setBusyId(invitation.id);
    setAcceptingId(invitation.id);
    setRowError(null);
    setNotice(null);
    const gym = invitation.organization_name || "The gym";
    try {
      const res = await teamsService.acceptInvitationById(invitation.id);
      if (!res.success) {
        const failure = teamInviteFailure(res, gym, "Couldn't accept the invitation. Try again.");
        if (teamInviteIsGone(failure.kind)) {
          drop(invitation.id);
          setNotice(failure.message);
        } else {
          setRowError({ id: invitation.id, message: failure.message });
        }
        return;
      }
      drop(invitation.id);
      // Joining as a gym's trainer makes the account a trainer, and joining a
      // team adds its workspace: take both before offering where to go.
      const [fresh] = await Promise.all([refreshUser(), orgs?.refreshOrganizations()]);
      setJoined({ organizationId: invitation.organization_id, as: fresh ?? user });
      toast.success(`You've joined ${invitation.organization_name || "the team"}`);
    } catch {
      setRowError({ id: invitation.id, message: "Couldn't accept the invitation. Try again." });
    } finally {
      setBusyId(null);
      setAcceptingId(null);
    }
  }

  function decline(invitation: MyTeamInvitation) {
    if (busyId) return;
    const gym = invitation.organization_name || "the gym";
    requestConfirmation({
      title: `Decline ${gym}'s invitation?`,
      description: "You can be invited again later.",
      confirmLabel: "Decline",
      confirmVariant: "danger",
      onConfirm: async () => {
        setBusyId(invitation.id);
        setRowError(null);
        setNotice(null);
        try {
          const res = await teamsService.declineInvitationById(invitation.id);
          if (res.success) {
            drop(invitation.id);
            toast.success("Invitation declined");
            return;
          }
          const failure = teamInviteFailure(res, gym, "Couldn't decline the invitation. Try again.");
          if (teamInviteIsGone(failure.kind)) {
            drop(invitation.id);
            setNotice(failure.message);
          } else {
            setRowError({ id: invitation.id, message: failure.message });
          }
        } catch {
          setRowError({ id: invitation.id, message: "Couldn't decline the invitation. Try again." });
        } finally {
          setBusyId(null);
        }
      },
    });
  }

  const destination = joined
    ? inviteDestination(
        joined.as,
        orgs?.organizations,
        joined.organizationId,
        getDashboardRoute((joined.as?.role as UserRole) ?? UserRole.USER),
      )
    : null;
  const items = load.state === "ready" ? load.items : [];

  if (load.state === "loading") {
    return showEmpty ? (
      <p role="status" className="text-[13px]" style={{ color: "var(--fg-3)" }}>
        Loading your invitations…
      </p>
    ) : (
      confirmationModal
    );
  }
  if (items.length === 0 && !destination && !notice && load.state !== "error" && !showEmpty) {
    return confirmationModal;
  }

  return (
    <section
      aria-label={showEmpty ? "Team invitations" : undefined}
      aria-labelledby={showEmpty ? undefined : "my-team-invitations"}
      className="rounded-(--r-3) p-4 flex flex-col gap-3"
      style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
    >
      {/* The invitations page carries its own heading. */}
      {!showEmpty && (
        <h2 id="my-team-invitations" className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>
          Your team invitations
        </h2>
      )}

      {load.state === "error" && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 text-[13px]" style={{ color: "var(--danger-ink)" }}>
          {load.message}
          <button
            type="button"
            className="btn-ghost-v2 sm min-h-11"
            onClick={() => {
              setLoad({ state: "loading" });
              void fetchInvitations();
            }}
          >
            Try again
          </button>
        </div>
      )}

      {destination && (
        <div role="status" className="rounded-(--r-2) p-3 flex flex-wrap items-center justify-between gap-2" style={{ background: "var(--signal-soft)" }}>
          <span className="text-[13px]" style={{ color: "var(--ink)" }}>{destination.body}</span>
          <Link
            href={destination.href}
            onClick={() => {
              const org = orgs?.organizations.find((o) => o._id === destination.organizationId);
              if (org) orgs?.setCurrentOrg(org);
            }}
            className="btn-primary-v2 sm min-h-11 inline-flex items-center"
          >
            {destination.label}
          </Link>
        </div>
      )}

      {notice && (
        <p role="status" className="text-[13px]" style={{ color: "var(--fg-2)" }}>
          {notice}
        </p>
      )}

      {showEmpty && load.state === "ready" && items.length === 0 && !destination && (
        <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
          No pending team invitations.
        </p>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((invitation) => {
            const busy = acceptingId === invitation.id;
            const role = teamInviteRole(invitation);
            const gym = invitation.organization_name || "A gym";
            const meta = [
              invitation.invited_by_name ? `From ${invitation.invited_by_name}` : null,
              invitation.expires_at ? `Expires ${fmtDate(invitation.expires_at)}` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={invitation.id}
                className="rounded-(--r-2) p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                    {gym}
                    {role ? <span style={{ color: "var(--fg-2)", fontWeight: 400 }}> · {role}</span> : null}
                  </div>
                  {meta && <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>{meta}</div>}
                  {rowError?.id === invitation.id && (
                    <p role="alert" className="text-[13px] mt-1" style={{ color: "var(--danger-ink)" }}>
                      {rowError.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    className="btn-ghost-v2 sm min-h-11 px-4"
                    disabled={!!busyId}
                    aria-label={`Decline ${gym}'s invitation`}
                    onClick={() => decline(invitation)}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    className="btn-primary-v2 sm min-h-11 px-4"
                    disabled={!!busyId}
                    aria-busy={busy}
                    aria-label={`Accept ${gym}'s invitation`}
                    onClick={() => void accept(invitation)}
                  >
                    {busy ? "Joining…" : "Accept"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {confirmationModal}
    </section>
  );
}
