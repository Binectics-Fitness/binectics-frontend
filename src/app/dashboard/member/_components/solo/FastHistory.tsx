"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DSCard, PageHeader } from "@/components/ds";
import { useOnline } from "@/hooks/useOnline";
import { useNowMs } from "@/hooks/useNowMs";
import type { FastSession } from "@/lib/api/fasting";
import { useDeleteFast, useEditFast, useFastHistory, useFastSummary } from "@/lib/queries/fasting";
import { deviceTimeZone } from "@/lib/solo/time";
import {
  HISTORY_EMPTY_BODY,
  HISTORY_EMPTY_TITLE,
  HISTORY_FOOT,
  RESULT_EARLY,
  RESULT_EDITED,
  RESULT_REACHED,
} from "@/lib/solo/fastingCopy";
import { durationText, endStamp, resultOf, stamp, toMs } from "@/lib/solo/fastingRules";
import { addDaysTo, dateOfDay, dayInitial, dayKeyOf, dayLabel } from "@/lib/solo/glance";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { FastEditDrawer } from "./FastEditDrawer";
import { CardSkeleton } from "./parts";
import styles from "./fasting.module.css";

/** Monday to Sunday of the week holding `day`. */
export function weekOfDay(day: string): { from: string; to: string; days: string[] } {
  const dow = (dateOfDay(day).getDay() + 6) % 7; // Monday = 0
  const from = addDaysTo(day, -dow);
  return { from, to: addDaysTo(from, 6), days: Array.from({ length: 7 }, (_, i) => addDaysTo(from, i)) };
}

/** "4 fasts completed, 61 h fasted in total". */
export function weekTotalsLine(totals: { completed: number; hours: number }): string {
  const n = totals.completed;
  return `${n} ${n === 1 ? "fast" : "fasts"} completed, ${Math.round(totals.hours)} h fasted in total`;
}

/** The result label for a finished fast. A plain label, never a mark against anyone. */
export function resultLabel(f: FastSession): string {
  if (f.end_reason === "edited") return RESULT_EDITED;
  return resultOf(f) === "reached" ? RESULT_REACHED : RESULT_EARLY;
}

/** Fasting history (design 06): a week strip with totals from the summary endpoint, then every fast, paged. */
export function FastHistory() {
  const online = useOnline();
  const nowMs = useNowMs();
  const tz = useMemo(() => deviceTimeZone(), []);
  const today = nowMs === null ? null : dayKeyOf(new Date(nowMs));
  const week = useMemo(() => (today ? weekOfDay(today) : null), [today]);

  const summary = useFastSummary(week?.from ?? "", week?.to ?? "", tz, !!week);
  const history = useFastHistory();
  const edit = useEditFast();
  const del = useDeleteFast();
  const [editing, setEditing] = useState<FastSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = history.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Fasting"
        title="History"
        actions={
          <Link href={SOLO_HREFS.fasting} className="btn-ghost-v2" style={{ height: 44 }}>
            Back to your fast
          </Link>
        }
      />
      {!online && (
        <div role="status" className="mb-3.5 rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
          You are offline. Showing what was loaded earlier. Editing waits until you are back online.
        </div>
      )}

      <DSCard className="mb-4 p-5.5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          {week ? `This week · ${dayLabel(week.from)} to ${dayLabel(week.to)}` : "This week"}
        </h2>
        {summary.isLoading || !week ? (
          <div className="mt-3" role="status" aria-label="Loading this week">
            <CardSkeleton height={76} />
          </div>
        ) : summary.isError ? (
          <div className="mt-2">
            <p className="text-[14px]" style={{ color: "var(--fg-2)" }}>
              We could not load your week.
            </p>
            <button type="button" className="btn-ghost-v2 mt-2" style={{ height: 44 }} onClick={() => void summary.refetch()}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-[15px] font-medium" style={{ color: "var(--ink)" }} data-testid="week-totals">
              {summary.data ? weekTotalsLine(summary.data.totals) : ""}
            </p>
            <ul className="mt-3 flex gap-2" aria-label="Fasts completed each day this week">
              {week.days.map((d) => {
                const cell = summary.data?.days.find((x) => x.date === d);
                const done = (cell?.completed ?? 0) > 0;
                return (
                  <li key={d} className={styles.weekCell} style={{ listStyle: "none" }}>
                    <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                      {dayInitial(d)}
                    </span>
                    <span
                      className={`${styles.weekDot} ${done ? styles.weekDotOn : ""}`}
                      role="img"
                      aria-label={`${dayLabel(d)}, ${done ? "a fast was completed" : "no completed fast"}`}
                    >
                      {dateOfDay(d).getDate()}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </DSCard>

      <DSCard className="p-0">
        <h2 className="px-5.5 pt-4 font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          All fasts
        </h2>
        {history.isLoading ? (
          <div className="p-5" role="status" aria-label="Loading your fasts">
            <CardSkeleton height={160} />
          </div>
        ) : history.isError && rows.length === 0 ? (
          <div className="p-5.5">
            <p className="text-[14px]" style={{ color: "var(--fg-2)" }}>
              We could not load your fasts.
            </p>
            <button type="button" className="btn-ghost-v2 mt-2" style={{ height: 44 }} onClick={() => void history.refetch()}>
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5.5" data-testid="history-empty">
            <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
              {HISTORY_EMPTY_TITLE}
            </p>
            <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
              {HISTORY_EMPTY_BODY}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Started</th>
                  <th scope="col">Length</th>
                  <th scope="col">Ended</th>
                  <th scope="col">Result</th>
                  <th scope="col">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const s = toMs(f.started_at);
                  const e = f.ended_at ? toMs(f.ended_at) : s;
                  return (
                    <tr key={f.id} data-testid="history-row">
                      <td>{stamp(s)}</td>
                      <td>{durationText(e - s)}</td>
                      <td>{f.ended_at ? endStamp(s, e) : ""}</td>
                      <td>{resultLabel(f)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost-v2"
                          style={{ height: 44 }}
                          onClick={() => {
                            setError(null);
                            setEditing(f);
                          }}
                          aria-label={`Edit the fast that started ${stamp(s)}`}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {history.hasNextPage && (
          <div className="p-4">
            <button
              type="button"
              className="btn-ghost-v2"
              style={{ height: 44 }}
              disabled={history.isFetchingNextPage}
              onClick={() => void history.fetchNextPage()}
            >
              {history.isFetchingNextPage ? "Loading" : "Show more"}
            </button>
          </div>
        )}
        {history.isError && rows.length > 0 && (
          <p role="alert" className="px-5.5 pb-3 text-[13px]" style={{ color: "var(--danger-ink)" }}>
            We could not load more. Try again.
          </p>
        )}
      </DSCard>
      <p className="mt-4 text-[13px]" style={{ color: "var(--fg-3)" }}>
        {HISTORY_FOOT}
      </p>

      <FastEditDrawer
        fast={nowMs === null ? null : editing}
        nowMs={nowMs ?? 0}
        saving={edit.isPending}
        deleting={del.isPending}
        error={error}
        onClose={() => {
          setEditing(null);
          setError(null);
        }}
        onSave={(id, input) => {
          if (!online) return setError("You are offline. This page does not save while offline, so nothing was changed.");
          setError(null);
          edit.mutate({ id, input }, { onSuccess: () => setEditing(null), onError: (e) => setError(e.message) });
        }}
        onDelete={(id) => {
          if (!online) return setError("You are offline. This page does not save while offline, so nothing was changed.");
          setError(null);
          del.mutate(id, { onSuccess: () => setEditing(null), onError: (e) => setError(e.message) });
        }}
      />
    </>
  );
}
