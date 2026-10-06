"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import {
  ActivityHeatmap,
  DSCard,
  DSStatCard,
  Eyebrow,
  HeroStatCard,
  ListRow,
  PageHeader,
  WeekStrip,
} from "@/components/ds";
import { checkinsService } from "@/lib/api/checkins";
import { useLoyaltyBalance } from "@/lib/queries/loyalty";
import { heatmapCells, weekStrip } from "@/lib/ui/activity";
import { useClientNow } from "@/lib/ui/useClientNow";
import { formatDate } from "@/utils/format";
import type { MyCheckInDashboardStats, CheckIn } from "@/lib/types";
import { SESSION_MILESTONES, STREAK_MILESTONES, nextStreakMilestone } from "../_lib/logStats";

/**
 * Fields API #191 adds to GET /checkins/dashboard-stats. Optional until it
 * is deployed everywhere: without them there is no "longest" line and no
 * at-risk hint, and milestones fall back to the current streak.
 */
export type StreakStats = MyCheckInDashboardStats & {
  longest_streak_days?: number;
  streak_at_risk?: boolean;
};

const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

/** The line under the hero number. Every clause comes from a real field. */
function heroSub(stats: StreakStats, streak: number): string | undefined {
  const parts: string[] = [];
  const longest = stats.longest_streak_days;
  if (typeof longest === "number" && longest > 0) {
    parts.push(streak > 0 && streak >= longest ? "Your longest streak yet" : `Longest · ${days(longest)}`);
  }
  if (stats.streak_at_risk === true) parts.push("Check in today to keep it going");
  else if (stats.has_checked_in_today) parts.push("Checked in today");
  return parts.length ? parts.join(" · ") : undefined;
}

export function StreaksClient() {
  const { data: stats = null, isLoading } = useQuery<StreakStats | null>({
    queryKey: ["checkins", "myDashboardStats"],
    queryFn: async () => {
      const res = await checkinsService.getMyDashboardStats();
      return res.success && res.data ? res.data : null;
    },
  });
  const { data: history = [], isLoading: historyLoading } = useQuery<CheckIn[]>({
    queryKey: ["checkins", "myHistory"],
    queryFn: async () => {
      const res = await checkinsService.getMyHistory();
      return res.success && res.data ? res.data : [];
    },
  });
  const { data: loyalty } = useLoyaltyBalance();

  const streak = stats?.current_streak_days ?? 0;
  const total = stats?.total_check_ins ?? 0;
  const longest = typeof stats?.longest_streak_days === "number" ? stats.longest_streak_days : null;
  const points = loyalty?.balance ?? null;
  const next = streak > 0 ? nextStreakMilestone(streak) : null;

  // The week strip and heatmap need the viewer's day (null until mount).
  const now = useClientNow();
  const dates = useMemo(() => history.map((c) => c.checked_in_at), [history]);
  const week = useMemo(() => (now ? weekStrip(dates, now) : null), [dates, now]);
  const heat = useMemo(() => (now ? heatmapCells(dates, 30, now) : null), [dates, now]);

  // Badges are earned by the best run there has been, so a broken streak
  // doesn't take back a milestone. Without the API's longest streak, the
  // current one is all we know.
  const best = Math.max(longest ?? 0, streak);
  const milestones = [
    ...STREAK_MILESTONES.map((d) => ({ name: d === 1 ? "First step" : `${d}-day streak`, sub: `Day ${d}`, earned: best >= d })),
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
        {isLoading ? (
          skeleton(150)
        ) : (
          <HeroStatCard
            eyebrow="Current streak"
            value={streak}
            unit={streak === 1 ? "day" : "days"}
            sub={stats ? heroSub(stats, streak) : "Couldn't load your streak"}
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
        )}

        <DSCard className="p-4.5">
          <Eyebrow className="mb-3">This week</Eyebrow>
          {week && !historyLoading ? (
            <WeekStrip
              days={week}
              label="Check-ins this week"
              stateLabels={{ done: "checked in", missed: "no check-in" }}
            />
          ) : (
            skeleton(56)
          )}
        </DSCard>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <DSStatCard
            size="sm"
            label="Total check-ins"
            value={isLoading ? "…" : total}
            delta={stats?.last_check_in_at ? `Last ${formatDate(stats.last_check_in_at)}` : undefined}
          />
          {longest !== null && (
            <DSStatCard size="sm" label="Longest streak" value={longest} unit={longest === 1 ? "day" : "days"} />
          )}
          {points != null && (
            <DSStatCard size="sm" label="Loyalty points" value={points.toLocaleString()} delta="Redeemable at your gym" />
          )}
        </div>

        <DSCard className="p-4.5">
          <Eyebrow className="mb-3">Last 30 days</Eyebrow>
          {heat && !historyLoading ? (
            <ActivityHeatmap cells={heat} noun="check-ins" nounOne="check-in" columns={10} />
          ) : (
            skeleton(120)
          )}
        </DSCard>

        <DSCard className="p-5.5">
          <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Milestones</h2>
          <p className="text-[12.5px] mt-1 mb-4" style={{ color: "var(--fg-3)" }}>
            {longest !== null
              ? "Earned by your longest streak and total check-ins."
              : "Earned by your current streak and total check-ins."}
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {[...earned, ...locked].map((m) => (
              <li key={m.name} className="flex items-center gap-2.5 p-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", opacity: m.earned ? 1 : 0.45 }}>
                <span aria-hidden="true" className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: m.earned ? "var(--signal-soft)" : "var(--bg-2)", color: m.earned ? "var(--signal-ink)" : "var(--fg-3)" }}>
                  {m.earned ? "✓" : "·"}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium leading-tight" style={{ color: "var(--ink)" }}>
                    {m.name}
                    <span className="sr-only">{m.earned ? ", earned" : ", not yet earned"}</span>
                  </div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{m.sub}</div>
                </div>
              </li>
            ))}
          </ul>
        </DSCard>

        <section aria-labelledby="recent-checkins">
          <Eyebrow id="recent-checkins" as="h2" className="mb-2.5 px-1">
            Recent check-ins
          </Eyebrow>
          {historyLoading ? (
            skeleton(56)
          ) : history.length === 0 ? (
            <p className="rounded-[var(--r-3)] px-5.5 py-8 text-center text-[13.5px]" style={{ color: "var(--fg-3)", background: "var(--bg)", border: "1px solid var(--border)" }}>
              No check-ins yet, scan the QR at your gym to start your streak.
            </p>
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
      </div>
    </MemberDashboardShell>
  );
}
