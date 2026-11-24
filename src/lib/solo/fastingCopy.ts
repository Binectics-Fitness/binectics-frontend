/**
 * PENDING DIETITIAN REVIEW.
 *
 * Every word of fasting guidance the web shows lives in this one file, so a
 * dietitian can review and edit it in one place (owner requirement, 17 Nov
 * 2026). Nothing here has been reviewed yet. The wording is the mobile app's (binectics-mobile
 * src/constants/fastingCopy.ts) so the two apps say the same thing.
 *
 * Rules the copy keeps (design canvas notes n10, n10b):
 *  - cautious words: "typically", "may", "often", "some people";
 *  - NO autophagy times (not established in people);
 *  - no praise for long fasts, no weight claims, no streaks;
 *  - timings vary between people and the page says so.
 */

export interface FastingStage {
  id: "digesting" | "settling" | "switching" | "fat_burning" | "deeper";
  /** Stage window in elapsed hours: [fromHours, toHours). */
  fromHours: number;
  toHours: number;
  /** "8 to 12 hours". */
  range: string;
  title: string;
  /** What the body is typically doing. */
  body: string;
  /** What a member may notice. Optional. */
  notice?: string;
  /** One line for the running page's stage card. */
  short: string;
  /** "Next: ..." line for the running page, or null for the last stage. */
  next: string | null;
}

export const FASTING_STAGES: readonly FastingStage[] = [
  {
    id: "digesting",
    fromHours: 0,
    toHours: 4,
    range: "0 to 4 hours",
    title: "Digesting",
    body: "Your body is using your last meal.",
    short: "Your body is using your last meal.",
    next: "Next: settling, from about 4 hours.",
  },
  {
    id: "settling",
    fromHours: 4,
    toHours: 8,
    range: "4 to 8 hours",
    title: "Settling",
    body: "Blood sugar and insulin come down. Hunger often shows up at your usual mealtime, then passes.",
    short: "Blood sugar comes down. Hunger often shows up at your usual mealtime, then passes.",
    next: "Next: switching over, from about 8 hours.",
  },
  {
    id: "switching",
    fromHours: 8,
    toHours: 12,
    range: "8 to 12 hours",
    title: "Switching over",
    body: "Stored sugar is running down and your body starts to lean on fat.",
    notice: "You may notice: hunger in waves, feeling a little cold, lower energy. Water or unsweetened tea can help.",
    short: "Stored sugar is running down. Hunger may come in waves.",
    next: "Next: fat burning likely, from about 12 hours.",
  },
  {
    id: "fat_burning",
    fromHours: 12,
    toHours: 16,
    range: "12 to 16 hours",
    title: "Fat burning likely",
    body: "Fat becomes the main fuel and ketones begin to rise. Hunger often eases; some people feel clear-headed, others light-headed.",
    short: "Fat becomes the main fuel. Hunger often eases.",
    next: "Next: deeper into fat burning, from about 16 hours.",
  },
  {
    id: "deeper",
    fromHours: 16,
    toHours: Number.POSITIVE_INFINITY,
    range: "16 to 24 hours",
    title: "Deeper into fat burning",
    body: "Ketones keep rising. You may feel steady, or tired.",
    short: "Ketones keep rising. You may feel steady, or tired.",
    next: null,
  },
];

export const STAGES_INTRO = "What bodies typically do during a fast. Yours may run earlier or later.";
export const STAGES_FOOTER =
  "General information, not medical advice. If you feel dizzy, shaky or unwell, stop and eat. We do not show times for autophagy: they have not been established in people.";
/** Shown on the last stage when it is past the member's own length. */
export const notPartOfGoal = (targetHours: number): string => `Not part of your ${targetHours} hour fast.`;

// ─── How do you feel right now? ─────────────────────────────────────────────

export const FEELING_TITLE = "How do you feel right now?";
export const FEELING_NOTE = "Only you see this. It is kept with the fast.";
export const FEELING_OPTIONS = [
  { value: "fine", label: "Fine" },
  { value: "hungry", label: "Hungry" },
  { value: "low_energy", label: "Low energy" },
  { value: "unwell", label: "Unwell" },
] as const;
export const FEELING_SAVED = "Saved.";
/** Shown for "Unwell" instead of any other guidance. */
export const UNWELL_TITLE = "Please stop and eat";
export const UNWELL_BODY =
  "If you feel dizzy, shaky or unwell, stop and eat something. A fast is not worth feeling ill for. If it does not pass, speak to a doctor.";
export const UNWELL_END = "End fast now";

// ─── Safety check ───────────────────────────────────────────────────────────

export const CHECK_STEP = "Step 1 of 2 · asked once";
export const CHECK_TITLE = "Before your first fast: fasting is not right for everyone";
export const CHECK_INTRO =
  "Tick anything that applies to you. We ask once, and we keep only whether you can continue and when, not your answers.";
