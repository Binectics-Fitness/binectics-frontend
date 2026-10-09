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
  HeroStatCard,
  ListRow,
  PageHeader,
  WeekStrip,
} from "@/components/ds";
import { checkinsService } from "@/lib/api/checkins";
import { loyaltyService } from "@/lib/api/loyalty";
import { heatmapCells, weekStrip } from "@/lib/ui/activity";
import { useClientNow } from "@/lib/ui/useClientNow";
import { formatDate } from "@/utils/format";
import type { MyCheckInDashboardStats, CheckIn } from "@/lib/types";
import { SESSION_MILESTONES, STREAK_MILESTONES, nextStreakMilestone } from "../_lib/logStats";

/**
 * Fields API #191 adds to GET /checkins/dashboard-stats. Optional until it
 * is deployed everywhere: without them there is no "longest" line, no
 * milestone progress and no at-risk hint, and milestones fall back to the
 * current streak.
 *
 * TEMPORARY: web #199 adds these same fields to the shared
 * MyCheckInDashboardStats in src/lib/types. Delete this local copy and use
 * the shared type once #199 merges.
 */
export type DashboardStatsWithStreakFields199 = MyCheckInDashboardStats & {
  longest_streak_days?: number;
  streak_at_risk?: boolean;
};

const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

/** The line under the hero number. Every clause comes from a real field. */
function heroSub(stats: DashboardStatsWithStreakFields199, streak: number): string | undefined {
  const parts: string[] = [];
  const longest = stats.longest_streak_days;
  if (typeof longest === "number" && longest > 0) {
    parts.push(streak > 0 && streak >= longest ? "Your longest streak yet" : `Longest · ${days(longest)}`);
  }
  // "At risk" only means something while there is a streak to lose.
  if (stats.streak_at_risk === true && streak > 0) parts.push("Check in today to keep it going");
  else if (stats.has_checked_in_today) parts.push("Checked in today");
  return parts.length ? parts.join(" · ") : undefined;
}

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

