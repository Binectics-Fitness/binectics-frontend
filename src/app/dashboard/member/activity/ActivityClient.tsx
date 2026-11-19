"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import {
  ActivityHeatmap,
  DSCard,
  DSStatCard,
  EmptySlate,
  Eyebrow,
  ListRow,
  PageHeader,
  WeekStrip,
} from "@/components/ds";
import { checkinsService } from "@/lib/api/checkins";
import { loyaltyService } from "@/lib/api/loyalty";
import { memberGoalsService } from "@/lib/api/memberGoals";
import { heatmapCells, weekStrip } from "@/lib/ui/activity";
import { useClientNow } from "@/lib/ui/useClientNow";
import { formatDate } from "@/utils/format";
import type { MyCheckInDashboardStats, CheckIn, LoyaltyProgram } from "@/lib/types";
import {
  countVisitsInDays,
  countVisitsThisWeek,
  toWeekStart,
  visitsRow,
  weekStartsOn,
  type WeekStart,
} from "@/lib/checkins/visits";
import {
  ACTIVITY_SUBTITLE,
  ACTIVITY_TITLE,
  CHECK_INS_30D,
  HISTORY_LOAD_ERROR,
  LAST_30_DAYS,
  NO_CHECK_INS,
  NO_CHECK_INS_HINT,
  RECENT_CHECK_INS,
  STATS_LOAD_ERROR,
  THIS_WEEK,
  allTime,
} from "@/lib/checkins/visitsCopy";
import { VisitsRow } from "../_components/VisitsRow";

function LoadError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-[var(--r-3)] px-4 py-3.5 text-[13px]"
      style={{ background: "var(--danger-soft)", border: "1px solid var(--border)", color: "var(--danger-ink)" }}
    >
      {message}
    </p>
  );
}

/**
 * The member's Activity page (board web-visits A1/A2). It was the Streaks
 * page; owner 19 Nov 2026: no platform streaks anywhere. Visit counts only:
 * this week (the visits row and strip), the last 30 days and all time.
 * Nothing resets, nothing counts days in a row, no badges. A provider's own
 * loyalty points stay: providers opt in, it is not a platform streak.
 */
