"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DSCard } from "@/components/ds";
import { useOnline } from "@/hooks/useOnline";
import type { FastingWindow } from "@/lib/api/memberTargets";
import { useSeries } from "@/lib/queries/glance";
import {
  FASTING_GLANCE_COPY,
  STATE_COPY,
  type FastingSpan,
  fastingAverageEyebrow,
  fastingAverageSentence,
  fastingDayLabel,
  fastingDayNote,
  hoursMinutes,
  loadedAtNote,
  windowCaption,
} from "@/lib/solo/glanceCopy";
import { barPercent, bandGeometry, dayKeyOf, fastAverage, fastDays, windowOf, type FastDay } from "@/lib/solo/glance";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { deviceTimeZone } from "@/lib/solo/time";
import { CardSkeleton, Switch } from "./parts";
import styles from "./fasting.module.css";

/** The scale every bar shares: the 24 hour cap. */
const SCALE_HOURS = 24;

/**
 * Fasting, a "strip on a band": one column per day (hours from fasts that
 * ENDED that day), on a shared 0 to 24 h scale. A day with no fast is a GAP
 * (nothing drawn, never a zero, never "missed"). The pale band is the member's
 * own window, shown only if they set one and switch it on. Seven days are
 * seven real buttons; thirty days are a strip with a real range slider.
 */
