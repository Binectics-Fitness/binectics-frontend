"use client";

import { useQuery } from "@tanstack/react-query";
import { AsyncSpinner, DSCard, EmptySlate, Eyebrow } from "@/components/ds";
import { checkinsService } from "@/lib/api/checkins";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

/**
 * A member's check-ins at this gym: how often they come and when they last
 * did. Only facts the check-in log holds, so there is no score, streak or
 * rating here. Duplicate scans are already left out by the API.
 */
export function MemberActivityCard({ orgId, memberUserId }: { orgId: string; memberUserId: string | null }) {
  const { fmtDate, fmtDateTime, fmtNumber } = useOrgFormat();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["checkins", "memberActivity", orgId, memberUserId ?? ""],
    queryFn: async () => {
      const res = await checkinsService.getMemberActivity(orgId, memberUserId as string);
      if (!res.success || !res.data) throw new Error(res.message ?? "Couldn't load activity");
      return res.data;
    },
    enabled: !!memberUserId,
  });

  return (
    <DSCard>
      <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Activity</h2>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>Check-ins at this gym</div>
      </div>

      {!memberUserId ? (
        <div className="px-5.5 py-5"><EmptySlate message="Activity isn't available for this membership." mt="mt-0" /></div>
      ) : isLoading ? (
        <div className="px-5.5 py-2"><AsyncSpinner label="Loading activity" /></div>
      ) : isError || !data ? (
        <div className="px-5.5 py-5 text-[13px]" style={{ color: "var(--danger)" }}>
          We couldn&rsquo;t load this member&rsquo;s activity. Try again shortly.
        </div>
      ) : data.total_visits === 0 ? (
        <div className="px-5.5 py-5"><EmptySlate message="No check-ins yet." hint="Visits appear here once this member checks in." mt="mt-0" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-4">
            {[
              { label: "Visits, last 30 days", value: fmtNumber(data.visits_last_30_days) },
              { label: "Visits, all time", value: fmtNumber(data.total_visits) },
              { label: "Last visit", value: data.last_visit_at ? fmtDate(data.last_visit_at) : "-" },
            ].map((k) => (
              <div key={k.label} className="rounded-(--r-3) p-3.5 px-4" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                <Eyebrow>{k.label}</Eyebrow>
                <div className="text-[20px] font-medium tracking-[-0.02em] mt-1" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
              </div>
            ))}
          </div>
          <ul>
            {data.recent.map((v) => (
              <li
                key={v._id}
                className="flex items-center justify-between gap-3 px-5.5 py-3 text-[13px]"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span className="font-mono text-[12px]" style={{ color: "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>{fmtDateTime(v.checked_in_at)}</span>
                {v.listing_headline && <span className="truncate" style={{ color: "var(--fg-3)" }}>{v.listing_headline}</span>}
              </li>
            ))}
          </ul>
          {data.total_visits > data.recent.length && (
            <div className="px-5.5 py-3 text-[12.5px]" style={{ borderTop: "1px solid var(--border)", color: "var(--fg-3)" }}>
              Showing the latest {fmtNumber(data.recent.length)} of {fmtNumber(data.total_visits)} visits.
            </div>
          )}
        </>
      )}
    </DSCard>
  );
}
