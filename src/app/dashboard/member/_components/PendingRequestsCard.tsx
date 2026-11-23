"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { IconTile } from "@/components/ds/IconTile";
import { usePendingClientRequests, usePendingInvitations } from "@/lib/queries/progress";
import { inviterName, isInvitationExpired, requesterName } from "@/lib/progress/invitations";
import { REVIEW, pendingSummary } from "@/lib/today/todayCopy";

const REQUESTS_HREF = "/dashboard/member/requests";

/**
 * Today's prompt when a trainer or dietitian is waiting on the member's
 * answer (today-canvas S1; mobile components/providers/PendingRequestsCard).
 * It sits above the plan: nothing they would do can start until this is
 * answered. Review opens the Requests page, where the answer is given.
 * A failed read shows nothing: the Requests page is one tap away in the nav.
 */
export function PendingRequestsCard() {
  const requests = usePendingClientRequests();
  const invitations = usePendingInvitations();
  const names = [
    ...(requests.data ?? []).map(requesterName),
    ...(invitations.data ?? []).filter((i) => !isInvitationExpired(i.expires_at)).map(inviterName),
  ];
  const summary = pendingSummary(names);
  if (!summary) return null;
  const count = names.length;
  return (
    <section
      data-testid="pending-requests-card"
      aria-label={summary.title}
      className="flex flex-col gap-3.5 rounded-(--r-3) p-5"
      style={{ background: "var(--bg)", border: "1px solid var(--ink)" }}
    >
      <div className="flex items-start gap-3">
        <IconTile icon={UserPlus} tone="warn" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)" }}>
            {summary.title}
          </h2>
          <p className="mt-1 text-[13.5px]" style={{ color: "var(--fg-3)" }}>
            {summary.body}
          </p>
        </div>
        <span
          className="inline-flex h-5.5 min-w-5.5 shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-[11px] tabular-nums"
          style={{ background: "var(--ink)", color: "var(--bg)" }}
          aria-label={`${count} waiting`}
        >
          {count > 99 ? "99+" : count}
        </span>
      </div>
      <Link
        href={REQUESTS_HREF}
        className="btn-primary-v2 w-full justify-center"
        style={{ height: 44 }}
        aria-label={`${summary.title}. ${REVIEW}`}
      >
        {REVIEW}
      </Link>
    </section>
  );
}
