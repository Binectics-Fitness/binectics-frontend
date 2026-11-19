"use client";

import Link from "next/link";
import { useState } from "react";
import { ChipGroup, DSCard } from "@/components/ds";
import { useOnline } from "@/hooks/useOnline";
import type { ComparePeriod, WeightCompare } from "@/lib/api/memberSeries";
import type { MemberTargets } from "@/lib/api/memberTargets";
import { useSeries, useWeightCompare } from "@/lib/queries/glance";
import { useSetHideDailyWeights, useSoloSettings } from "@/lib/queries/solo";
import {
  STATE_COPY,
  WEIGHT_COPY,
  WEIGHT_PERIODS,
  type WeightPeriod,
  loadedAtNote,
  weeklyAverageLine,
  weightChangeSentence,
  weightRangeSentence,
  weightSummaryLabel,
  weightValue,
} from "@/lib/solo/glanceCopy";
import { dayKeyOf, latestWeighIns, windowOf } from "@/lib/solo/glance";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { deviceTimeZone } from "@/lib/solo/time";
import { CardSkeleton, Switch, WriteError } from "./parts";
import styles from "./fasting.module.css";

const PERIODS: WeightPeriod[] = ["4w", "3m", "1y"];

/** The time a query's data was loaded, for the "showing what was loaded at" note. */
function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Weight, "then and now": two weekly averages and ONE sentence. No arrow, no
 * colour for better or worse (the change is plain ink: a number and the words
 * lower / higher). Daily weights are hidden behind a tap, and can be hidden for
 * good (kept on the server). A gap is never drawn as zero.
 */
