/**
 * ScheduleRow — one entry in a coach's time-gutter schedule (the desktop
 * coach mock in DashboardMosaic and dashboard-trainer.html).
 *
 * Layout: a 70px mono time gutter, right-aligned against a hairline, then
 * the entry card with a 3px left border. The border is ink for a live
 * session and --fg-4 for one that won't happen (cancelled, no-show), whose
 * name also drops to --fg-3. Not the mock's opacity fade: that takes the
 * text below AA contrast (and --fg-3 on --bg-2 is under AA too, so the
 * muted card keeps the --bg surface). ScheduleGap is the hairline "14:00–15:30 · 90 min" row
 * between two sessions.
 *
 * Shared by the trainer and dietitian Today screens.
 *
 * Render rows inside a <ScheduleList>, which supplies the list semantics.
 */
import Link from "next/link";
import type { ReactNode } from "react";

interface ScheduleListProps {
  /** Accessible name for the list, e.g. "Today's sessions". */
  label: string;
  children: ReactNode;
}

export function ScheduleList({ label, children }: ScheduleListProps) {
  return (
    <ol aria-label={label} className="flex flex-col py-2">
      {children}
    </ol>
  );
}

interface ScheduleRowProps {
  /** Gutter time, e.g. "09:30". */
  time: string;
  /** Second gutter line, e.g. the date when the row isn't today. */
  timeSub?: string;
  title: ReactNode;
  /** Mono context line, e.g. "60 min · Strength". */
  meta?: ReactNode;
  /** Avatar or icon tile. */
  leading?: ReactNode;
  /** Status pill. Must not be interactive when the row has an href. */
  trailing?: ReactNode;
  /** A session that won't happen: muted border and surface. */
  muted?: boolean;
  href?: string;
}

const GUTTER = "w-[70px] shrink-0 pr-3 pt-3.5 text-right font-mono text-[11.5px]";

export function ScheduleRow({ time, timeSub, title, meta, leading, trailing, muted, href }: ScheduleRowProps) {
  const card = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium" style={{ color: muted ? "var(--fg-3)" : "var(--ink)" }}>
          {title}
        </span>
        {meta && (
          <span className="mt-0.5 block truncate font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>
            {meta}
          </span>
        )}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </>
  );
  const cardClass =
    "flex w-full items-center gap-2.5 rounded-(--r-2) px-3.5 py-3 text-left transition-colors duration-(--motion-fast)";
  const cardStyle = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderLeft: `3px solid ${muted ? "var(--fg-4)" : "var(--ink)"}`,
  };

  return (
    <li className="flex" data-schedule-row data-muted={muted ? "" : undefined}>
      <div
        className={GUTTER}
        style={{ color: "var(--fg-3)", borderRight: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}
      >
        <div>{time}</div>
        {timeSub && (
          <div className="mt-0.5 text-[10.5px] uppercase tracking-[0.04em]">
            {timeSub}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 px-3 py-1.5 sm:px-4.5">
        {href ? (
          <Link
            href={href}
            className={`${cardClass} hover:bg-(--bg-2) focus-visible:outline-2 focus-visible:outline-offset-2`}
            style={cardStyle}
          >
            {card}
          </Link>
        ) : (
          <div className={cardClass} style={cardStyle}>
            {card}
          </div>
        )}
      </div>
    </li>
  );
}

/** The free time between two sessions, e.g. "14:00 – 15:30 · 90 min". */
export function ScheduleGap({ label }: { label: string }) {
  return (
    <li className="flex" data-schedule-gap>
      <div className="w-[70px] shrink-0" style={{ borderRight: "1px solid var(--border)" }} />
      <div
        className="flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 font-mono text-[11px] sm:px-4.5"
        style={{ color: "var(--fg-3)" }}
      >
        <span aria-hidden="true" className="h-px flex-1" style={{ background: "var(--border)" }} />
        <span className="whitespace-nowrap">{label}</span>
        <span aria-hidden="true" className="h-px flex-1" style={{ background: "var(--border)" }} />
      </div>
    </li>
  );
}