export const CHECK_DISCLAIMER =
  "Binectics is not a medical device and does not give medical advice. If you feel unwell during a fast, stop and eat.";
export const CHECK_OPTIONS = [
  { key: "under_18", label: "I am under 18" },
  { key: "pregnant_or_breastfeeding", label: "I am pregnant or breastfeeding" },
  { key: "diabetes_or_medication", label: "I have diabetes or take regular medication" },
  { key: "eating_disorder_history", label: "I have, or have had, an eating disorder" },
] as const;
export const CHECK_NONE = "None of these apply to me";
export const CHECK_CONTINUE = "Continue";
export const CHECK_ACK_LABEL = "I have read the note above";

export const CHECK_BLOCKED: Record<"UNDER_18" | "EATING_DISORDER_HISTORY", { title: string; body: string }> = {
  UNDER_18: {
    title: "The fasting timer is for adults",
    body: "Fasting can be hard on growing bodies, so we have not started a timer. You can still use the rest of Binectics. If you would like advice about eating, a doctor or school nurse is a good person to ask.",
  },
  EATING_DISORDER_HISTORY: {
    title: "We have not started a timer",
    body: "Thank you for telling us. A fasting timer is not a good fit for someone who has, or has had, an eating disorder, so we will not start one. You are not doing anything wrong. If you would like support, a doctor or a local eating-disorder service can help.",
  },
};
/** When the stored result says "not passed" and the reason was not kept (it never is). */
export const CHECK_BLOCKED_STORED = {
  title: "The fasting timer is not available to you",
  body: "Please talk to a health worker about fasting. You can still use water, weight and the rest.",
};
export const CHECK_DOCTOR = {
  title: "Talk to a doctor first",
  body: "Fasting can affect pregnancy, breastfeeding, blood sugar and some medicines. Please speak to your doctor or midwife before you fast. You can continue when you have.",
  action: "I will talk to my doctor",
};
export const CHECK_RETAKE = "Go back and change my answers";
export const CHECK_RETAKE_LATER = "Take the check again";
export const CHECK_BACK_TODAY = "Back to Today";

// ─── Start page ─────────────────────────────────────────────────────────────

export const START_STEP = "Step 2 of 2";
export const START_TITLE = "How long?";
export const START_CAP_NOTE = "Fasts can be up to 24 hours.";
export const START_FOOT = "Binectics keeps the time. It does not give religious or medical guidance.";
export const START_BUTTON = "Start fast";
export const CUSTOM_LABEL = "Hours (1 to 24, halves allowed)";

// ─── Start time (mobile #261, StartTimeControl) ─────────────────────────────
//
// The "Starts" half of the card is the control: Now, 30 min, 1 h or 2 h ago,
// or a time today (Yesterday for a fast started last night). Never in the
// future, never more than 36 hours back (the API's rule), never before the
// last fast ended (the API's FASTING_OVERLAP).

export const START_LABEL = "Starts";
export const ENDS_LABEL = "Ends";
export const ENDS_PICK_LENGTH = "Pick a length";
export const START_QUESTION = "When did you start?";
export const START_CHOICES = [
  { key: "now", label: "Now", minutes: 0, a11y: "Now" },
  { key: "m30", label: "30 min ago", minutes: 30, a11y: "30 minutes ago" },
  { key: "h1", label: "1 h ago", minutes: 60, a11y: "1 hour ago" },
  { key: "h2", label: "2 h ago", minutes: 120, a11y: "2 hours ago" },
] as const;
export const START_PICK = "Pick a time…";
export const START_PICK_A11Y = "Pick a time";
export const START_DAY_LABEL = "Day";
export const START_TODAY = "Today";
export const START_YESTERDAY = "Yesterday";
export const START_TIME_LABEL = "Time";
/** "Now · 20:30" on the card. */
export const startNowValue = (time: string): string => `Now · ${time}`;
/** Screen reader label of the Starts button: "Starts now, 20:30. Change when your fast started." */
export const startButtonA11y = (when: string): string => `Starts ${when}. Change when your fast started.`;

/** "1 h 15 min", "45 min", "2 h", from whole minutes. */
export const agoWords = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};
/** "Started 1 h 15 min ago, at 19:15." or "Started 21 h 30 min ago, yesterday at 23:00." */
export const startedAgo = (minutesAgo: number, time: string, yesterday: boolean): string =>
  minutesAgo < 1
    ? `Started less than a minute ago, ${yesterday ? "yesterday " : ""}at ${time}.`
    : `Started ${agoWords(minutesAgo)} ago, ${yesterday ? "yesterday " : ""}at ${time}.`;
