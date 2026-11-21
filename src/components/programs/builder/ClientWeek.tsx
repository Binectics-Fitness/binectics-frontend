"use client";

import { BUILDER_COPY } from "./copy";
import { Stepper, metaStyle } from "./controls";
import { TASK_TONE_COLORS, clientLabel, taskTone, totalWeeks, weekPlan, type BuilderProgram } from "./model";

const C = BUILDER_COPY.clientView;

/**
 * "What your client sees": one week of the program as it lands on the
 * client's Today, using the API's spread (3 times a week = days 1, 3, 5).
 */
export function ClientWeek({ program, week, onWeek }: { program: BuilderProgram; week: number; onWeek: (w: number) => void }) {
  const total = totalWeeks(program);
  const w = Math.min(week, total);
  const days = weekPlan(program, w);
  const late = program.catchUp === 0 ? C.lateSameDay : C.lateDays(program.catchUp);
  return (
    <div className="flex flex-col gap-4" aria-label={C.eyebrow}>
      <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={metaStyle}>{C.eyebrow}</div>
      <div className="flex items-center">
        <Stepper
          value={w}
          text={C.week(w)}
          min={1}
          max={total}
          lessLabel={C.lessWeek}
          moreLabel={C.moreWeek}
          onChange={(v) => onWeek(Math.max(1, Math.min(total, v)))}
        />
        <span className="text-[13px] ml-2.5" style={metaStyle}>{C.of(total)}</span>
      </div>
      <ol className="flex flex-col gap-0.5" data-testid="client-week">
        {days.map((d, i) => (
          <li key={i} className="flex gap-2.5 items-start py-1" style={{ minHeight: 30, borderTop: "1px solid var(--border)" }}>
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] shrink-0 pt-px" style={{ width: 48, color: "var(--fg-3)" }}>
              {C.day(i + 1)}
            </span>
            <span className="flex flex-wrap gap-x-2.5 gap-y-1">
              {d.length === 0 ? (
                <span className="text-[13px]" style={metaStyle}>{C.rest}</span>
              ) : (
                d.map((t, j) => (
                  <span key={`${t.key}-${j}`} className="flex items-center gap-1 text-[11.5px] leading-tight" style={{ color: "var(--fg-2)" }}>
                    <i className="inline-block shrink-0" style={{ width: 8, height: 8, borderRadius: 999, background: TASK_TONE_COLORS[taskTone(t)].ink }} />
                    {clientLabel(t)}
                  </span>
                ))
              )}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-[13px]" style={metaStyle}>{C.footer(late)}</p>
    </div>
  );
}
