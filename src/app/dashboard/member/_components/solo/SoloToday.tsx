"use client";

import Link from "next/link";
import { useMemo } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { DSCard, PageHeader } from "@/components/ds";
import { useAuth } from "@/contexts/AuthContext";
import { useOnline } from "@/hooks/useOnline";
import { useSoloFlags } from "@/hooks/useSoloFlags";
import { useChecklistToday, useLatestWeight, useWaterToday } from "@/lib/queries/solo";
import { useCurrentFast } from "@/lib/queries/fasting";
import { useActiveStarter } from "@/lib/queries/starter";
import { isStarterProgramEnabled } from "@/lib/starter/flag";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { useClientNow } from "@/lib/ui/useClientNow";
import { ChecklistCard } from "./ChecklistCard";
import { FastTodayCard } from "./FastTodayCard";
import { CardSkeleton } from "./parts";
import { RemindersCard } from "./RemindersCard";
import { StarterCard } from "./StarterCard";
import { WaterCard } from "./WaterCard";
import { WeightCard } from "./WeightCard";
import styles from "./solo.module.css";

/** Where the quiet "Find a gym or coach" row goes. */
const EXPLORE = SOLO_HREFS.explore;

/** The page while the first reads are still running: shapes only, nothing invented. */
export function SoloTodayLoading() {
  return (
    <MemberDashboardShell activeLabel="Home">
      <div role="status" aria-label="Loading Today" className="flex flex-col gap-3.5">
        <div aria-hidden="true" className={styles.skeleton} style={{ height: 64, width: "50%" }} />
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <CardSkeleton height={150} />
          <CardSkeleton height={150} />
        </div>
        <CardSkeleton height={220} />
      </div>
    </MemberDashboardShell>
  );
}

function StartCard({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <DSCard className="flex flex-col gap-1.5 p-5.5">
      <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
        {title}
      </h2>
      <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>
        {text}
      </p>
      <Link href={href} className="btn-ghost-v2 mt-2 self-start" style={{ height: 44 }}>
        {action}
      </Link>
    </DSCard>
  );
}

/**
 * Today for a member on their own (no provider, no gym). Cards render only
 * when their server flag is on AND the data they need exists; nothing is
 * invented, and there are no streaks, scores or "missed" days.
 */
export function SoloToday() {
  const { user } = useAuth();
  const flags = useSoloFlags();
  const online = useOnline();
  const now = useClientNow();
  const starterOn = isStarterProgramEnabled();

  const water = useWaterToday(flags.water);
  const checklist = useChecklistToday(flags.checklist);
  const fasting = useCurrentFast(flags.fasting);
  const weight = useLatestWeight(true);
  const starter = useActiveStarter(starterOn);

  const asked = [
    flags.water ? water : null,
    flags.checklist ? checklist : null,
    flags.fasting ? fasting : null,
    weight,
    starterOn ? starter : null,
  ].filter((q): q is NonNullable<typeof q> => q !== null);

  const loading = flags.isLoading || asked.some((q) => q.isLoading);
  const allFailed = asked.length > 0 && asked.every((q) => q.isError);

  const hasWater = flags.water && (water.data?.glasses ?? 0) > 0;
  const hasList = flags.checklist && (checklist.data?.items.length ?? 0) > 0;
  const hasFast = flags.fasting && !!fasting.data;
  const hasWeight = !!weight.data;
  const hasStarter = starterOn && !!starter.data?.program;
  const firstDay = !hasWater && !hasList && !hasWeight && !hasStarter && !hasFast;

  const updatedAt = Math.max(0, ...asked.map((q) => q.dataUpdatedAt));
  const updatedLabel = useMemo(
    () => (updatedAt ? new Date(updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : null),
    [updatedAt],
  );

  const firstName = user?.first_name?.trim() || "there";
  const dateLine = now ? now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) : null;

  if (loading) return <SoloTodayLoading />;

  return (
    <MemberDashboardShell activeLabel="Home">
      <PageHeader
        eyebrow={dateLine ?? <span aria-hidden="true">&nbsp;</span>}
        title={{ before: "Hey, ", emphasis: firstName, after: "." }}
        subtitle={firstDay && !allFailed ? "Pick one thing to begin with. There is no wrong place to start." : undefined}
      />

      {!online && (
        <div role="status" className="mb-3.5 rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
          You are offline.{updatedLabel ? ` Showing what was loaded at ${updatedLabel}.` : ""} Adding water or ticking a line is paused until you are back online.
        </div>
      )}

      {allFailed ? (
        <DSCard className="p-6">
          <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
            We could not load Today
          </h2>
          <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
            Nothing you logged is lost. Check your connection and try again.
          </p>
          <button
            type="button"
            className="btn-primary-v2 mt-3"
            style={{ height: 44 }}
            onClick={() => asked.forEach((q) => void q.refetch())}
          >
            Try again
          </button>
        </DSCard>
      ) : firstDay ? (
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {flags.fasting && (
              <StartCard title="Start a fast" text="Pick a length, and the time is kept for you. You choose when to stop." href={SOLO_HREFS.fasting} action="Start a fast" />
            )}
            {flags.water && (
              <StartCard title="Count today's water" text="Tap once for each glass. You choose whether to set an aim." href={SOLO_HREFS.water} action="Open water" />
            )}
            <StartCard title="Log your weight" text="Weigh in when you like. Once a week is plenty." href="/dashboard/member/weight-log" action="Log weight" />
            {starterOn && (
              <StartCard title="Start a free program" text="Beginner workouts. Three questions to pick one." href="/dashboard/member/starter" action="Find a program" />
            )}
            {flags.checklist && (
              <StartCard title="Make a daily list" text="A few lines you want to do each day. Tool lines tick themselves." href={SOLO_HREFS.todayList} action="Build your list" />
            )}
          </div>
          <DSCard flat className="p-5">
            <h2 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
              Only you can see what you log
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: "var(--fg-3)" }}>
              You have no gym, coach or dietitian connected, so nothing is shared. You can change this under{" "}
              <Link href="/dashboard/settings/privacy" className="underline underline-offset-2">
                Privacy and sharing
              </Link>
              .
            </p>
          </DSCard>
          <RemindersCard />
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {flags.fasting && <FastTodayCard fast={fasting.data ?? null} />}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {flags.water && <WaterCard variant="compact" />}
            <WeightCard />
          </div>
          <div className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-[1.7fr_1fr]">
            {flags.checklist ? <ChecklistCard /> : <div />}
            <div className="flex min-w-0 flex-col gap-3.5">
              {hasStarter && <StarterCard />}
              <RemindersCard />
            </div>
          </div>
        </div>
      )}

      <p className="mt-5 text-[13px]" style={{ color: "var(--fg-3)" }}>
        Looking for a gym or coach?{" "}
        <Link href={EXPLORE} className="underline underline-offset-2" style={{ color: "var(--fg-2)" }}>
          Find a gym or coach
        </Link>
        . Your history only goes with you if you share it.
      </p>
    </MemberDashboardShell>
  );
}
