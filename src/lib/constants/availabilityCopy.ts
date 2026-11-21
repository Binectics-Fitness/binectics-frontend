/**
 * Copy for the availability editor's field errors (ConsultationAvailabilityManager).
 * Each problem is said under the field that is wrong; the toast only counts them.
 */
export const AVAILABILITY_ISSUE_COPY = {
  startMissing: "Enter a start time.",
  endMissing: "Enter an end time.",
  endBeforeStart: "End after the start time.",
  /** A time the API refused as malformed (a rules.N.startTime path). */
  badTime: "Enter a time like 09:00.",
  overlap: (start: string, end: string) => `Overlaps ${start}–${end}. Change or remove one.`,

  sessionLength: "Between 5 and 240 minutes.",
  buffer: "Between 0 and 60 minutes.",
  advanceNotice: "Between 0 and 168 hours.",
  priceMissing: "Enter a price, or choose Free.",
  priceZero: "Enter a price above zero, or choose Free.",
  currency: "Choose a currency.",

  chooseDate: "Choose a date.",
  chooseEndDate: "Choose an end date.",
  endDateBeforeStart: "On or after the start date.",
  rangeTooLong: "A range can be up to 31 days.",
} as const;

/** The toast: how many things need fixing, never what they are. */
export function availabilityFixToast(
  count: number,
  noun: "time" | "setting" | "field",
  before: "saving" | "blocking" = "saving",
): string {
  return count === 1
    ? `Fix the ${noun} marked in red before ${before}.`
    : `Fix the ${count} ${noun}s marked in red before ${before}.`;
}
