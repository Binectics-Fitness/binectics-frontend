"use client";

import { useQuery } from "@tanstack/react-query";
import { AsyncSpinner, DSCard, EmptySlate, Eyebrow } from "@/components/ds";
import { checkinsService } from "@/lib/api/checkins";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

/**
 * A member's activity at this gym: check-ins, and classes they BOOKED. A
 * booking is not attendance (nobody records who turns up), so classes are
 * labelled as bookings unless staff recorded that the member came, and then
 * "attended" is shown apart from "booked" and counts only those marks. Only facts the records hold:
 * no score, streak or rating. Waitlisted and cancelled bookings, and
 * duplicate scans, are left out by the API.
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

  // Attendance is a staff record; show its count only where marks exist, so a
  // gym that never records it is not shown a misleading 0.
  const hasMarks = !!data && (data.classes_attended.last_30_days > 0 || data.latest.some((v) => v.attendance !== null));

  const empty = !!data && data.total_visits === 0 && data.latest.length === 0 && !data.classes_booked.next_upcoming && data.classes_booked.last_30_days === 0;

  return (
    <DSCard>
      <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Activity</h2>
        <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>Check-ins and classes booked at this gym</div>
      </div>

      {!memberUserId ? (
        <div className="px-5.5 py-5"><EmptySlate message="Activity isn't available for this membership." mt="mt-0" /></div>
      ) : isLoading ? (
        <div className="px-5.5 py-2"><AsyncSpinner label="Loading activity" /></div>
      ) : isError || !data ? (
        <div className="px-5.5 py-5 text-[13px]" style={{ color: "var(--danger)" }}>
          We couldn&rsquo;t load this member&rsquo;s activity. Try again shortly.
        </div>
      ) : empty ? (
        <div className="px-5.5 py-5"><EmptySlate message="No activity yet." hint="Check-ins and class bookings appear here." mt="mt-0" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-4">
            {[
              { label: "Check-ins, last 30 days", value: fmtNumber(data.visits_last_30_days) },
              { label: "Check-ins, all time", value: fmtNumber(data.total_visits) },
              { label: "Last check-in", value: data.last_visit_at ? fmtDate(data.last_visit_at) : "-" },
              { label: "Classes booked, last 30 days", value: fmtNumber(data.classes_booked.last_30_days) },
              ...(hasMarks ? [{ label: "Classes attended, last 30 days", value: fmtNumber(data.classes_attended.last_30_days) }] : []),
            ].map((k) => (
              <div key={k.label} className="rounded-(--r-3) p-3.5 px-4" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                <Eyebrow>{k.label}</Eyebrow>
                <div className="text-[20px] font-medium tracking-[-0.02em] mt-1" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
              </div>
            ))}
          </div>
          {data.classes_booked.next_upcoming && (
            <div className="px-5.5 pb-3 text-[13px]" style={{ color: "var(--fg-2)" }}>
              Next class booked: {data.classes_booked.next_upcoming.name ?? "Class"}, {fmtDateTime(data.classes_booked.next_upcoming.at)}
            </div>
          )}
          {data.latest.length > 0 && (
            <ul>
              {data.latest.map((v) => (
                <li
                  key={`${v.kind}-${v._id}`}
                  className="flex items-center justify-between gap-3 px-5.5 py-3 text-[13px]"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="font-mono text-[10.5px] uppercase tracking-[0.04em] shrink-0 rounded-(--r-1) px-1.5 py-0.5"
                      style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
                    >
                      {v.kind === "check_in" ? "Check-in" : "Class booked"}
                    </span>
                    {v.label && <span className="truncate" style={{ color: "var(--fg-3)" }}>{v.label}</span>}
                    {v.kind === "class_booked" && v.attendance && (
                      <span className="shrink-0 text-[12px]" style={{ color: "var(--fg-2)" }}>
                        {v.attendance === "attended" ? "Marked attended" : "Marked no-show"}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[12px] shrink-0" style={{ color: "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>{fmtDateTime(v.at)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5.5 py-3 text-[12.5px]" style={{ borderTop: "1px solid var(--border)", color: "var(--fg-3)" }}>
            A booked class shows the member reserved a place, not that they came; only classes staff marked are counted as attended.
            Waitlisted and cancelled bookings are not counted.
            {data.latest.length >= 20 && (
              <> Showing the latest {fmtNumber(data.latest.length)} items.</>
            )}
          </div>
        </>
      )}
    </DSCard>
  );
}
