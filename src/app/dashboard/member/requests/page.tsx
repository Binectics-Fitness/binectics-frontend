"use client";

/**
 * Requests & invitations — the member side of the client-authorisation flow.
 *
 * Trainers and dietitians add a member either by sending a *request* (the
 * member already has an account) or an *invitation* (addressed to an email).
 * Both wait on the member's answer, and until now the member had nowhere to
 * give one: the endpoints and query hooks existed with zero consumers, so an
 * invited member could only get in by clicking the emailed link.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { progressService } from "@/lib/api/progress";
import {
  usePendingClientRequests,
  usePendingInvitations,
} from "@/lib/queries/progress";
import { queryKeys } from "@/lib/queries/keys";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  expiryLabel,
  inviterName,
  isInvitationExpired,
  requesterName,
} from "@/lib/progress/invitations";

const cardStyle = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-3)",
  padding: 22,
};

const rowStyle = {
  background: "var(--bg-2)",
  borderRadius: "var(--r-2)",
  padding: 16,
};

export default function MemberRequestsPage() {
  // Providers have their own client-management surfaces; this page is the
  // member end of the same flow.
  const { isAuthorized } = useRoleGuard(UserRole.USER);
  if (!isAuthorized) return null;
  return <MemberRequestsContent />;
}

function MemberRequestsContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { fmtDate } = useOrgFormat();

  const requestsQuery = usePendingClientRequests();
  const invitationsQuery = usePendingInvitations();

  /** Id of the row currently mid-flight, so only its buttons show a spinner. */
  const [busyId, setBusyId] = useState<string | null>(null);

  const requests = requestsQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];

  const loading = requestsQuery.isLoading || invitationsQuery.isLoading;
  const failed = requestsQuery.isError || invitationsQuery.isError;
  const isEmpty = !loading && !failed && requests.length === 0 && invitations.length === 0;

  /**
   * Accepting either kind creates a client profile and links the provider, so
   * refresh the member's own profiles alongside the two pending lists.
   */
  const refetchAll = async () => {
    await Promise.all([
      requestsQuery.refetch(),
      invitationsQuery.refetch(),
      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.myOwnProfiles(),
      }),
    ]);
  };

  const respondToRequest = async (requestId: string, approved: boolean) => {
    if (busyId) return;
    setBusyId(requestId);
    try {
      const res = await progressService.respondToClientRequest(requestId, approved);
      if (res.success) {
        await refetchAll();
        toast.success(
          approved
            ? "Request accepted, they can now see your progress."
            : "Request declined.",
        );
      } else {
        toast.error(res.message || "Could not send your answer. Please try again.");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not send your answer. Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    if (busyId) return;
    setBusyId(invitationId);
    try {
      const res = await progressService.acceptInvitationById(invitationId);
      if (res.success) {
        await refetchAll();
        toast.success("Invitation accepted.");
      } else {
        toast.error(
          res.message || "Could not accept the invitation. Please try again.",
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not accept the invitation. Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    if (busyId) return;
    setBusyId(invitationId);
    try {
      const res = await progressService.declineInvitationById(invitationId);
      if (res.success) {
        await refetchAll();
        toast.success("Invitation declined.");
      } else {
        toast.error(
          res.message || "Could not decline the invitation. Please try again.",
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not decline the invitation. Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <MemberDashboardShell activeLabel="Requests">
      <div style={{ marginBottom: 18 }}>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: "var(--fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Your account
        </div>
        <h1
          style={{
            fontSize: 30,
            letterSpacing: "-0.024em",
            fontWeight: 500,
            marginTop: 6,
            color: "var(--ink)",
          }}
        >
          Requests &amp; invitations
        </h1>
        <p style={{ color: "var(--fg-3)", marginTop: 6 }}>
          Trainers and dietitians who want to coach you need your say-so before
          they can see your progress.
        </p>
      </div>

      {failed && (
        <div
          className="rounded-(--r-3) p-4 mb-4 text-[13px]"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
          }}
          role="alert"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span>We couldn&apos;t load your requests and invitations.</span>
            <button
              type="button"
              onClick={() => void refetchAll()}
              className="font-mono text-[11px] uppercase tracking-[0.04em]"
              style={{
                color: "var(--danger)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div style={cardStyle}>
          <AsyncSpinner label="Loading requests and invitations" />
        </div>
      )}

      {isEmpty && (
        <div style={cardStyle}>
          <EmptySlate
            message="Nothing waiting on you."
            hint="When a trainer or dietitian asks to add you as a client, it shows up here."
            mt="mt-0"
          />
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 14 }}>
          <h2
            style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "var(--ink)" }}
          >
            Requests · {requests.length}
          </h2>
          <div className="flex flex-col gap-2">
            {requests.map((request) => {
              const busy = busyId === request._id;
              return (
                <div
                  key={request._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={rowStyle}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>
                      {requesterName(request)}
                    </div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                      {request.professional_type
                        ? `${request.professional_type} · `
                        : ""}
                      Asked {fmtDate(request.created_at)}
                    </div>
                    {request.message && (
                      <div
                        className="text-[13px] mt-2"
                        style={{ color: "var(--fg-2)" }}
                      >
                        &ldquo;{request.message}&rdquo;
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => void respondToRequest(request._id, true)}
                      disabled={busy}
                      className="btn-primary-v2 sm"
                      style={{ whiteSpace: "nowrap", opacity: busy ? 0.6 : 1 }}
                    >
                      {busy ? "Saving…" : "Accept"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void respondToRequest(request._id, false)}
                      disabled={busy}
                      className="btn-ghost-v2 sm"
                      style={{ whiteSpace: "nowrap", opacity: busy ? 0.6 : 1 }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && invitations.length > 0 && (
        <div style={cardStyle}>
          <h2
            style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: "var(--ink)" }}
          >
            Invitations · {invitations.length}
          </h2>
          <p className="text-[12.5px]" style={{ color: "var(--fg-3)", marginBottom: 14 }}>
            Sent to {user?.email ?? "your email address"}.
          </p>
          <div className="flex flex-col gap-2">
            {invitations.map((invitation) => {
              const id = invitation._id ?? invitation.id;
              const busy = busyId === id;
              const expired = isInvitationExpired(invitation.expires_at);
              const expiry = expiryLabel(invitation.expires_at);
              return (
                <div
                  key={id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={rowStyle}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>
                      {inviterName(invitation)}
                    </div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                      Invited {invitation.email}
                      {expiry ? ` · ${expiry}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => void declineInvitation(id)}
                      disabled={busy || expired}
                      className="btn-ghost-v2 sm"
                      style={{
                        whiteSpace: "nowrap",
                        opacity: busy || expired ? 0.5 : 1,
                        cursor: expired ? "not-allowed" : undefined,
                      }}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => void acceptInvitation(id)}
                      disabled={busy || expired}
                      className="btn-primary-v2 sm"
                      style={{
                        whiteSpace: "nowrap",
                        opacity: busy || expired ? 0.5 : 1,
                        cursor: expired ? "not-allowed" : undefined,
                      }}
                    >
                      {busy ? "Saving…" : expired ? "Expired" : "Accept"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </MemberDashboardShell>
  );
}