export function WeightGlance({ targets }: { targets: MemberTargets | null }) {
  const online = useOnline();
  const tz = deviceTimeZone();
  const [period, setPeriod] = useState<WeightPeriod>("4w");
  const [showDaily, setShowDaily] = useState(false);
  // "Hide for good" is kept on the server, so it follows the member to the phone.
  // A missing field (an API that predates it) reads as false. An UNKNOWN answer
  // (still loading, or the read failed) is not "not hidden": the daily list is
  // neither offered nor fetched until the server has said, as on the phone.
  const settings = useSoloSettings();
  const setHide = useSetHideDailyWeights();
  const settingsKnown = settings.data !== undefined;
  const hiddenForGood = settings.data?.hide_daily_weights === true;
  const dailyOffered = settingsKnown && !hiddenForGood;

  const compare = useWeightCompare(period as ComparePeriod, tz, true);
  const today = dayKeyOf(new Date());
  const win = windowOf(today, 28);
  const daily = useSeries({
    metric: "weight",
    from: win.from,
    to: today,
    tz,
    bucket: "day",
    // Daily weights are only requested once the member asks to see them.
    enabled: showDaily && dailyOffered,
  });

  const data: WeightCompare | undefined = compare.data;
  const stale = compare.isError && !!data;
  const range = targets?.weight_range ?? null;
  const dailyRows = daily.data ? latestWeighIns(daily.data.points, 5) : [];

  return (
    <DSCard className="p-5.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="weight-glance-title" className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          {WEIGHT_COPY.title} · weekly average
        </h2>
        <ChipGroup
          label={WEIGHT_COPY.rangeGroupLabel}
          options={PERIODS.map((p) => ({ value: p, label: WEIGHT_PERIODS[p].chip }))}
          value={period}
          onChange={setPeriod}
        />
      </div>

      {compare.isLoading ? (
        <div className="mt-4" role="status" aria-label="Loading your weight">
          <CardSkeleton height={120} />
        </div>
      ) : compare.isError && !data ? (
        <div className="mt-4">
          <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
            {online ? STATE_COPY.errorTitle : STATE_COPY.offlineNoSaved}
          </p>
          {online && (
            <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
              {STATE_COPY.errorBody}
            </p>
          )}
          <button type="button" className="btn-ghost-v2 mt-3" style={{ height: 44 }} onClick={() => void compare.refetch()}>
            {STATE_COPY.retry}
          </button>
        </div>
      ) : data && (!data.enough || !data.then || !data.now || data.delta === null) ? (
        <div className="mt-4" data-testid="weight-not-enough">
          <p className="text-[17px] font-medium" style={{ color: "var(--ink)" }}>
            {WEIGHT_COPY.notEnoughTitle}
          </p>
          <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
            {WEIGHT_COPY.notEnoughBody}
          </p>
          <Link href="/dashboard/member/weight-log" className="btn-ghost-v2 mt-3" style={{ height: 44 }}>
            {WEIGHT_COPY.logWeight}
          </Link>
        </div>
      ) : data && data.then && data.now && data.delta !== null ? (
        <div className="mt-4" data-testid="weight-pair">
          {(stale || !online) && (
            <p role="status" className="mb-3 rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
              {loadedAtNote(timeLabel(compare.dataUpdatedAt), !online)}{" "}
              <button type="button" className="underline underline-offset-2" style={{ minHeight: 44 }} onClick={() => void compare.refetch()}>
                {STATE_COPY.retry}
              </button>
            </p>
          )}
          <div className={styles.pair}>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                {WEIGHT_PERIODS[period].label}
              </p>
              <p className={styles.bigNum} data-testid="weight-then">
                {weightValue(data.then.average)}
                <span className={styles.bigUnit}>kg</span>
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                {WEIGHT_COPY.thisWeek}
              </p>
              <p className={styles.bigNum} data-testid="weight-now">
                {weightValue(data.now.average)}
                <span className={styles.bigUnit}>kg</span>
              </p>
            </div>
          </div>
          {/* One plain sentence in ink: no arrow, no good or bad colour. */}
          <p className="mt-3 text-[16px]" style={{ color: "var(--ink)" }} data-testid="weight-sentence">
            {weightChangeSentence(data.delta, period)}
          </p>
          <p className="sr-only">{weightSummaryLabel(data.then.average, data.now.average, data.delta, period)}</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--fg-3)" }}>
            {WEIGHT_COPY.averageNote}
          </p>
          {range && (
            <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }} data-testid="weight-target">
              <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                {WEIGHT_COPY.targetEyebrow}
              </p>
              <p className="mt-1 text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                {weightRangeSentence(range.min_kg, range.max_kg)}
              </p>
              <p className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
                {weeklyAverageLine(data.now.average)}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {targets !== null && !range && (
        <p className="mt-3">
          <Link href={SOLO_HREFS.targets} className="inline-flex items-center text-[14px] underline underline-offset-2" style={{ color: "var(--fg-2)", minHeight: 44 }}>
            {WEIGHT_COPY.setTargetLabel}
          </Link>
        </p>
      )}

      <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[14.5px] font-medium" style={{ color: "var(--ink)" }}>
              {WEIGHT_COPY.dailyTitle}
            </h3>
            <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
              {!settingsKnown ? null : hiddenForGood ? WEIGHT_COPY.dailyHiddenForGood : showDaily ? WEIGHT_COPY.dailyShowing : WEIGHT_COPY.dailyHidden}
            </p>
          </div>
          {dailyOffered && (
            <button type="button" className="btn-ghost-v2" style={{ height: 44 }} aria-expanded={showDaily} onClick={() => setShowDaily((v) => !v)}>
              {showDaily ? WEIGHT_COPY.hide : WEIGHT_COPY.show}
            </button>
          )}
        </div>
        {showDaily && dailyOffered && (
          <div className="mt-2" data-testid="weight-daily">
            {daily.isLoading ? (
              <CardSkeleton height={80} />
            ) : daily.isError ? (
              <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={() => void daily.refetch()}>
                {STATE_COPY.retry}
              </button>
            ) : dailyRows.length === 0 ? (
              <p className="text-[14px]" style={{ color: "var(--fg-3)" }}>
                {WEIGHT_COPY.dailyNone}
              </p>
            ) : (
              <ul>
                {dailyRows.map((r) => (
                  <li key={r.day} className={styles.dayRow} style={{ listStyle: "none" }}>
                    <span>{r.label}</span>
                    <span className="font-mono">{weightValue(r.kg)} kg</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[14.5px]" style={{ color: "var(--ink)" }} id="hide-weights-label">
              {WEIGHT_COPY.hideForGood}
            </p>
            <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
              {WEIGHT_COPY.hideForGoodNote}
            </p>
          </div>
          <Switch
            on={hiddenForGood}
            label={WEIGHT_COPY.hideSwitchLabel}
            onChange={(next) => {
              setHide.mutate(next);
              if (next) setShowDaily(false);
            }}
          />
        </div>
        {setHide.isError && (
          <div className="mt-2">
            <WriteError message={WEIGHT_COPY.hideSaveFailed} onDismiss={() => setHide.reset()} />
          </div>
        )}
      </div>
    </DSCard>
  );
}
