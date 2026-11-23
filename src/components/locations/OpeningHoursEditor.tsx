"use client";

import { useState } from "react";
import { DSCard, Eyebrow } from "@/components/ds";
import { Toggle } from "@/components/ds/Toggle";
import {
  MAX_RANGES_PER_DAY,
  WEEKDAYS,
  emptyWeek,
  hoursProblems,
  toMinutes,
  weeklyHoursOf,
  type ClosedDate,
  type WeeklyHours,
  type Weekday,
} from "@/lib/marketplace/openingHours";

const DAY_NAME: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const DEFAULT_RANGE = { open: "06:00", close: "22:00" };

export interface OpeningHoursValue {
  opening_hours: WeeklyHours | null;
  closed_dates: ClosedDate[];
}

/**
 * A gym location's weekly hours and closed dates. Each day is on or off,
 * with up to 3 time ranges; a close earlier than the open runs past
 * midnight. The same checks as the API run as the owner types, so Save is
 * only offered for hours the API accepts.
 */
export function OpeningHoursEditor({
  initialHours,
  initialClosedDates,
  saving,
  readOnly = false,
  onSave,
}: {
  initialHours: WeeklyHours | null | undefined;
  initialClosedDates: ClosedDate[] | undefined;
  saving: boolean;
  /** Staff without MANAGE_ORGANIZATION see the hours but cannot change them. */
  readOnly?: boolean;
  onSave: (value: OpeningHoursValue) => void;
}) {
  const [hours, setHours] = useState<WeeklyHours>(() => weeklyHoursOf(initialHours) ?? emptyWeek());
  const [hasHours, setHasHours] = useState(!!initialHours);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>(initialClosedDates ?? []);
  const [newDate, setNewDate] = useState("");
  const [newNote, setNewNote] = useState("");

  const problems = hoursProblems(hours);
  const hasProblems = Object.keys(problems).length > 0;

  const setDay = (day: Weekday, ranges: WeeklyHours[Weekday]) => {
    setHasHours(true);
    setHours((h) => ({ ...h, [day]: ranges }));
  };
  const updateRange = (day: Weekday, i: number, field: "open" | "close", value: string) =>
    setDay(
      day,
      hours[day].map((r, k) => (k === i ? { ...r, [field]: value } : r)),
    );

  const copyToWeekdays = (from: Weekday) => {
    setHasHours(true);
    setHours((h) => {
      const next = { ...h };
      for (const d of ["mon", "tue", "wed", "thu", "fri"] as Weekday[]) next[d] = h[from].map((r) => ({ ...r }));
      return next;
    });
  };

  const addClosedDate = () => {
    if (!newDate || closedDates.some((c) => c.date === newDate)) return;
    const note = newNote.trim();
    setClosedDates((list) =>
      [...list, note ? { date: newDate, note } : { date: newDate }].sort((a, b) => a.date.localeCompare(b.date)),
    );
    setNewDate("");
    setNewNote("");
  };

  const inputClass = "h-9 rounded-(--r-2) border bg-bg px-2 text-[13.5px] text-ink focus:border-border-2 focus:outline-none";

  return (
    <DSCard className="p-4.5">
      <fieldset disabled={readOnly} className="border-0 p-0 m-0 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>
            Opening hours
          </h2>
          {!hasHours && <Eyebrow muted>Not set</Eyebrow>}
        </div>
        <p className="text-[12.5px] mb-4" style={{ color: "var(--fg-3)" }}>
          Local time at this location.
        </p>

        <div className="flex flex-col">
          {WEEKDAYS.map((day) => {
            const ranges = hours[day];
            const isOpen = ranges.length > 0;
            const problem = problems[day];
            const errorId = `hours-problem-${day}`;
            return (
              <div
                key={day}
                data-testid={`hours-day-${day}`}
                className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-2.5"
                style={{ borderTop: day === "mon" ? undefined : "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3 sm:w-[150px] shrink-0">
                  <Toggle
                    on={isOpen}
                    label={`Open on ${DAY_NAME[day]}`}
                    onChange={(on) => setDay(day, on ? [{ ...DEFAULT_RANGE }] : [])}
                  />
                  <span className="text-[13.5px]" style={{ color: isOpen ? "var(--ink)" : "var(--fg-3)" }}>
                    {DAY_NAME[day]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {!isOpen ? (
                    <span className="text-[13px] leading-9" style={{ color: "var(--fg-3)" }}>
                      Closed
                    </span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {ranges.map((r, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2">
                          <input
                            type="time"
                            aria-label={`${DAY_NAME[day]} opens`}
                            aria-invalid={!!problem || undefined}
                            aria-describedby={problem ? errorId : undefined}
                            value={r.open}
                            onChange={(e) => updateRange(day, i, "open", e.target.value)}
                            className={`${inputClass} w-28 ${problem ? "border-danger" : "border-border"}`}
                          />
                          <span className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                            –
                          </span>
                          <input
                            type="time"
                            aria-label={`${DAY_NAME[day]} closes`}
                            aria-invalid={!!problem || undefined}
                            aria-describedby={problem ? errorId : undefined}
                            value={r.close}
                            onChange={(e) => updateRange(day, i, "close", e.target.value)}
                            className={`${inputClass} w-28 ${problem ? "border-danger" : "border-border"}`}
                          />
                          {r.open && r.close && toMinutes(r.close) < toMinutes(r.open) && <Eyebrow muted>Next day</Eyebrow>}
                          {ranges.length > 1 && (
                            <button
                              type="button"
                              aria-label={`Remove ${DAY_NAME[day]} ${r.open}–${r.close}`}
                              onClick={() =>
                                setDay(
                                  day,
                                  ranges.filter((_, k) => k !== i),
                                )
                              }
                              className="btn-ghost-v2 sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-2">
                        {ranges.length < MAX_RANGES_PER_DAY && (
                          <button
                            type="button"
                            onClick={() => setDay(day, [...ranges, { open: "16:00", close: "22:00" }])}
                            className="btn-ghost-v2 sm"
                          >
                            + Add hours
                          </button>
                        )}
                        {day === "mon" && (
                          <button type="button" onClick={() => copyToWeekdays("mon")} className="btn-ghost-v2 sm">
                            Copy to Tue–Fri
                          </button>
                        )}
                      </div>
                      {problem && (
                        <div id={errorId} role="alert" className="text-[12.5px]" style={{ color: "var(--danger)" }}>
                          {problem}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="text-[14px] font-medium mt-6 mb-1" style={{ color: "var(--ink)" }}>
          Closed dates
        </h3>
        <p className="text-[12.5px] mb-3" style={{ color: "var(--fg-3)" }}>
          Holidays and other days you&apos;re shut.
        </p>
        {closedDates.length > 0 && (
          <ul className="flex flex-col mb-3" aria-label="Closed dates">
            {closedDates.map((c) => (
              <li
                key={c.date}
                className="flex items-center justify-between gap-3 py-1.5 text-[13.5px]"
                style={{ color: "var(--ink)" }}
              >
                <span>
                  <span className="font-mono">{c.date}</span>
                  {c.note && <span style={{ color: "var(--fg-3)" }}> · {c.note}</span>}
                </span>
                <button
                  type="button"
                  aria-label={`Remove closed date ${c.date}`}
                  onClick={() => setClosedDates((list) => list.filter((x) => x.date !== c.date))}
                  className="btn-ghost-v2 sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            aria-label="Closed date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className={`${inputClass} border-border`}
          />
          <input
            type="text"
            aria-label="Reason (optional)"
            placeholder="Reason (optional)"
            maxLength={60}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className={`${inputClass} border-border w-48 placeholder:text-fg-4`}
          />
          <button
            type="button"
            onClick={addClosedDate}
            disabled={!newDate || closedDates.some((c) => c.date === newDate)}
            className="btn-ghost-v2 sm disabled:opacity-40"
          >
            Add date
          </button>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              type="button"
              disabled={saving || hasProblems}
              onClick={() => onSave({ opening_hours: hasHours ? hours : null, closed_dates: closedDates })}
              className="btn-primary-v2 sm disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save hours"}
            </button>
            {hasHours && (
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setHours(emptyWeek());
                  setHasHours(false);
                }}
                className="btn-ghost-v2 sm disabled:opacity-40"
              >
                Clear hours
              </button>
            )}
          </div>
        )}
      </fieldset>
    </DSCard>
  );
}
