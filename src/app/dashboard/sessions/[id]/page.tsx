"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AsyncSpinner, DSCard, MemberDashboardShell } from "@/components/ds";
import { ClientSessionSummaryView } from "@/components/coachSessions/ClientSessionSummaryView";
import { coachSessionsService } from "@/lib/api/coachSessions";
import { consultationsService } from "@/lib/api/consultations";
import { marketplaceService } from "@/lib/api/marketplace";

/**
 * "Your session": the summary of one coached session for the member it was
 * with (the SESSION_SUMMARY notification opens /dashboard/sessions/:id).
 * Reads only the client endpoints, so the coach's private note and the
 * energy answer never reach this page. "All sessions" at the bottom opens
 * the member's list (board 07, C2 and C6).
 */
export default function SessionSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const query = useQuery({
    queryKey: ["my-coach-session", id],
    queryFn: async () => {
      const one = await coachSessionsService.getMine(id);
      if (!one.success || !one.data) {
        const notFound = one.status === 404 || one.status === 403 || one.status === 400;
        throw Object.assign(new Error(one.message ?? "Couldn't load this summary."), { notFound });
      }
      const log = one.data;
      const providerId = log.provider?.id;
      const [all, booking, mine] = await Promise.allSettled([
        coachSessionsService.listMine(20),
        log.booking_id ? consultationsService.getBooking(log.booking_id) : Promise.resolve(null),
        log.suggested_next && providerId ? marketplaceService.getMyProviders() : Promise.resolve(null),
      ]);
      const sessions = all.status === "fulfilled" && all.value.success ? (all.value.data?.items ?? []) : [];
      const typeName = booking.status === "fulfilled" && booking.value?.success ? (booking.value.data?.consultationTypeName ?? null) : null;
      const listingId =
        mine.status === "fulfilled" && mine.value?.success
          ? (mine.value.data?.professionals.find((p) => p.professional_id === providerId)?.listing?._id ?? null)
          : null;
      return { log, sessions, typeName, listingId };
    },
    retry: (count, err) => !(err as { notFound?: boolean }).notFound && count < 1,
  });

  const data = query.data;
  const notFound = (query.error as { notFound?: boolean } | null)?.notFound === true;
  const next = data?.log.suggested_next;
  const bookNextHref =
    data && next?.consultation_type_id && next.starts_at && data.listingId
      ? `/booking?${new URLSearchParams({ listingId: data.listingId, consultationTypeId: next.consultation_type_id, startsAt: next.starts_at }).toString()}`
      : null;

  return (
    <MemberDashboardShell activeLabel="Bookings">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4">
        <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          <Link href="/dashboard/sessions" style={{ color: "var(--fg-3)", textDecoration: "none" }} className="hover:underline">Your sessions</Link>
        </div>
        <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Your session</h1>

        {query.isPending && (
          <DSCard className="p-6">
            <AsyncSpinner label="Loading summary" />
          </DSCard>
        )}

        {query.isError && (
          <DSCard className="px-5 py-4">
            <div role="alert">
              <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                {notFound ? "This session isn't available." : "Couldn't load this summary."}
              </p>
              {notFound ? (
                <p className="mt-1 text-[13.5px]" style={{ color: "var(--fg-2)" }}>It may belong to another account.</p>
              ) : (
                <button type="button" className="btn-ghost-v2 mt-3" style={{ height: 44 }} onClick={() => void query.refetch()}>
                  Try again
                </button>
              )}
            </div>
          </DSCard>
        )}

        {data && (
          <>
            <ClientSessionSummaryView log={data.log} typeName={data.typeName} bookNextHref={bookNextHref} />
            {data.sessions.length > 1 && (
              <Link href="/dashboard/sessions" className="btn-ghost-v2 self-center" style={{ height: 44 }}>
                All sessions
              </Link>
            )}
          </>
        )}
      </div>
    </MemberDashboardShell>
  );
}
