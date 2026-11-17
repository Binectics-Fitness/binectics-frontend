/**
 * Every sentence the glanceable history screens (weight, fasting, water,
 * targets and the Progress overview cards) show or read aloud, in ONE file so
 * the words can be reviewed and translated together. Designs 47 to 52 of the
 * solo canvas are the source; H2-Decision.dc.html has the wording rules:
 *
 *  - Weight change is a number and the plain words "lower" or "higher". No
 *    arrow, no "good" or "bad" word, no colour.
 *  - A day with nothing logged is a gap. No "missed", no "streak", no score.
 *  - A target is always a range. Progress toward it is plain text, never a
 *    percent, a pass mark or a distance to it.
 *  - Nothing here states a number the member did not log or set.
 *
 * The builders are pure so every variant (lower, higher, equal, one, many,
 * not enough) is unit tested. The wording is the phone app's
 * (binectics-mobile src/constants/glanceCopy.ts), so both say the same thing.
 */

// ─── Shared ─────────────────────────────────────────────────────────────────

/** "5" for 5, "16.5" for 16.5: no trailing ".0". */
export const plainNumber = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export const plural = (n: number, one: string, many: string): string => (n === 1 ? one : many);

export const STATE_COPY = {
  errorTitle: "We could not load this",
  errorBody: "Your entries are safe. Try again in a moment.",
  retry: "Try again",
  offlineNoSaved: "You are offline. Connect to see this.",
  loadingLabel: "Loading",
  unavailable: "This is not available right now.",
  sampleNote: "Showing what was loaded earlier",
} as const;

/** "Offline. Showing the result saved on Thursday 19 Nov." (design 47) */
export const savedResultNote = (savedOn: string, offline: boolean): string =>
  offline ? `Offline. Showing the result saved on ${savedOn}.` : `Could not refresh. Showing the result saved on ${savedOn}.`;

// ─── Weight: then and now (design 48) ───────────────────────────────────────

export type WeightPeriod = "4w" | "3m" | "1y";

export const WEIGHT_COPY = {
  title: "Weight",
  eyebrow: "Weekly average",
  thisWeek: "This week",
  unit: "kg",
  averageNote: "Average of each week's weigh-ins. Not an exact day.",
  notEnoughTitle: "Not enough weigh-ins yet",
  notEnoughBody: "Weigh in a few more times to see your average. Once a week is plenty.",
  logWeight: "Log your weight",
  targetEyebrow: "Your target range",
  dailyTitle: "Daily weigh-ins",
  dailyHidden: "Hidden until you tap Show",
  dailyHiddenForGood: "Hidden for good. Change this below.",
  dailyShowing: "Showing the last five",
  dailyNone: "No weigh-ins in the last 4 weeks.",
  show: "Show",
  hide: "Hide",
  hideForGood: "Hide daily weights for good",
  hideForGoodNote: "Only weekly averages are shown anywhere.",
  hideSwitchLabel: "Hide daily weights",
  setTargetLabel: "Set a target range",
  disclaimer: "This app is not a medical device. For advice about your weight, talk to a health worker.",
  rangeGroupLabel: "Compare with",
} as const;

export const WEIGHT_PERIODS: Record<WeightPeriod, { chip: string; label: string; than: string }> = {
  "4w": { chip: "4 weeks", label: "4 weeks ago", than: "4 weeks ago" },
  "3m": { chip: "3 months", label: "3 months ago", than: "3 months ago" },
  "1y": { chip: "A year", label: "A year ago", than: "a year ago" },
};

/**
 * "1.2 kg lower than 4 weeks ago". `delta` is now minus then, already rounded
 * to 0.1 by the API. Plain words only: "lower", "higher" or "the same".
 */
export function weightChangeSentence(delta: number, period: WeightPeriod): string {
  const than = WEIGHT_PERIODS[period].than;
  const abs = Math.abs(delta);
  if (abs < 0.05) return `The same as ${than}`;
  return `${abs.toFixed(1)} kg ${delta < 0 ? 'lower' : 'higher'} than ${than}`;
}

export const weightValue = (kg: number): string => kg.toFixed(1);

/** The screen-reader sentence for the pair of averages. */
export function weightSummaryLabel(then: number, now: number, delta: number, period: WeightPeriod): string {
  return `${weightValue(then)} kilograms ${WEIGHT_PERIODS[period].than}, ${weightValue(now)} kilograms this week. ${weightChangeSentence(delta, period)}.`;
}

export function weightRangeSentence(min: number, max: number): string {
  return min === max ? `Around ${weightValue(min)} kg` : `Between ${weightValue(min)} and ${weightValue(max)} kg`;
}

export const weeklyAverageLine = (kg: number): string => `Your weekly average is ${weightValue(kg)} kg.`;

// ─── Fasting: strip on a band (design 49) ───────────────────────────────────

export type FastingSpan = 7 | 30;