export const START_FUTURE = "That time is later than now. A fast cannot start in the future. Pick Yesterday if you started last night.";
export const START_TOO_EARLY = "A fast can start at most 36 hours ago.";
/** "Your last fast ended at 19:40. This one can start from then." */
export const lastFastEnded = (time: string, yesterday: boolean): string =>
  `Your last fast ended ${yesterday ? "yesterday " : ""}at ${time}. This one can start from then.`;
/** A picked time before the last fast ended. */
export const startBeforeLastEnd = (time: string, yesterday: boolean): string =>
  `That is before your last fast ended (${yesterday ? "yesterday " : ""}${time}). Pick a later time.`;
/** Screen reader: a quick choice that would start before the last fast ended. */
export const startChoiceUnavailable = (choice: string): string => `${choice}, not available: before your last fast ended`;
/** The server refused the start as an overlap (a fast this page did not know of). */
export const START_REFUSED_OVERLAP =
  "Your fast was not started: that start overlaps a fast you already logged. Pick a later start and try again.";

// ─── Coach note on the start page (Today board 07-Risks, R1 and R2; mobile #251) ─
//
// Shown only to a member with a trainer or dietitian (gyms never count and are
// never named). It says who can't see fasts, lists today's meal slots from a
// dietitian's meal plan (plans have no meal times, so it never guesses which
// meal the fast runs through), and offers "Tell <name>" with a draft the
// member chooses to send. Start is never blocked.

/** "Ngozi and Tunde can't see your fasts." First names; three or more: "Your coaches". */
export const coachesCantSee = (firstNames: readonly string[]): string => {
  if (firstNames.length === 0 || firstNames.length > 2) return "Your coaches can't see your fasts.";
  return `${firstNames.join(" and ")} can't see your fasts.`;
};
/** "breakfast", "breakfast and dinner", "breakfast, lunch and dinner". */
export const listSlots = (slots: readonly string[]): string =>
  slots.length <= 1 ? slots.join("") : `${slots.slice(0, -1).join(", ")} and ${slots[slots.length - 1]}`;
/** "Your meal plan from Ngozi has breakfast, lunch and dinner today. If this fast runs through one of them, tell Ngozi." */
export const mealPlanToday = (dietitian: string, slots: readonly string[]): string =>
  `Your meal plan from ${dietitian} has ${listSlots(slots)} today. ` +
  (slots.length === 1 ? `If this fast runs through it, tell ${dietitian}.` : `If this fast runs through one of them, tell ${dietitian}.`);
export const tellLabel = (firstName: string): string => `Tell ${firstName}`;
/** When the conversation cannot be opened. */
export const TELL_FAILED = "We could not open the conversation. Try again from Messages.";
/**
 * The chat draft behind "Tell <name>":
 * "I'm planning a 16-hour fast, 20:00 today to 12:00 tomorrow. Is that OK with my meal plan?"
 * Without a meal plan today the question is left off.
 */
export const fastDraft = (p: {
  hours: string;
  startTime: string;
  startDay: string;
  endTime: string;
  endDay: string;
  mealPlan: boolean;
}): string =>
  `I'm planning ${/^(8|11|18)(\.|$)/.test(p.hours) ? "an" : "a"} ${p.hours}-hour fast, ${p.startTime} ${p.startDay} to ${p.endTime} ${p.endDay}.` +
  (p.mealPlan ? " Is that OK with my meal plan?" : "");
/** The day word ("Today", "Tomorrow", "Thu 20 Nov") as the draft says it: "today", "on Thu 20 Nov". */
export const fastDraftDay = (relativeDay: string): string =>
  ["Today", "Tomorrow", "Yesterday"].includes(relativeDay) ? relativeDay.toLowerCase() : `on ${relativeDay}`;
/** Above the pre-filled chat composer. */
export const FAST_DRAFT_NOTE = "Draft. Nothing is sent until you tap Send.";

// ─── Running ────────────────────────────────────────────────────────────────

export const EXPIRED_TITLE = "This fast ran past 24 hours";
export const EXPIRED_BODY =
  "We never extend a fast or delete one. Tell us when you really stopped eating and it is saved to your history.";
export const EXPIRED_LABEL = "I stopped at";
export const EXPIRED_BUTTON = "Close this fast";
export const END_BUTTON = "End fast";

// ─── The end action (owner decision B, 19 Nov 2026; mobile #263) ────────────
//
// "early" is never shown once the goal is reached.

