/**
 * Every string on the coach results section, copied from the board
 * (binectics-plans/design/coach-results/build.py, `C`). Tests assert the
 * section renders these, so a wording change happens here and on the board.
 */
export const RESULTS_COPY = {
  heading: "Program results",
  openProgram: "Open program",
  /** Fasting and water tasks: the result came from the client's own log. */
  shared: "Shared by the client's log",
  health: "From a connected health app",
  withdrawnMeta: "Counted as done. The client changed this log after the day closed.",
  privacy:
    "Fasting and water show only on a task you set: done or not, and one number. Days without a task are not listed.",
  loading: "Loading results",
  error: "Couldn't load program results.",
  retry: "Try again",
  emptyTitle: "No program results yet",
  emptyBody: (firstName: string) => `Assign ${firstName} a program to see each day's tasks here.`,
  noneInRange: (days: number) => `No tasks in the last ${days} days.`,
  today: "Today",
  paused: "Paused",
  day: (day: number, total: number | null) => (total ? `Day ${day} of ${total}` : `Day ${day}`),
  week: (done: number, scheduled: number) => `${done} of ${scheduled} done in the last 7 days`,
  dayCount: (done: number, total: number) => `${done} of ${total} done`,
  targetHours: (n: number) => `target ${n} h`,
  targetGlasses: (n: number) => `target ${n} glasses`,
  hours: (v: number) => `${v.toFixed(1)} h`,
  glasses: (v: number) => (v === 1 ? "1 glass" : `${v} glasses`),
  soFar: (v: number) => `${v} so far`,
  range: (days: number) => `${days} days`,
} as const;

export const RESULT_RANGES = [7, 14, 28] as const;
export type ResultRange = (typeof RESULT_RANGES)[number];

export const RESULT_PILLS = {
  done: { label: "Done", tone: "success" },
  late: { label: "Done late", tone: "success" },
  missed: { label: "Missed", tone: "warn" },
  pending: { label: "Pending", tone: "neutral" },
  skipped: { label: "Skipped", tone: "neutral" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
} as const;