export const FASTING_GLANCE_COPY = {
  title: "Fasting",
  chip7: "7 days",
  chip30: "30 days",
  group7Label: "Hours fasted on each of the last 7 days",
  strip30Label: "Hours fasted on each of the last 30 days",
  inspect: "Move to inspect a day",
  earlier: "Earlier day",
  later: "Later day",
  noFast: "No fast",
  gapNote: "A rest day, or nothing recorded.",
  gapLine: "A day with no fast is just a gap. Nothing is marked and nothing is counted against you.",
  countedNote: "Each fast is counted on the day it ended. A fast still running is added when it ends.",
  windowSwitch: "Show my window",
  windowSwitchNote: "Only if you set one.",
  listLink: "See every fast as a list",
  emptyTitle: "Your fasts will show here",
  emptyBody: "Once you end a fast, it appears on its day.",
  setWindowLabel: "Set a fasting window",
} as const;

/** "17 h 15 min" for 17.25 hours. */
export function hoursMinutes(hours: number): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h} h ${m < 10 ? `0${m}` : m} min`;
}

export const fastingPeriodWords = (span: FastingSpan): string => (span === 7 ? "last 7 days" : "last 30 days");
export const fastingAverageEyebrow = (span: FastingSpan): string => `Average fast, ${fastingPeriodWords(span)}`;
export const onDays = (days: number): string => `on ${days} ${plural(days, 'day', 'days')}`;
/** "Average 17.4 h on 5 days" (also the card's screen-reader sentence). */
export const fastingAverageSentence = (avg: number, days: number): string => `Average ${avg.toFixed(1)} h ${onDays(days)}`;

export const windowCaption = (min: number, max: number): string =>
  `The pale band is your own window, ${plainNumber(min)} to ${plainNumber(max)} hours.`;
export const windowCardCaption = (min: number, max: number): string =>
  `Pale band: your window, ${plainNumber(min)} to ${plainNumber(max)} h`;

/** What the day card says under the hours. Plain, never a verdict. */
export function fastingDayNote(opts: { hours: number | null; count: number; band: { min: number; max: number } | null }): string {
  if (opts.hours === null) return FASTING_GLANCE_COPY.gapNote;
  if (opts.band) {
    return opts.hours >= opts.band.min && opts.hours <= opts.band.max ? "Inside your window." : "Outside your window, which is fine.";
  }
  return opts.count > 1 ? `${opts.count} fasts ended that day.` : "One fast that day.";
}

export const fastingDayLabel = (date: string, hours: number | null): string =>
  `${date}, ${hours === null ? 'no fast' : hoursMinutes(hours)}`;

// ─── Water: sentence and rail (design 50) ───────────────────────────────────

export type WaterSpan = "week" | "weeks4";

export const WATER_GLANCE_COPY = {
  title: "Water",
  todayEyebrow: "Today",
  usualEyebrow: "Usual day",
  chipWeek: "This week",
  chip4Weeks: "4 weeks",
  add: "+ 1 glass",
  addLabel: "Add one glass",
  undo: "Undo",
  undoLabel: "Undo last glass",
  none: "No water yet today.",
  noUsual: "No glasses counted in this time yet.",
  waterLink: "Open the water screen",
  setAimLabel: "Set an aim",
  emptyUsualTitle: "Your usual day will show here",
} as const;

export const glassesWord = (n: number): string => plural(n, "glass", "glasses");

/** "5 glasses today. 3 to go to your 8." / "8 glasses today. That is your 8." */
export function waterTodaySentence(count: number, aim: number | null): string {
  if (count === 0) return WATER_GLANCE_COPY.none;
  const base = `${count} ${glassesWord(count)} today.`;
  if (aim === null) return base;
  const left = aim - count;
  return left > 0 ? `${base} ${left} to go to your ${aim}.` : `${base} That is your ${aim}.`;
}

/** The rail is a picture of this sentence. */
export const waterRailLabel = (count: number, aim: number): string => `${count} of ${aim} glasses`;
export const waterAvgRailLabel = (avg: number, aim: number): string => `Average ${avg.toFixed(1)} of ${aim} glasses`;

export const waterUsualSentence = (avg: number, span: WaterSpan): string =>
  `Average ${avg.toFixed(1)} glasses a day${span === 'week' ? ' this week.' : ' over 4 weeks.'}`;

/** Second line under the average. `prev` is the week before, when it has any counted days. */
export function waterUsualNote(opts: { avg: number; prev: number | null; days: number; span: WaterSpan }): string {
  const counted = `On the ${opts.days} ${plural(opts.days, 'day', 'days')} you counted.`;
  if (opts.span === "weeks4" || opts.prev === null) return counted;
  const d = Math.abs(Math.round(opts.avg * 10) / 10 - Math.round(opts.prev * 10) / 10);
  if (d < 0.05) return `${counted} That is the same as the week before.`;
  return `${counted} That is ${d.toFixed(1)} ${opts.avg > opts.prev ? 'more' : 'fewer'} than the week before.`;
}

export const waterFootnote = (ml: number): string => `One glass is ${ml} ml. The aim is yours to set or remove.`;

// ─── Targets (design 51) ────────────────────────────────────────────────────

export type TargetTab = "weight" | "fasting" | "water";

export const TARGETS_COPY = {
  title: "Your targets",
  intro: "Optional. A range is kinder than a single number. Change or remove it any time.",
  tabWeight: "Weight",
  tabFasting: "Fasting",
  tabWater: "Water",
  weightEyebrow: "Weight range",
  fastingEyebrow: "Fasting window",
  waterEyebrow: "Water aim",
  from: "From",
  to: "To",
  fromHours: "From (hours)",
  toHours: "To (hours)",
  daysWeek: "Days a week",
  weightStep: "kg, in steps of 0.5",
  fastingCap: "Fasts are capped at 24 hours in the app.",
  waterUnit: "glasses of 250 ml",
  waterNoAdvice: "No recommended amount is shown: the aim is yours.",
  previewEyebrow: "What you will see",
  previewNote: "Plain text only. No percent, no pass mark.",
  save: "Save target",
  saved: "Target saved",
  remove: "Remove this target",
  removed: "Target removed",
  needsConnection: "Targets need a connection to change. This page does not save while you are offline.",
  saveFailed: "That could not be saved. Try again.",
  noWeightYet: "Log a few weigh-ins first, so your range can start from your own number.",
  unavailable: "Targets are not available right now.",
  notSet: "No target set",
} as const;

/**
 * PLACEHOLDER copy: needs clinical review. Shown when the API refuses a weight
 * range with 422 TARGET_BELOW_SUPPORTED_RANGE. The real wording and the real
 * limit are for a clinical reviewer (open item in H2-Decision.dc.html). The
 * app never decides the limit; the API does.
 */
export const TARGET_BELOW_SUPPORTED_RANGE_COPY = {
  title: "This is lower than we can support here",
  body: "Please talk to a health worker about your weight. You can still keep tracking without a target.",
} as const;

export const targetStepLabels = {
  weightLoDown: "Lower the start",
  weightLoUp: "Raise the start",
  weightHiDown: "Lower the end",
  weightHiUp: "Raise the end",
  fastLoDown: "Fewer hours at the start",
  fastLoUp: "More hours at the start",
  fastHiDown: "Fewer hours at the end",
  fastHiUp: "More hours at the end",
  daysDown: "One day fewer",
  daysUp: "One day more",
  glassDown: "One glass fewer",
  glassUp: "One glass more",
} as const;

export const fastingWindowSentence = (min: number, max: number, days: number): string =>
  `${min === max ? `Fast for ${plainNumber(min)} hours` : `Fast between ${plainNumber(min)} and ${plainNumber(max)} hours`}, on ${days} ${plural(days, 'day', 'days')} a week`;

export const waterAimSentence = (glasses: number): string => `Aim for ${glasses} glasses a day`;

export const fastingWindowShort = (min: number, max: number): string => `Your window is ${plainNumber(min)} to ${plainNumber(max)} h.`;

/** "What you will see": plain text, built only from what is logged and what is set. */
export function weightPreview(avg: number | null, min: number, max: number): string {
  const range = min === max ? `Your range is around ${weightValue(min)} kg.` : `Your range is ${weightValue(min)} to ${weightValue(max)} kg.`;
  return avg === null ? range : `${weeklyAverageLine(avg)} ${range}`;
}

export function fastingPreview(avg: number | null, min: number, max: number): string {
  const window = fastingWindowShort(min, max);
  return avg === null ? window : `Average this week ${avg.toFixed(1)} h. ${window}`;
}

export const waterPreview = (count: number, aim: number): string => waterTodaySentence(count, aim);

// ─── Progress overview cards (design 52) ────────────────────────────────────

export const PROGRESS_GLANCE_COPY = {
  weightEyebrow: "Weight · weekly average",
  fastingEyebrow: "Fasting · last 7 days",
  waterEyebrow: "Water · today",
  hAverage: "h average",
  fastingEmpty: "Your fasts will show here",
  weightEmptyTitle: "Not enough weigh-ins yet",
  weightEmptyBody: "Weigh in a few more times to see your average.",
  waterEmpty: "Your water will show here",
  openWeight: "Open weight",
  openFasting: "Open fasting",
  openWater: "Open water",
} as const;

export const waterCardWeekLine = (avg: number): string => `Average ${avg.toFixed(1)} glasses a day this week.`;

/** "You are offline. Showing what was loaded at 10:42." (web design, states board) */
export const loadedAtNote = (time: string, offline: boolean): string =>
  offline ? `You are offline. Showing what was loaded at ${time}.` : `Could not refresh. Showing what was loaded at ${time}.`;

export const PROGRESS_PAGE_COPY = {
  eyebrow: "Your progress",
  title: "A glance at how it is going",
  targetsLink: "Your targets",
  backToProgress: "Back to Progress",
  daysSection: "Daily weigh-ins",
  hideForGoodDone: "Daily weights are hidden for good.",
  showAgain: "Show daily weights again",
  textSummaryHeading: "In words",
  notTurnedOnTitle: "Progress is not available yet",
} as const;
