import { AVAILABILITY_ISSUE_COPY as COPY } from "@/lib/constants/availabilityCopy";

/** One weekly time range as the editor holds it ("HH:mm", or "" when cleared). */
export type RangeDraft = { id: string; startTime: string; endTime: string };
export type DayDraft = { enabled: boolean; ranges: RangeDraft[] };

/** What is wrong with one range, and which input to outline. */
export type RangeIssue = {
  message: string;
  start: boolean;
  end: boolean;
};

/**
 * Every range that can't be saved, keyed by range id, in day then display
 * order. Closed days are skipped: their ranges are not sent.
 *
 * - a cleared time (a native time input can be emptied)
 * - an end at or before the start
 * - two ranges on the same day that overlap; the later one in the list
 *   carries the issue and names the one it overlaps. Back to back
 *   (12:00–14:00 then 14:00–16:00) is fine.
 */
export function weekIssues(week: Record<number, DayDraft>): Map<string, RangeIssue> {
  const out = new Map<string, RangeIssue>();
  for (let day = 0; day < 7; day++) {
    const d = week[day];
    if (!d?.enabled) continue;
    const valid: RangeDraft[] = [];
    for (const r of d.ranges) {
      if (!r.startTime) {
        out.set(r.id, { message: COPY.startMissing, start: true, end: false });
        continue;
      }
      if (!r.endTime) {
        out.set(r.id, { message: COPY.endMissing, start: false, end: true });
        continue;
      }
      if (r.startTime >= r.endTime) {
        out.set(r.id, { message: COPY.endBeforeStart, start: false, end: true });
        continue;
      }
      const clash = valid.find((o) => r.startTime < o.endTime && o.startTime < r.endTime);
      if (clash) {
        out.set(r.id, { message: COPY.overlap(clash.startTime, clash.endTime), start: true, end: true });
        continue;
      }
      valid.push(r);
    }
  }
  return out;
}

/**
 * The API names a malformed field by its place in the payload
 * ("rules.3.startTime must match ..."). Map those back to range ids, given
 * the range id sent at each payload index. Messages without a path (the
 * API's "startTime must be earlier than endTime" carries no index) map to
 * nothing and stay in the banner.
 */
export function apiRangeIssues(
  message: unknown,
  payloadRangeIds: string[],
): Map<string, RangeIssue> {
  const out = new Map<string, RangeIssue>();
  const lines = Array.isArray(message) ? message : typeof message === "string" ? [message] : [];
  for (const line of lines) {
    const m = typeof line === "string" ? /rules\.(\d+)\.(startTime|endTime)/.exec(line) : null;
    const id = m ? payloadRangeIds[Number(m[1])] : undefined;
    if (!m || !id) continue;
    const prev = out.get(id);
    const start = m[2] === "startTime" || !!prev?.start;
    const end = m[2] === "endTime" || !!prev?.end;
    out.set(id, { message: COPY.badTime, start, end });
  }
  return out;
}

export type SessionDraft = {
  duration: number;
  buffer: number;
  advanceHours: number;
  priceFree: boolean;
  priceText: string;
  priceMinor: number | null;
  currency: string;
};

export type SessionField = "duration" | "buffer" | "advance" | "price" | "currency";

/** Session settings that can't be saved, by field, in on-screen order. */
export function sessionIssues(s: SessionDraft): Partial<Record<SessionField, string>> {
  const out: Partial<Record<SessionField, string>> = {};
  if (!(s.duration >= 5 && s.duration <= 240)) out.duration = COPY.sessionLength;
  if (!(s.buffer >= 0 && s.buffer <= 60)) out.buffer = COPY.buffer;
  if (!(s.advanceHours >= 0 && s.advanceHours <= 168)) out.advance = COPY.advanceNotice;
  // A session is paid or free, never unpriced: the API stores a missing
  // price as free, so an empty field would publish a free session nobody
  // chose.
  if (!s.priceFree) {
    if (s.priceText.trim() === "") out.price = COPY.priceMissing;
    else if (s.priceMinor === null || s.priceMinor <= 0) out.price = COPY.priceZero;
  }
  // The API needs a currency with any price, a free one (0) included.
  if (!s.currency) out.currency = COPY.currency;
  return out;
}

export type BlockDraft = {
  mode: "single" | "range";
  date: string;
  endDate: string;
  custom: boolean;
  startTime: string;
  endTime: string;
};

export type BlockField = "date" | "endDate" | "startTime" | "endTime";

/** A blocked date (or range, or custom hours) that can't be added, by field. */
export function blockIssues(b: BlockDraft): Partial<Record<BlockField, string>> {
  const out: Partial<Record<BlockField, string>> = {};
  if (!b.date) out.date = COPY.chooseDate;
  if (b.mode === "range") {
    if (!b.endDate) out.endDate = COPY.chooseEndDate;
    else if (b.date && b.endDate < b.date) out.endDate = COPY.endDateBeforeStart;
    else if (b.date && inclusiveDays(b.date, b.endDate) > 31) out.endDate = COPY.rangeTooLong;
  } else if (b.custom) {
    if (!b.startTime) out.startTime = COPY.startMissing;
    else if (!b.endTime) out.endTime = COPY.endMissing;
    else if (b.startTime >= b.endTime) out.endTime = COPY.endBeforeStart;
  }
  return out;
}

/** Days from `from` to `to`, both counted ("2026-12-01".."2026-12-01" is 1). */
export function inclusiveDays(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}

/** Bring the first field marked with `attr` into view, after React paints it. */
export function scrollToFirstIssue(attr: string): void {
  requestAnimationFrame(() => {
    const el = document.querySelector(`[${attr}]`);
    // Guarded: jsdom has no scrollIntoView.
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });
}
