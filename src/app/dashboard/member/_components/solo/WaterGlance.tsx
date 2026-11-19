"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChipGroup, DSCard } from "@/components/ds";
import { useOnline, OFFLINE_WRITE_MESSAGE } from "@/hooks/useOnline";
import { useSeries } from "@/lib/queries/glance";
import { useWaterCounter } from "@/lib/queries/solo";
import {
  STATE_COPY,
  WATER_GLANCE_COPY,
  type WaterSpan,
  waterAvgRailLabel,
  waterFootnote,
  waterRailLabel,
  waterTodaySentence,
  waterUsualNote,
  waterUsualSentence,
} from "@/lib/solo/glanceCopy";
import { dayKeyOf, railPosition, waterStats, windowOf } from "@/lib/solo/glance";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { deviceTimeZone } from "@/lib/solo/time";
import { CardSkeleton, Rail, WriteError } from "./parts";

/**
 * Water, "sentence and rail": one sentence for today (and the aim, if the
 * member set one), a rail that is only a picture of it, + 1 glass and Undo,
 * and a "usual day" line from the days that have a count. A day with no water
 * counted is a gap, never a zero.
 */
export function WaterGlance() {
  const online = useOnline();
  const tz = deviceTimeZone();
  const today = dayKeyOf(new Date());
  const win = windowOf(today, 28);
  const [span, setSpan] = useState<WaterSpan>("week");
  const [blocked, setBlocked] = useState<string | null>(null);

  const counter = useWaterCounter(true);
  const series = useSeries({ metric: "water_glasses", from: win.from, to: today, tz, bucket: "day", enabled: true });
  const todayData = counter.query.data;
  const count = todayData?.glasses ?? 0;
  const aim = todayData?.target_glasses ?? null;
  const stats = useMemo(
    () => waterStats(series.data?.points ?? [], today, span, todayData ? todayData.glasses : null),
    [series.data, today, span, todayData],
  );

  const tap = (delta: 1 | -1) => {
    if (!online) {
      setBlocked(OFFLINE_WRITE_MESSAGE);
      return;
    }
    setBlocked(null);
    counter.tap(delta);
  };

  return (
    <DSCard className="p-5.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          Water · today
        </h2>
        <Link href={SOLO_HREFS.water} className="text-[14px] underline underline-offset-2" style={{ color: "var(--fg-2)", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          {WATER_GLANCE_COPY.waterLink}
        </Link>
      </div>

      {counter.query.isLoading ? (
        <div className="mt-4" role="status" aria-label="Loading your water">
          <CardSkeleton height={120} />
        </div>
      ) : counter.query.isError && !todayData ? (
        <div className="mt-4">
          <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
            {online ? STATE_COPY.errorTitle : STATE_COPY.offlineNoSaved}
          </p>
          <button type="button" className="btn-ghost-v2 mt-3" style={{ height: 44 }} onClick={() => void counter.query.refetch()}>
            {STATE_COPY.retry}
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-[22px] font-medium" style={{ color: "var(--ink)" }} data-testid="water-sentence" role="status">
            {waterTodaySentence(count, aim)}
          </p>
          {aim !== null && (
            <div className="mt-3">
              <Rail fill={railPosition(count, aim)} aimAt={null} label={waterRailLabel(count, aim)} />
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary-v2" style={{ height: 44 }} onClick={() => tap(1)} aria-label={WATER_GLANCE_COPY.addLabel}>
              {WATER_GLANCE_COPY.add}
            </button>
            <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={() => tap(-1)} disabled={count === 0} aria-label={WATER_GLANCE_COPY.undoLabel}>
              {WATER_GLANCE_COPY.undo}
            </button>
          </div>
          {blocked && (
            <div className="mt-3">
              <WriteError message={blocked} onDismiss={() => setBlocked(null)} />
            </div>
          )}
          {counter.failed && (
            <div className="mt-3">
              <WriteError message={counter.failedMessage ?? "We could not save that glass."} onRetry={counter.retry} onDismiss={counter.dismiss} />
            </div>
          )}

          <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                {WATER_GLANCE_COPY.usualEyebrow}
              </h3>
              <ChipGroup
                label="Usual day period"
                options={(["week", "weeks4"] as WaterSpan[]).map((s) => ({
                  value: s,
                  label: s === "week" ? WATER_GLANCE_COPY.chipWeek : WATER_GLANCE_COPY.chip4Weeks,
                }))}
                value={span}
                onChange={setSpan}
              />
            </div>
            {series.isLoading ? (
              <div className="mt-2">
                <CardSkeleton height={60} />
              </div>
            ) : series.isError && !series.data ? (
              <button type="button" className="btn-ghost-v2 mt-2" style={{ height: 44 }} onClick={() => void series.refetch()}>
                {STATE_COPY.retry}
              </button>
            ) : stats.average === null ? (
              <p className="mt-2 text-[14px]" style={{ color: "var(--fg-3)" }}>
                {WATER_GLANCE_COPY.noUsual}
              </p>
            ) : (
              <div className="mt-2" data-testid="water-usual">
                <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                  {waterUsualSentence(stats.average, span)}
                </p>
                {aim !== null && (
                  <div className="mt-2">
                    <Rail fill={railPosition(stats.average, aim)} aimAt={null} label={waterAvgRailLabel(stats.average, aim)} />
                  </div>
                )}
                <p className="mt-1 text-[13px]" style={{ color: "var(--fg-3)" }}>
                  {waterUsualNote({ avg: stats.average, prev: stats.previous, days: stats.days, span })}
                </p>
              </div>
            )}
          </div>
          {todayData && (
            <p className="mt-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
              {waterFootnote(todayData.glass_ml)}
            </p>
          )}
        </div>
      )}
    </DSCard>
  );
}
