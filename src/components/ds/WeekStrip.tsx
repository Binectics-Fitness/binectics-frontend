/**
 * WeekStrip — seven day chips for the current week.
 *
 * Feed it `weekStrip(events, now)` from src/lib/ui/activity.ts, computed on
 * the client with `useClientNow()` (src/lib/ui/useClientNow.ts), so every "done" day
 * is a real event. States (mosaic + member-home.html):
 *   done      --signal-soft / --signal-ink, with a tick
 *   today     --ink / --bg (a done today keeps the done fill plus an ink ring)
 *   missed    --bg-2 / --fg-2
 *   upcoming  --bg with a hairline / --fg-3
 * Visible text clears 4.5:1 (WCAG 1.4.3 applies even though it is
 * aria-hidden): done 14.5, today 19.1, missed fg-2/bg-2 ≈ 10, upcoming
 * fg-3/bg 4.65. The weekday label is dimmed (opacity .7) only on done and
 * today chips, which have the headroom; missed and upcoming draw it at full
 * strength.
 * Each chip reads as one sentence, e.g. "Mon 5 Oct, checked in" or
 * "Wed 7 Oct, checked in, today", from a visually hidden span; the visible
 * weekday/date text is aria-hidden so it isn't read twice.
 */
import { Check } from "lucide-react";
import type { DayState, WeekDay } from "@/lib/ui/activity";

const DEFAULT_STATE_LABELS: Record<DayState, string> = {
  done: "done",
  today: "today",
  missed: "nothing logged",
  upcoming: "upcoming",
};

const CHIP_STYLE: Record<DayState, { background: string; color: string; border: string }> = {
  done: { background: "var(--signal-soft)", color: "var(--signal-ink)", border: "1px solid transparent" },
  today: { background: "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)" },
  missed: { background: "var(--bg-2)", color: "var(--fg-2)", border: "1px solid transparent" },
  upcoming: { background: "var(--bg)", color: "var(--fg-3)", border: "1px solid var(--border)" },
};

interface WeekStripProps {
  days: readonly WeekDay[];
  /** Accessible name of the strip, e.g. "Check-ins this week". */
  label: string;
  /** Spoken state words, e.g. { done: "checked in", missed: "no check-in" }. */
  stateLabels?: Partial<Record<DayState, string>>;
  className?: string;
}

export function WeekStrip({ days, label, stateLabels, className = "" }: WeekStripProps) {
  const words = { ...DEFAULT_STATE_LABELS, ...stateLabels };
  return (
    <ol aria-label={label} className={`grid grid-cols-7 gap-1 ${className}`}>
      {days.map((day) => {
        const style = CHIP_STYLE[day.state];
        const ring = day.isToday && day.state === "done";
        const spoken = `${day.weekday} ${day.dayOfMonth} ${day.month}, ${words[day.state]}${ring ? ", today" : ""}`;
        return (
          <li
            key={day.date}
            aria-current={day.isToday ? "date" : undefined}
            data-state={day.state}
            className="flex aspect-square min-w-0 flex-col items-center justify-center rounded-[var(--r-2)]"
            style={{ ...style, ...(ring ? { border: "1px solid var(--ink)" } : null) }}
          >
            <span className="sr-only">{spoken}</span>
            <span
              aria-hidden="true"
              data-weekday
              className={`font-mono text-[9.5px] uppercase tracking-[0.04em] leading-none ${
                day.state === "done" || day.state === "today" ? "opacity-70" : ""
              }`}
            >
              {day.weekday}
            </span>
            <span
              aria-hidden="true"
              className="mt-1 text-[15px] font-medium leading-none"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {day.dayOfMonth}
            </span>
            {day.state === "done" && (
              <Check aria-hidden="true" data-tick size={12} strokeWidth={2.5} className="mt-0.5" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