export function StreaksClient() {
  // apiClient reports failures as success:false rather than throwing, so
  // each query throws on it: a failed load is an error, never zeros or
  // "no check-in" days. The keys differ from the shared hooks in
  // src/lib/queries (which turn a failure into null / []) so the two
  // shapes never share a cache entry; the "checkins" prefix keeps them in
  // any invalidation of that group.
  const statsQuery = useQuery<DashboardStatsWithStreakFields199>({
    queryKey: ["checkins", "myDashboardStats", "strict"],
    queryFn: async () => {
      const res = await checkinsService.getMyDashboardStats();
      if (!res.success || !res.data) throw new Error(res.message || "Couldn't load your streak.");
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
  // The shared useLoyaltyBalance turns a failure into { balance: 0 }; read it
  // here so a failure hides the card instead of showing 0 points.
  const loyaltyQuery = useQuery<number>({
    queryKey: ["loyalty", "balance", "strict"],
    queryFn: async () => {
      const res = await loyaltyService.getBalance();
      if (!res.success || !res.data) throw new Error(res.message || "Couldn't load your points.");
      return res.data.balance;
    },
    retry: 1,
  });

  const stats = statsQuery.data ?? null;
  const history = historyQuery.data ?? null;
  const streak = stats?.current_streak_days ?? 0;
  const total = stats?.total_check_ins ?? 0;
  const longest = typeof stats?.longest_streak_days === "number" ? stats.longest_streak_days : null;
  const points = loyaltyQuery.data ?? null;
  // Milestone progress is shown only with the API's longest streak (owner
  // ruling: no "N days to milestone" until the API has it).
  const next = longest !== null && streak > 0 ? nextStreakMilestone(streak) : null;

  // The week strip and heatmap need the viewer's day (null until mount).
  const now = useClientNow();
  const dates = useMemo(() => (history ?? []).map((c) => c.checked_in_at), [history]);
  const week = useMemo(() => (now && history ? weekStrip(dates, now) : null), [dates, history, now]);
  const heat = useMemo(() => (now && history ? heatmapCells(dates, 30, now) : null), [dates, history, now]);

  // Badges are earned by the best run there has been, so a broken streak
  // doesn't take back a milestone. Without the API's longest streak, the
  // current one is all we know. "First step" is the first check-in ever,
  // so it can't read as locked next to "10 sessions" earned.
  const best = Math.max(longest ?? 0, streak);
  const milestones = [
    { name: "First step", sub: "Day 1", earned: total >= 1 },
    ...STREAK_MILESTONES.map((d) => ({
      name: `${d}-day streak`,
      sub: `Day ${d}`,
      earned: best >= d,
    })),
    ...SESSION_MILESTONES.map((n) => ({ name: `${n} sessions`, sub: "check-ins", earned: total >= n })),
  ];
  const earned = milestones.filter((m) => m.earned);
  const locked = milestones.filter((m) => !m.earned);

  const skeleton = (h: number) => (
    <div aria-hidden="true" className="rounded-[var(--r-3)]" style={{ height: h, background: "var(--bg-2)" }} />
  );

  return (
    <MemberDashboardShell activeLabel="Activity">
      <PageHeader
        title={{ before: "Your ", emphasis: "streak" }}
        subtitle="Gym check-ins, milestones and lifetime stats."
      />

      <div className="flex flex-col gap-3.5">
        {statsQuery.isPending ? (
          skeleton(150)
        ) : stats ? (
          <HeroStatCard
            eyebrow="Current streak"
            value={streak}
            unit={streak === 1 ? "day" : "days"}
            sub={heroSub(stats, streak)}
            progress={
              next
                ? {
                    value: streak,
                    max: next,
                    label: `Progress to the ${next}-day milestone`,
                    valueText: `${streak} of ${next} days`,
                  }
                : undefined
            }
            footnote={next ? `${days(next - streak)} to the ${next}-day milestone` : undefined}
          />
        ) : (
          <LoadError message="We couldn't load your streak. Please refresh to try again." />
        )}

        {historyQuery.isError ? (
          <LoadError message="We couldn't load your check-ins. Please refresh to try again." />
        ) : (
          <DSCard className="p-4.5">
            <Eyebrow className="mb-3">This week</Eyebrow>
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

        {(stats || points != null) && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {stats && (
              <DSStatCard
                size="sm"
                label="Total check-ins"
                value={total}
                delta={stats.last_check_in_at ? `Last ${formatDate(stats.last_check_in_at)}` : undefined}
              />
            )}
            {longest !== null && (
              <DSStatCard size="sm" label="Longest streak" value={longest} unit={longest === 1 ? "day" : "days"} />
            )}
            {points != null && (
              <DSStatCard size="sm" label="Loyalty points" value={points.toLocaleString()} delta="Redeemable at your gym" />
            )}
          </div>
        )}

        {!historyQuery.isError && (
          <DSCard className="p-4.5">
            <Eyebrow className="mb-3">Last 30 days</Eyebrow>
            {heat ? (
              <ActivityHeatmap cells={heat} noun="check-ins" nounOne="check-in" columns={10} />
            ) : (
              skeleton(120)
            )}
          </DSCard>
        )}

        {stats && (
          <DSCard className="p-5.5">
            <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Milestones</h2>
            <p className="text-[12.5px] mt-1 mb-4" style={{ color: "var(--fg-3)" }}>
              {longest !== null
                ? "Earned by your longest streak and total check-ins."
                : "Earned by your current streak and total check-ins."}
            </p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {[...earned, ...locked].map((m) => (
                <li
                  key={m.name}
                  data-earned={m.earned}
                  className="flex items-center gap-2.5 p-3 rounded-(--r-2)"
                  // Locked reads as quieter through colour and a dashed edge,
                  // not opacity, so its text keeps 4.5:1.
                  style={{ border: m.earned ? "1px solid var(--border)" : "1px dashed var(--border-2)" }}
                >
                  <span aria-hidden="true" className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: m.earned ? "var(--signal-soft)" : "var(--bg-2)", color: m.earned ? "var(--signal-ink)" : "var(--fg-3)" }}>
                    {m.earned ? "✓" : "·"}
                  </span>
                  <div className="min-w-0">
                    <div data-milestone-name className="text-[13px] font-medium leading-tight" style={{ color: m.earned ? "var(--ink)" : "var(--fg-3)" }}>
                      {m.name}
                      <span className="sr-only">{m.earned ? ", earned" : ", not yet earned"}</span>
                    </div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{m.sub}</div>
                  </div>
                </li>
              ))}
            </ul>
          </DSCard>
        )}

        {!historyQuery.isError && (
          <section aria-labelledby="recent-checkins">
            <Eyebrow id="recent-checkins" as="h2" className="mb-2.5 px-1">
              Recent check-ins
            </Eyebrow>
            {!history ? (
              skeleton(56)
            ) : history.length === 0 ? (
              <DSCard className="px-5.5 py-6">
                <EmptySlate
                  message="No check-ins yet."
                  hint="Scan the QR at your gym to start your streak."
                  mt="mt-0"
                />
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
