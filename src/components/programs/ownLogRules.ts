/**
 * Habit tasks that tick themselves from the client's own fasting or water log
 * (API: auto rule metrics `fasting_hours` / `water_glasses`, comparator `gte`,
 * the task's own day only).
 *
 * Owner ruling (19 Nov 2026): the coach sees fasting or water only through
 * such a task, and then only that day's done-or-not and one number. The
 * editor says so next to the option. Every on-screen string for this lives
 * here so tests can assert the editor renders exactly these.
 */

export type OwnLogMetric = "fasting_hours" | "water_glasses";

export const OWN_LOG_METRICS: readonly OwnLogMetric[] = ["fasting_hours", "water_glasses"];

export function isOwnLogMetric(metric: unknown): metric is OwnLogMetric {
  return OWN_LOG_METRICS.includes(metric as OwnLogMetric);
}

/** Whole-number bounds the API accepts (AUTO_RULE_BOUNDS). */
export const OWN_LOG_BOUNDS: Record<OwnLogMetric, { min: number; max: number }> = {
  fasting_hours: { min: 1, max: 24 },
  water_glasses: { min: 1, max: 30 },
};

export const OWN_LOG_COPY = {
  /** Field label above the picker. */
  label: "Ticks itself",
  /** The picker's "no rule" option. */
  none: "No, the client ticks it",
  option: {
    fasting_hours: "Fasting hours",
    water_glasses: "Glasses of water",
  } satisfies Record<OwnLogMetric, string>,
  /** Label above the number input. */
  thresholdLabel: {
    fasting_hours: "Hours",
    water_glasses: "Glasses",
  } satisfies Record<OwnLogMetric, string>,
  /** What the coach gets, said plainly next to the option. */
  privacy: {
    fasting_hours:
      "Your client's own fasting log ticks this task. You see whether they reached it and the hours that day, nothing else.",
    water_glasses:
      "Your client's own water log ticks this task. You see whether they reached it and the glasses that day, nothing else.",
  } satisfies Record<OwnLogMetric, string>,
  /**
   * Board 07-Risks L3: the client sees the task marked as shared with this
   * coach, by first name ("Shared with you" only when there is no name).
   */
  clientSees: (firstName?: string | null) =>
    `Your client sees "Shared with ${firstName?.trim() || "you"}" on this task.`,
  /** Inline error when the number is missing, fractional or out of bounds. */
  boundsError: {
    fasting_hours: "Set the fast in whole hours, 1 to 24.",
    water_glasses: "Set the water target in whole glasses, 1 to 30.",
  } satisfies Record<OwnLogMetric, string>,
  /** Toast on save when any task's number is not valid. */
  saveError: (where: string) => `Fix the number on ${where} before saving.`,
  /** Title sent when the provider left the task title blank. */
  defaultTitle: {
    fasting_hours: (n: number) => `Fast at least ${n} hours`,
    water_glasses: (n: number) => `Drink at least ${n} glasses`,
  } satisfies Record<OwnLogMetric, (n: number) => string>,
  /** A rule made outside this editor (e.g. steps from a health app) on this task. */
  keptRule: "Ticks from a health app. Kept when you save.",
} as const;

/**
 * The threshold as a whole number within bounds, or null when the input is
 * blank, fractional or out of range.
 */
export function parseOwnLogThreshold(metric: OwnLogMetric, raw: string): number | null {
  const t = raw.trim();
  if (t === "" || !/^\d+$/.test(t)) return null;
  const n = Number(t);
  const { min, max } = OWN_LOG_BOUNDS[metric];
  return n >= min && n <= max ? n : null;
}
