/**
 * A gym location's opening hours (api: common/opening-hours).
 *
 * Times are local clock times ("HH:MM") in the LOCATION's zone, never the
 * viewer's: a member in London looking at a Lagos gym sees Lagos opening
 * times and whether it is open in Lagos right now.
 *
 * - A day with no ranges is closed; up to 3 ranges a day (split shifts).
 * - close "24:00" is midnight at the end of the day.
 * - close earlier than open runs past midnight (06:00-01:00).
 * - closed_dates are whole dates (YYYY-MM-DD, location zone) the gym is shut.
 *
 * Kept in step with the mobile copy (binectics-mobile src/utils/openingHours.ts).
 */

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface TimeRange {
  open: string;
  close: string;
}
export type WeeklyHours = Record<Weekday, TimeRange[]>;
export interface ClosedDate {
  date: string;
  note?: string;
}

export const MAX_RANGES_PER_DAY = 3;

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const DAY_MIN = 24 * 60;
const WEEK_MIN = 7 * DAY_MIN;
const OPEN_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const hhmm = (minutes: number): string => {
  const m = ((minutes % DAY_MIN) + DAY_MIN) % DAY_MIN;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** Minutes a range lasts; close before open runs past midnight. */
const rangeLength = (r: TimeRange): number => {
  const o = toMinutes(r.open);
  const c = toMinutes(r.close);
  return c > o ? c - o : DAY_MIN - o + c;
};

/** All seven days present; anything malformed reads as closed. */
export function weeklyHoursOf(value: unknown): WeeklyHours | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const src = value as Record<string, unknown>;
  const out = {} as WeeklyHours;
  for (const day of WEEKDAYS) {
    const ranges = Array.isArray(src[day]) ? (src[day] as unknown[]) : [];
    out[day] = ranges.filter(
      (r): r is TimeRange =>
        !!r &&
        typeof (r as TimeRange).open === "string" &&
        typeof (r as TimeRange).close === "string" &&
        OPEN_RE.test((r as TimeRange).open) &&
        (OPEN_RE.test((r as TimeRange).close) || (r as TimeRange).close === "24:00") &&
        (r as TimeRange).open !== (r as TimeRange).close,
    );
  }
  return out;
}

export function emptyWeek(): WeeklyHours {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}

/**
 * The editor's check, the same rules the API applies: valid times, open
 * differs from close, at most 3 ranges a day, nothing overlapping anywhere
 * in the week (a past-midnight range into the next morning, Sunday into
 * Monday). Returns a message per day with a problem.
 */
export function hoursProblems(hours: WeeklyHours): Partial<Record<Weekday, string>> {
  const problems: Partial<Record<Weekday, string>> = {};
  const intervals: { start: number; end: number; day: Weekday }[] = [];
  WEEKDAYS.forEach((day, i) => {
    const ranges = hours[day] ?? [];
    if (ranges.length > MAX_RANGES_PER_DAY) {
      problems[day] = `At most ${MAX_RANGES_PER_DAY} time ranges`;
      return;
    }
    for (const r of ranges) {
      if (!OPEN_RE.test(r.open) || !(OPEN_RE.test(r.close) || r.close === "24:00")) {
        problems[day] = "Enter times as HH:MM";
        return;
      }
      if (r.open === r.close) {
        problems[day] = "Opening and closing time are the same";
        return;
      }
      const start = i * DAY_MIN + toMinutes(r.open);
      intervals.push({ start, end: start + rangeLength(r), day });
    }
  });
  intervals.sort((a, b) => a.start - b.start);
  for (let k = 0; k < intervals.length && intervals.length > 1; k++) {
    const a = intervals[k];
    const next = intervals[(k + 1) % intervals.length];
    const nextStart = k + 1 < intervals.length ? next.start : next.start + WEEK_MIN;
    if (a.end > nextStart && !problems[a.day]) {
      problems[a.day] = a.day === next.day ? "Time ranges overlap" : `Runs into ${WEEKDAY_SHORT[next.day]}'s hours`;
    }
  }
  return problems;
}

// ── The clock in the location's zone ──────────────────────────────────

const partsFormatters = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = partsFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    partsFormatters.set(timeZone, f);
  }
  return f;
}

/** The date and wall-clock minute an instant falls on in a zone. */
export function zonedNow(at: Date, timeZone: string): { date: string; weekday: number; minutes: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = partsFormatter(timeZone).formatToParts(at);
  } catch {
    parts = partsFormatter("UTC").formatToParts(at);
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  // Monday = 0, from the calendar date itself (no zone needed).
  const weekday = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  const hour = Number(get("hour")) % 24;
  return { date, weekday, minutes: hour * 60 + Number(get("minute")) };
}