export function ActivityClient() {
  // apiClient reports failures as success:false rather than throwing, so
  // each query throws on it: a failed load is an error, never zeros or
  // "no check-in" days. The keys differ from the shared hooks in
  // src/lib/queries (which turn a failure into null / []) so the two
  // shapes never share a cache entry; the "checkins" prefix keeps them in
  // any invalidation of that group.
  const statsQuery = useQuery<MyCheckInDashboardStats>({
    queryKey: ["checkins", "myDashboardStats", "strict"],
    queryFn: async () => {
      const res = await checkinsService.getMyDashboardStats();
      if (!res.success || !res.data) throw new Error(res.message || "Couldn't load your visits.");
      return res.data;
    },
    retry: 1,
  });
  const historyQuery = useQuery<CheckIn[]>({
    queryKey: ["checkins", "myHistory", "strict"],
    queryFn: async () => {
      const res = await checkinsService.getMyHistory();
      if (!res.success) throw new Error(res.message || "Couldn't load your check-ins.");
      return res.data ?? [];
    },
    retry: 1,
  });
  // The member's week (Goals setting). Unread or unset is Monday.
  const goalsQuery = useQuery<WeekStart>({
    queryKey: ["memberGoals", "settings", "weekStart"],
    queryFn: async () => {
      const res = await memberGoalsService.getSettings();
      return toWeekStart(res.success ? res.data?.week_start : undefined);
    },
    retry: 1,
  });
  // Loyalty is each provider's own opt-in program: the card shows only when
  // at least one of the member's providers runs one (and hides on a failed
  // read rather than showing 0 points).
  const loyaltyQuery = useQuery<LoyaltyProgram[]>({
    queryKey: ["loyalty", "programs", "strict"],
    queryFn: async () => {
      const res = await loyaltyService.getPrograms();
      if (!res.success || !res.data) throw new Error(res.message || "Couldn't load your points.");
      return res.data;
    },
    retry: 1,
  });

  const stats = statsQuery.data ?? null;
  const history = historyQuery.data ?? null;
  const weekStart = goalsQuery.data ?? "monday";
  // One tile per provider: points at one provider never spend at another,
  // so a sum across them would describe a balance nobody can use.
  const programs = loyaltyQuery.data ?? [];

  // The week strip, heatmap and counts need the viewer's day (null until mount).
  const now = useClientNow();
  const dates = useMemo(() => (history ?? []).map((c) => c.checked_in_at), [history]);
  const week = useMemo(
    () => (now && history ? weekStrip(dates, now, weekStartsOn(weekStart)) : null),
    [dates, history, now, weekStart],
  );
  const heat = useMemo(() => (now && history ? heatmapCells(dates, 30, now) : null), [dates, history, now]);
  const weekCount = now && history ? countVisitsThisWeek(dates, now, weekStart) : null;
  const last30 = now && history ? countVisitsInDays(dates, now, 30) : null;
  const visits = stats && (stats.total_check_ins > 0 || stats.has_checked_in_today) ? visitsRow({ stats, weekCount }) : null;

  const skeleton = (h: number) => (
    <div aria-hidden="true" className="rounded-[var(--r-3)]" style={{ height: h, background: "var(--bg-2)" }} />
  );

  return (
    <MemberDashboardShell activeLabel="Activity">
      <PageHeader title={ACTIVITY_TITLE} subtitle={ACTIVITY_SUBTITLE} />

      <div className="flex flex-col gap-3.5">
        {statsQuery.isPending ? (
          skeleton(62)
        ) : statsQuery.isError ? (
          <LoadError message={STATS_LOAD_ERROR} />
        ) : visits ? (
          // No link: this is the page the row opens from home.
          <VisitsRow row={visits} />
        ) : null}

        {historyQuery.isError ? (
          <LoadError message={HISTORY_LOAD_ERROR} />
        ) : (
          <DSCard className="p-4.5">
            <Eyebrow className="mb-3">{THIS_WEEK}</Eyebrow>
            {week ? (
              <WeekStrip
                days={week}
                label="Check-ins this week"
                stateLabels={{ done: "checked in", missed: "no check-in" }}
              />
            ) : (
              skeleton(56)
            )}
          </DSCard>
        )}

        {((stats && last30 !== null) || programs.length > 0) && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {stats && last30 !== null && (
              <DSStatCard size="sm" label={CHECK_INS_30D} value={last30} delta={allTime(stats.total_check_ins)} />
            )}
            {programs.map((p) => (
              <DSStatCard
                key={p.organization_id}
                size="sm"
                label="Loyalty points"
                value={p.balance.toLocaleString()}
                delta={`With ${p.organization_name || "your provider"}`}
              />
            ))}
          </div>
        )}

        {!historyQuery.isError && (
          <DSCard className="p-4.5">
            <Eyebrow className="mb-3">{LAST_30_DAYS}</Eyebrow>
            {heat ? (
              <ActivityHeatmap cells={heat} noun="check-ins" nounOne="check-in" columns={10} />
            ) : (
              skeleton(120)
            )}
          </DSCard>
        )}

        {!historyQuery.isError && (
          <section aria-labelledby="recent-checkins">
            <Eyebrow id="recent-checkins" as="h2" className="mb-2.5 px-1">
              {RECENT_CHECK_INS}
            </Eyebrow>
            {!history ? (
              skeleton(56)
            ) : history.length === 0 ? (
              <DSCard className="px-5.5 py-6">
                <EmptySlate message={NO_CHECK_INS} hint={NO_CHECK_INS_HINT} mt="mt-0" />
              </DSCard>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {history.slice(0, 10).map((c) => {
                  const listing = c.listing_id && typeof c.listing_id === "object" ? c.listing_id : null;
                  return (
                    <li key={c._id}>
                      <ListRow
                        title={listing?.headline ?? "Check-in"}
                        meta={`${formatDate(c.checked_in_at)} · ${new Date(c.checked_in_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`}
                        href={listing ? `/marketplace/${listing._id}` : undefined}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>
    </MemberDashboardShell>
  );
}
