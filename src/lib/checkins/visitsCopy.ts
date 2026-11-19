/**
 * Every on-screen string for gym visits (owner 19 Nov 2026: no platform
 * streaks anywhere). Board: binectics-plans/design/web-visits (H1-H4, A1-A2,
 * C1-C2, S1), matching mobile #255 (visitsCopy, todayCopy). Visit counts
 * only: this week, the last 30 days, all time. Nothing counts days in a
 * row, nothing resets, nothing praises.
 */

/** "visit" / "visits", the unit after a count. */
export const visitUnit = (n: number) => (n === 1 ? "visit" : "visits");

// ─── Visits row (H1-H4, A1) ─────────────────────────────────────────────────

export const CHECKED_IN_TODAY = "Checked in today";
/** "Last visit Tue 17 Nov". */
export const lastVisit = (day: string) => `Last visit ${day}`;
/** "3 visits this week", "1 visit this week". */
export const visitsThisWeek = (n: number) => `${n} ${visitUnit(n)} this week`;
export const NO_VISITS_THIS_WEEK = "No visits yet this week";

// ─── Activity page (A1, A2) ─────────────────────────────────────────────────

export const ACTIVITY_TITLE = { before: "Your ", emphasis: "activity" } as const;
export const ACTIVITY_SUBTITLE = "Your gym visits, from your own records.";
export const ACTIVITY_META_TITLE = "Activity";
export const ACTIVITY_META_DESCRIPTION = "Your gym visits: this week, the last 30 days and all time.";
export const THIS_WEEK = "This week";
export const CHECK_INS_30D = "Check-ins · 30d";
/** "14 all time". */
export const allTime = (n: number) => `${n} all time`;
export const LAST_30_DAYS = "Last 30 days";
export const RECENT_CHECK_INS = "Recent check-ins";
export const NO_CHECK_INS = "No check-ins yet.";
export const NO_CHECK_INS_HINT = "Scan the QR at your gym to check in.";
export const STATS_LOAD_ERROR = "We couldn't load your visits. Please refresh to try again.";
export const HISTORY_LOAD_ERROR = "We couldn't load your check-ins. Please refresh to try again.";

// ─── Check-in (C1, C2) ──────────────────────────────────────────────────────

/** Eyebrow on the success card; the value is this week's visit count. */
export const SUCCESS_THIS_WEEK = THIS_WEEK;
export const ALREADY_TITLE = "Already counted.";
export const ALREADY_BEFORE = "You’ve already checked in at ";
export const ALREADY_AFTER = " today.";

// ─── Notification settings (S1) ─────────────────────────────────────────────

export const MILESTONES_PREF = "Halfway through or finishing a program";
