"use client";

import { useQuery } from "@tanstack/react-query";
import { AsyncSpinner, DSCard, MemberDashboardShell } from "@/components/ds";
import { YourSessionsList } from "@/components/coachSessions/YourSessionsList";
import { coachSessionsService } from "@/lib/api/coachSessions";

/** "Your sessions": the coached sessions a member's coaches logged, newest first. */
export default function YourSessionsPage() {
  const query = useQuery({
    queryKey: ["my-coach-sessions"],
    queryFn: async () => {
      const res = await coachSessionsService.listMine(50);
      if (!res.success) throw new Error(res.message ?? "Couldn't load your sessions.");
      return res.data?.items ?? [];
    },
  });

  return (
    <MemberDashboardShell activeLabel="Bookings">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4">
        <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Your sessions</h1>
        {query.isPending && (
          <DSCard className="p-6">
            <AsyncSpinner label="Loading your sessions" />
          </DSCard>
        )}
        {query.isError && (
          <DSCard className="px-5 py-4">
            <div role="alert">
              <p className="text-[15px] font-medium" style={{ color: "var(--danger-ink)" }}>Couldn&apos;t load your sessions.</p>
              <button type="button" className="btn-ghost-v2 mt-3" style={{ height: 44 }} onClick={() => void query.refetch()}>
                Try again
              </button>
            </div>
          </DSCard>
        )}
        {query.isSuccess && query.data.length === 0 && (
          <DSCard className="px-5 py-4">
            <p className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>No coached sessions yet.</p>
          </DSCard>
        )}
        {query.isSuccess && <YourSessionsList sessions={query.data} />}
      </div>
    </MemberDashboardShell>
  );
}