/** Before the goal: an outline button that asks once. */
export const END_EARLY = "End fast early";
/** At or after the goal: the filled button, no question (Undo still follows). */
export const FINISH_FAST = "Finish fast";
/** Eyebrow once the goal is reached: "Goal reached · 16 hours". */
export const goalReachedEyebrow = (hours: string): string => `Goal reached · ${hours} hours`;
/** The line under the time once the goal is reached. */
export const reachedAt = (time: string): string => `Reached at ${time} · the timer keeps going`;
/** Said once by a screen reader when the goal passes with the page open. */
export const GOAL_REACHED_ANNOUNCE = "Goal reached. Finish fast is available.";
export const END_EARLY_TITLE = "End your fast now?";
/** "You are at 15 h 56 min of 16 hours. It is saved as ended early. You can undo for 10 minutes." */
export const endEarlyBody = (elapsed: string, hours: string) => ({
  before: "You are at ",
  strong: elapsed,
  after: ` of ${hours} hours. It is saved as ended early. You can undo for 10 minutes.`,
});
export const KEEP_GOING = "Keep going";
export const EDIT_START_LINK = "Edit start time";
export const REMINDERS_TITLE = "Reminders are set in the mobile app";
export const REMINDERS_NOTE = (endTime: string): string => `Mobile only. Your phone will tell you at ${endTime}.`;

export const NO_FAST_TITLE = "No fast is running";
export const NO_FAST_BODY = "Start one whenever you are ready.";

// ─── Done ───────────────────────────────────────────────────────────────────

export const DONE_EYEBROW = "Fast ended";
export const doneTitle = (fasted: string): string => `Saved to your history at ${fasted}`;
export const DONE_UNDO_NOTE = "You can undo this for 10 minutes. After that you can still edit the times from History.";
export const UNDO = "Undo";
export const SEE_HISTORY = "See history";
export const DONE_NEXT_TITLE = "Start another fast when you like";

/** "Goal was 16 hours. You ended 1 h 02 min before it." */
export const goalLine = (targetHours: number, shortBy: string | null): string =>
  shortBy === null ? `Goal was ${targetHours} hours.` : `Goal was ${targetHours} hours. You ended ${shortBy} before it.`;

// ─── History ────────────────────────────────────────────────────────────────

export const HISTORY_TITLE = "What is happening, and your history";
export const HISTORY_EMPTY_TITLE = "Your fasts will appear here";
export const HISTORY_EMPTY_BODY = "Once you end a fast, it is saved here.";
export const HISTORY_FOOT = "Ended early is a plain label, not a mark against you. Your history is kept for as long as you keep your account.";
export const RESULT_REACHED = "Length reached";
export const RESULT_EARLY = "Ended early";
export const RESULT_EDITED = "Times edited";
export const DELETE_TITLE = "Delete this fast?";
export const DELETE_BODY = "It is removed from your history. This cannot be undone.";
export const DELETE_KEEP = "Keep it";
export const DELETE_CONFIRM = "Delete";
export const EDIT_TITLE = "Edit this fast";
export const EDIT_RULES =
  "A fast cannot run longer than 24 hours, and two fasts cannot overlap. Times in the future are not accepted.";
export const NOTE_LABEL = "Note, only you see it";
export const NOTE_MAX = 200;

// ─── Plain messages for the API's error codes (written here, not taken from the server) ─

export const FASTING_ERROR_MESSAGES: Record<string, string> = {
  FASTING_SESSION_NOT_FOUND: "We could not find that fast. It may have been deleted.",
  FASTING_SCREENING_REQUIRED: "Please complete the one-time safety check before you start a fast.",
  FASTING_ALREADY_RUNNING: "A fast is already running.",
  FASTING_BAD_TIME: "That time does not work. A fast cannot start or end in the future, and can last at most 24 hours.",
  FASTING_OVERLAP: "That time overlaps another fast. Pick a time that does not.",
  FASTING_EXPIRED_UNCLOSED: "Your last fast ran past its limit. Close it with the time it really ended first.",
  FASTING_BAD_STATE: "This fast has changed. Reload the page and try again.",
  FASTING_UNDO_UNAVAILABLE: "This fast can no longer be reopened.",
  FASTING_FEELINGS_FULL: "This fast already has 20 notes.",
  FASTING_DAILY_LIMIT_REACHED: "You have logged the most fasts allowed in a day. Try again later.",
  FASTING_SUMMARY_TOO_MANY: "There are too many fasts in that range to total. Try a shorter range.",
};

// ─── The running page's eyebrow ─────────────────────────────────────────────

/** "Morning · almost there": the time of day, then where the fast is. */
export const progressPhrase = (progress: number): string => {
  if (progress >= 1) return "goal reached";
  if (progress >= 0.75) return "almost there";
  if (progress >= 0.5) return "past halfway";
  if (progress >= 0.25) return "settling in";
  return "just started";
};
export const daypart = (hour: number): string =>
  hour >= 5 && hour < 12 ? "Morning" : hour >= 12 && hour < 17 ? "Afternoon" : hour >= 17 && hour < 21 ? "Evening" : "Night";
