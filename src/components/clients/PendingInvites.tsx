"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DSCard, DSCardHead } from "@/components/ds";
import { toast } from "@/components/Toast";
import { progressService, type ClientInvitation, type ClientRequestItem } from "@/lib/api/progress";
import { useClientInvitations, useSentClientRequests } from "@/lib/queries/progress";
import { queryKeys } from "@/lib/queries/keys";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { useClientNow } from "@/lib/ui/useClientNow";

/** The anchor the Today page's "Pending invitations" tile opens. */
export const PENDING_INVITES_ID = "pending";

interface Row {
  id: string;
  kind: "invitation" | "request";
  who: string;
  /** "Invited to sign up" or "Asked to approve you", and when it lapses. */
  what: string;
}

function requestName(r: ClientRequestItem): string {
  if (typeof r.client_id === "object" && r.client_id) {
    const name = `${r.client_id.first_name ?? ""} ${r.client_id.last_name ?? ""}`.trim();
    return name || r.client_id.email;
  }
  return "A member";
}

/**
 * Invites a coach has sent that nobody has answered yet: sign-up invites to
 * people not on Binectics, and requests to members who are (discoverability
 * F20). Each can be withdrawn. Renders nothing when there are none, so the
 * Clients page stays as it was for everyone without one.
 */
export function PendingInvites() {
  const { fmtDate } = useOrgFormat();
  const queryClient = useQueryClient();
  const invitations = useClientInvitations();
  const requests = useSentClientRequests();
  const [busy, setBusy] = useState<string | null>(null);
  const now = useClientNow();
  // A sign-up link past its date no longer works: say it lapsed, not "lapses".
  const lapsed = (iso: string) => !!now && new Date(iso).getTime() < now.getTime();

  const rows: Row[] = [
    ...(invitations.data ?? [])
      .filter((i: ClientInvitation) => i.status === "pending")
      .map((i): Row => ({
        id: i._id ?? i.id,
        kind: "invitation",
        who: i.first_name ? `${i.first_name} · ${i.email}` : i.email,
        what: lapsed(i.expires_at)
          ? `Invite lapsed ${fmtDate(i.expires_at)} · withdraw it and invite again`
          : `Invited to sign up · lapses ${fmtDate(i.expires_at)}`,
      })),
    ...(requests.data ?? [])
      .filter((r: ClientRequestItem) => r.status === "pending")
      .map((r): Row => ({
        id: r._id,
        kind: "request",
        who: requestName(r),
        what: `Asked to approve you · ${fmtDate(r.created_at)}`,
      })),
  ];

  if (rows.length === 0) return null;

  const withdraw = async (row: Row) => {
    setBusy(row.id);
    const res =
      row.kind === "invitation"
        ? await progressService.cancelClientInvitation(row.id)
        : await progressService.cancelClientRequest(row.id);
    setBusy(null);
    if (!res.success) {
      toast(res.message || "We couldn't withdraw that invite. Try again.", "error");
      return;
    }
    toast("Invite withdrawn.", "success");
    void queryClient.invalidateQueries({
      queryKey: row.kind === "invitation" ? queryKeys.progress.invitations() : queryKeys.progress.sentRequests(),
    });
  };

  return (
    <section id={PENDING_INVITES_ID} aria-label="Waiting on an answer" className="scroll-mt-20">
      <DSCard>
        <DSCardHead title="Waiting on an answer" subtitle={`${rows.length} invite${rows.length === 1 ? "" : "s"} not yet accepted`} />
        <ul>
          {rows.map((row, i) => (
            <li
              key={`${row.kind}-${row.id}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4.5 py-3"
              style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <span className="flex-1 min-w-[180px]">
                <span className="block text-[13.5px] font-medium break-words" style={{ color: "var(--ink)" }}>{row.who}</span>
                <span className="block text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>{row.what}</span>
              </span>
              <button
                type="button"
                className="btn-ghost-v2 sm"
                disabled={busy === row.id}
                onClick={() => void withdraw(row)}
                aria-label={`Withdraw the invite to ${row.who}`}
              >
                {busy === row.id ? "Withdrawing…" : "Withdraw"}
              </button>
            </li>
          ))}
        </ul>
      </DSCard>
    </section>
  );
}
