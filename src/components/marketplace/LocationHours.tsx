"use client";

import { useId, useState, useSyncExternalStore } from "react";
import {
  WEEKDAYS,
  dayHoursText,
  hoursStatus,
  hoursStatusLabel,
  todayIn,
  upcomingClosedDates,
  type ClosedDate,
  type WeeklyHours,
} from "@/lib/marketplace/openingHours";

const DAY_NAME = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
} as const;

const closedDateLabel = (date: string): string =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

// One shared clock for every LocationHours on the page, refreshed each
// minute while any is mounted. useSyncExternalStore gives null on the server
// and during hydration, so there is no setState in an effect.
let minuteNow: Date | null = null;
const minuteListeners = new Set<() => void>();
let minuteTimer: ReturnType<typeof setInterval> | null = null;

function subscribeMinute(listener: () => void) {
  minuteListeners.add(listener);
  if (minuteListeners.size === 1) {
    // A Date cached by an earlier mount may be stale; React reads the
    // snapshot again right after subscribing.
    minuteNow = new Date();
    minuteTimer = setInterval(() => {
      minuteNow = new Date();
      minuteListeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    minuteListeners.delete(listener);
    if (minuteListeners.size === 0 && minuteTimer) {
      clearInterval(minuteTimer);
      minuteTimer = null;
    }
  };
}

function getMinuteSnapshot(): Date {
  if (!minuteNow) minuteNow = new Date();
  return minuteNow;
}

const getServerSnapshot = (): null => null;

/**
 * A gym location's hours on its public profile: "Open now · closes 22:00"
 * (worked out in the location's zone, not the viewer's), and the full week
 * with today marked on tap. Nothing renders until mounted, so the server
 * render never shows a status for the wrong minute; it refreshes each minute.
 */
export function LocationHours({
  hours,
  closedDates,
  timeZone,
  now: fixedNow,
}: {
  hours: WeeklyHours;
  closedDates?: ClosedDate[] | null;
  timeZone: string;
  /** Tests pin the clock. */
  now?: Date;
}) {
  const liveNow = useSyncExternalStore(subscribeMinute, getMinuteSnapshot, getServerSnapshot);
  const now = fixedNow ?? liveNow;
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  if (!now) return null;
  const status = hoursStatus(hours, closedDates, timeZone, now);
  const today = todayIn(timeZone, now);
  const upcoming = upcomingClosedDates(closedDates, timeZone, now).slice(0, 3);

  return (
    <div className="mt-1.5">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((e) => !e)}
        className="inline-flex items-center gap-1.5 text-[13.5px] p-0 bg-transparent border-0 cursor-pointer"
        style={{ color: "var(--fg-2)" }}
      >
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: status.open ? "var(--signal)" : "var(--fg-4)" }}
        />
        <span style={{ color: status.open ? "var(--ink)" : "var(--fg-2)" }}>{hoursStatusLabel(status)}</span>
        <span aria-hidden style={{ color: "var(--fg-3)" }}>
          {expanded ? "▴" : "▾"}
        </span>
      </button>
      {expanded && (
        <div id={panelId} className="mt-2 max-w-[320px]">
          <table className="w-full text-[13px]" aria-label="Opening hours">
            <tbody>
              {WEEKDAYS.map((day) => {
                const isToday = day === today;
                return (
                  <tr key={day} aria-current={isToday ? "date" : undefined} style={{ color: isToday ? "var(--ink)" : "var(--fg-2)" }}>
                    <td className="py-0.5 pr-4" style={{ fontWeight: isToday ? 500 : 400 }}>
                      {DAY_NAME[day]}
                    </td>
                    <td className="py-0.5 text-right font-mono" style={{ fontVariantNumeric: "tabular-nums", fontWeight: isToday ? 500 : 400 }}>
                      {dayHoursText(hours[day])}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {upcoming.length > 0 && (
            <ul className="list-none p-0 mt-2 text-[12.5px]" aria-label="Closed dates" style={{ color: "var(--fg-3)" }}>
              {upcoming.map((c) => (
                <li key={c.date}>
                  Closed {closedDateLabel(c.date)}
                  {c.note ? ` · ${c.note}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