export function FastingGlance({ window: ownWindow }: { window: FastingWindow | null }) {
  const online = useOnline();
  const tz = deviceTimeZone();
  const today = dayKeyOf(new Date());
  const win = windowOf(today, 30);
  const [span, setSpan] = useState<FastingSpan>(7);
  const [showBand, setShowBand] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);

  const series = useSeries({ metric: "fasting_hours", from: win.from, to: win.to, tz, bucket: "day", enabled: true });
  const cells = useMemo(() => fastDays(series.data?.points ?? [], today, span), [series.data, today, span]);
  const { average, days } = fastAverage(cells);
  const band = ownWindow && showBand ? { min: ownWindow.min_hours, max: ownWindow.max_hours } : null;

  const selected: FastDay = cells.find((c) => c.day === picked) ?? cells[cells.length - 1];
  const stale = series.isError && !!series.data;
  const empty = !!series.data && series.data.points.length === 0;

  return (
    <DSCard className="p-5.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          Fasting · last {span} days
        </h2>
        <div className={styles.chips} role="group" aria-label="Fasting period">
          {([7, 30] as FastingSpan[]).map((n) => (
            <button
              key={n}
              type="button"
              className={styles.pill}
              aria-pressed={span === n}
              onClick={() => {
                setSpan(n);
                setPicked(null);
              }}
            >
              {n === 7 ? FASTING_GLANCE_COPY.chip7 : FASTING_GLANCE_COPY.chip30}
            </button>
          ))}
        </div>
      </div>

      {series.isLoading ? (
        <div className="mt-4" role="status" aria-label="Loading your fasts">
          <CardSkeleton height={180} />
        </div>
      ) : series.isError && !series.data ? (
        <div className="mt-4">
          <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
            {online ? STATE_COPY.errorTitle : STATE_COPY.offlineNoSaved}
          </p>
          {online && (
            <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
              {STATE_COPY.errorBody}
            </p>
          )}
          <button type="button" className="btn-ghost-v2 mt-3" style={{ height: 44 }} onClick={() => void series.refetch()}>
            {STATE_COPY.retry}
          </button>
        </div>
      ) : empty ? (
        <div className="mt-4" data-testid="fasting-empty">
          <p className="text-[17px] font-medium" style={{ color: "var(--ink)" }}>
            {FASTING_GLANCE_COPY.emptyTitle}
          </p>
          <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
            {FASTING_GLANCE_COPY.emptyBody}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          {(stale || !online) && (
            <p role="status" className="mb-3 rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
              {loadedAtNote(new Date(series.dataUpdatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), !online)}{" "}
              <button type="button" className="underline underline-offset-2" style={{ minHeight: 44 }} onClick={() => void series.refetch()}>
                {STATE_COPY.retry}
              </button>
            </p>
          )}
          <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
            {fastingAverageEyebrow(span)}
          </p>
          <p className="mt-1 text-[22px] font-medium" style={{ color: "var(--ink)" }} data-testid="fasting-average">
            {average === null ? FASTING_GLANCE_COPY.noFast : fastingAverageSentence(average, days)}
          </p>

          <div className={`${styles.strip} ${span === 7 ? styles.strip7 : ""} mt-3`} role="group" aria-label={span === 7 ? FASTING_GLANCE_COPY.group7Label : FASTING_GLANCE_COPY.strip30Label} data-testid="fasting-strip">
            {band && (
              <span
                className={styles.band}
                style={{ bottom: `${bandGeometry(band.min, band.max, SCALE_HOURS).bottom}%`, height: `${bandGeometry(band.min, band.max, SCALE_HOURS).height}%` }}
                data-testid="fasting-band"
                aria-hidden="true"
              />
            )}
            {cells.map((c) => {
              const bar = (
                <span
                  className={`${styles.stripBar} ${c.day === selected.day ? styles.stripBarSel : ""}`}
                  style={{ height: c.hours === null ? 0 : `${barPercent(c.hours, SCALE_HOURS)}%` }}
                  aria-hidden="true"
                />
              );
              return span === 7 ? (
                <button
                  key={c.day}
                  type="button"
                  className={styles.stripCol}
                  style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
                  aria-label={fastingDayLabel(c.label, c.hours)}
                  aria-pressed={c.day === selected.day}
                  onClick={() => setPicked(c.day)}
                >
                  {bar}
                </button>
              ) : (
                <span key={c.day} className={styles.stripCol}>
                  {bar}
                </span>
              );
            })}
          </div>
          {span === 7 && (
            <div className={`mt-1 flex ${styles.strip7Labels}`} aria-hidden="true">
              {cells.map((c) => (
                <span key={c.day} className="min-w-0 flex-1 text-center text-[11px]" style={{ color: "var(--fg-3)" }}>
                  {c.initial}
                </span>
              ))}
            </div>
          )}
          {span === 30 && (
            <div className="mt-2">
              <label htmlFor="inspect-day" className="mt-3 block text-[13px]" style={{ color: "var(--fg-2)" }}>
                {FASTING_GLANCE_COPY.inspect}
              </label>
              <input
                id="inspect-day"
                type="range"
                className={styles.slider}
                min={0}
                max={cells.length - 1}
                step={1}
                value={Math.max(0, cells.findIndex((c) => c.day === selected.day))}
                onChange={(e) => setPicked(cells[Number(e.target.value)]?.day ?? null)}
                aria-valuetext={fastingDayLabel(selected.label, selected.hours)}
              />
            </div>
          )}

          <div className="mt-3 rounded-(--r-2) p-3" style={{ background: "var(--bg-2)" }} data-testid="fasting-day" role="status">
            <p className="text-[14.5px] font-medium" style={{ color: "var(--ink)" }}>
              {selected.label}
            </p>
            <p className="text-[14px]" style={{ color: "var(--fg-2)" }}>
              {selected.hours === null ? FASTING_GLANCE_COPY.noFast : hoursMinutes(selected.hours)}
            </p>
            <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
              {fastingDayNote({ hours: selected.hours, count: selected.count, band })}
            </p>
          </div>

          <p className="mt-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
            {FASTING_GLANCE_COPY.gapLine} {FASTING_GLANCE_COPY.countedNote}
          </p>
          {ownWindow && (
            <>
              <p className="mt-1 text-[13px]" style={{ color: "var(--fg-3)" }}>
                {windowCaption(ownWindow.min_hours, ownWindow.max_hours)}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[14px]" style={{ color: "var(--ink)" }}>
                    {FASTING_GLANCE_COPY.windowSwitch}
                  </p>
                  <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                    {FASTING_GLANCE_COPY.windowSwitchNote}
                  </p>
                </div>
                <Switch on={showBand} label={FASTING_GLANCE_COPY.windowSwitch} onChange={setShowBand} />
              </div>
            </>
          )}
          <p className="mt-2">
            <Link href={SOLO_HREFS.fastingHistory} className="inline-flex items-center text-[14px] underline underline-offset-2" style={{ color: "var(--fg-2)", minHeight: 44 }}>
              {FASTING_GLANCE_COPY.listLink}
            </Link>
          </p>
        </div>
      )}
    </DSCard>
  );
}