const addDays = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export type HoursStatus =
  | {
      open: true;
      /** Wall-clock close time ("24:00" = midnight); null when open round the clock. */
      closesAt: string | null;
      /** Days from today the close falls on (0 today, 1 tomorrow...). */
      closesInDays: number;
      closesWeekday: Weekday | null;
    }
  | {
      open: false;
      /** The closed date that shuts today, if that is why. */
      closedToday: ClosedDate | null;
      /** Next opening time; null when nothing opens in the coming week. */
      opensAt: string | null;
      opensInDays: number;
      opensWeekday: Weekday | null;
    };

/**
 * Open or closed right now, in the location's zone. Ranges are laid on a
 * wall-clock timeline from today's local midnight (yesterday's for a range
 * still running past midnight), so a DST change never shifts "closes 22:00".
 * A range does not open on a closed date; a range that opened the evening
 * before still runs into it.
 */
export function hoursStatus(
  hours: WeeklyHours,
  closedDates: ClosedDate[] | null | undefined,
  timeZone: string,
  at: Date = new Date(),
): HoursStatus {
  const { date: today, weekday, minutes: now } = zonedNow(at, timeZone);
  const closed = new Map((closedDates ?? []).map((c) => [c.date, c]));
  const dayAt = (offset: number): Weekday => WEEKDAYS[(((weekday + offset) % 7) + 7) % 7];
  const occurrences: { start: number; end: number }[] = [];
  for (let k = -1; k <= 8; k++) {
    if (closed.has(addDays(today, k))) continue;
    for (const r of hours[dayAt(k)] ?? []) {
      const start = k * DAY_MIN + toMinutes(r.open);
      occurrences.push({ start, end: start + rangeLength(r) });
    }
  }
  occurrences.sort((a, b) => a.start - b.start);

  const current = occurrences.find((o) => o.start <= now && now < o.end);
  if (current) {
    // Follow ranges that pick up exactly where this one ends (18:00-24:00
    // then 00:00-02:00), so "closes" is the real closing time.
    let end = current.end;
    for (;;) {
      const next = occurrences.find((o) => o.start <= end && o.end > end);
      if (!next) break;
      end = next.end;
    }
    if (end - now >= WEEK_MIN) {
      return { open: true, closesAt: null, closesInDays: 0, closesWeekday: null };
    }
    // A close exactly at midnight reads as that day's 24:00.
    const atMidnight = end % DAY_MIN === 0;
    const closesInDays = atMidnight ? end / DAY_MIN - 1 : Math.floor(end / DAY_MIN);
    return {
      open: true,
      closesAt: atMidnight ? "24:00" : hhmm(end),
      closesInDays,
      closesWeekday: dayAt(closesInDays),
    };
  }

  const next = occurrences.find((o) => o.start > now && o.start < 8 * DAY_MIN);
  const opensInDays = next ? Math.floor(next.start / DAY_MIN) : 0;
  return {
    open: false,
    closedToday: closed.get(today) ?? null,
    opensAt: next ? hhmm(next.start) : null,
    opensInDays,
    opensWeekday: next ? dayAt(opensInDays) : null,
  };
}

/** "Open now · closes 22:00", "Closed · opens 06:00 tomorrow", "Closed today · Christmas · opens Mon 06:00". */
export function hoursStatusLabel(status: HoursStatus): string {
  if (status.open) {
    if (status.closesAt === null) return "Open 24 hours";
    // A past-midnight close (01:00) still reads as tonight's close.
    const day = status.closesInDays > 1 && status.closesWeekday ? `${WEEKDAY_SHORT[status.closesWeekday]} ` : "";
    return `Open now · closes ${day}${status.closesAt}`;
  }
  const head = status.closedToday ? `Closed today${status.closedToday.note ? ` · ${status.closedToday.note}` : ""}` : "Closed";
  if (!status.opensAt) return head;
  if (status.opensInDays === 0) return `${head} · opens ${status.opensAt}`;
  if (status.opensInDays === 1) return `${head} · opens ${status.opensAt} tomorrow`;
  return `${head} · opens ${status.opensWeekday ? `${WEEKDAY_SHORT[status.opensWeekday]} ` : ""}${status.opensAt}`;
}

/** One day's ranges as text: "06:00–12:00, 16:00–22:00", "Open 24 hours" or "Closed". */
export function dayHoursText(ranges: TimeRange[]): string {
  if (!ranges || ranges.length === 0) return "Closed";
  if (ranges.length === 1 && ranges[0].open === "00:00" && ranges[0].close === "24:00") return "Open 24 hours";
  return ranges.map((r) => `${r.open}–${r.close}`).join(", ");
}

/** The weekday (Mon..Sun) it is now in the zone, for highlighting today. */
export function todayIn(timeZone: string, at: Date = new Date()): Weekday {
  return WEEKDAYS[zonedNow(at, timeZone).weekday];
}

/** Closed dates from today on, soonest first. */
export function upcomingClosedDates(
  closedDates: ClosedDate[] | null | undefined,
  timeZone: string,
  at: Date = new Date(),
): ClosedDate[] {
  const today = zonedNow(at, timeZone).date;
  return (closedDates ?? []).filter((c) => c.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}
