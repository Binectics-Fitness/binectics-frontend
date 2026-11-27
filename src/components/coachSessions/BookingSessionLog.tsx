"use client";

import { useQuery } from "@tanstack/react-query";
import { DSCard, Eyebrow } from "@/components/ds";
import { SessionLogCard } from "@/components/coachSessions/SessionLogCard";
import { coachSessionsService } from "@/lib/api/coachSessions";

/**
 * "Session log" on a session's page (board coach-session-canvas 09, WEB2):
 * the log card when the trainer logged the session on the phone, else one
 * line saying where logs are made. The log is read by its id from the
 * booking (`sessionLogId`); a 404 or a failed read is not "no log".
 */
export function BookingSessionLog({
  sessionLogId,
  clientFirstName,
  typeName,
}: {
  sessionLogId: string | null | undefined;
  clientFirstName: string;
  typeName?: string | null;
}) {
  const query = useQuery({
    queryKey: ["coach-session", sessionLogId],
    enabled: !!sessionLogId,
    queryFn: async () => {
      const res = await coachSessionsService.get(sessionLogId!);
      if (!res.success || !res.data) throw new Error(res.message ?? "Couldn't load the session log.");
      return res.data;
    },
  });

  if (!sessionLogId) {
    return (
      <DSCard className="px-4.5 py-4">
        <Eyebrow>Session log</Eyebrow>
        <p className="mt-1.5 text-[13.5px]" style={{ color: "var(--fg-2)" }}>No log for this session. Logs are made in the coach app.</p>
      </DSCard>
    );
  }
  if (query.isPending) {
    return <div role="status" aria-label="Loading session log" className="rounded-(--r-3)" style={{ background: "var(--bg-3)", height: 200 }} />;
  }
  if (query.isError) {
    return (
      <DSCard className="px-4.5 py-4">
        <Eyebrow>Session log</Eyebrow>
        <div role="alert" className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13.5px]" style={{ color: "var(--danger-ink)" }}>Couldn&apos;t load the session log.</p>
          <button type="button" className="btn-ghost-v2 sm" onClick={() => void query.refetch()}>Try again</button>
        </div>
      </DSCard>
    );
  }
  return <SessionLogCard log={query.data} firstName={clientFirstName} typeName={typeName} />;
}
