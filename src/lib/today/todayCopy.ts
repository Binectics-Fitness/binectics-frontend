/**
 * Every string the coached Today shows that came with the "one Today" design
 * (today-canvas boards 04-C, 05-C, 06, 07-Risks; owner answers of 19 Nov
 * 2026). A port of binectics-mobile src/constants/todayCopy.ts: change a word
 * there, here and on the board together. Names are passed in; nothing here
 * invents a number.
 */

export type Audience = { kind: "one"; name: string } | { kind: "many" } | { kind: "none" };
export type NamedAudience = Exclude<Audience, { kind: "none" }>;

/** "Tunde Okafor" -> "Tunde". */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

// ─── Coach card (C1, S2) ────────────────────────────────────────────────────

export const COACH_EYEBROW = { trainer: "Your trainer", dietitian: "Your dietitian" } as const;
export const coachNoPlan = (first: string) => `No plan from ${first} yet.`;
export const coachNoPlanHint = (first: string) => `Message ${first} about your first week.`;
export const COACH_MESSAGE = "Message";
export const COACH_BOOK = "Book a session";

/** S2: a program assigned to start on a later day. */
export const planStartsOn = (program: string, day: string) => `${program} starts ${day}.`;
export const PLAN_STARTS_HINT = "Your first tasks show here that day.";

// ─── Pending requests (S1) ──────────────────────────────────────────────────

export const REVIEW = "Review";

/**
 * Who is waiting on the member's answer, in one line (mobile
 * utils/clientRequests pendingSummary, without the gyms' team invitations:
 * web shows gym offers in their own card).
 */
export function pendingSummary(names: readonly string[]): { title: string; body: string } | null {
  if (names.length === 0) return null;
  if (names.length === 1) {
    return {
      title: `${names[0]} wants to coach you`,
      body: "Accept and they can see your progress and set up your plan.",
    };
  }
  return {
    title: `${names.length} providers want to coach you`,
    body: `${names[0]} and ${names.length - 1 === 1 ? names[1] : `${names.length - 1} others`} are waiting on your answer.`,
  };
}

// ─── Program card (R5) ──────────────────────────────────────────────────────

/** Sentence case: a section heading, not an eyebrow. */
export const planFrom = (first: string | null) => (first ? `From ${first} today` : "Your plan today");
/**
 * Web has no task list (owner ruling F17, 14 Oct 2026, being re-asked): the
 * program card says where the tasks are, in as few words as it can.
 */
export const TASKS_IN_APP = "Tick today's tasks in the Binectics app.";

// ─── Your own tracking (C1, R3, R5, R7, R8) ─────────────────────────────────

export const OWN_TRACKING = "Your own tracking";
export const ONLY_YOU = "Only you see these.";

/**
 * The privacy line (R3, L1). `weight`: a coach can read the weight on the
 * member's own card (their "Share progress with providers" setting, on by
 * default). `linked`: a coach's task asks for a fast or water (L1).
 */
export function privacyLine(who: Audience, opts: { weight?: boolean; linked?: boolean } = {}): string {
  if (who.kind === "none") return ONLY_YOU;
  const whose = who.kind === "one" ? `${who.name}'s` : "your coaches'";
  if (opts.weight && opts.linked) return `Only you see these, except your weight and what ${whose} tasks ask for.`;
  if (opts.linked) return `Only you see these, except what ${whose} tasks ask for.`;
  if (opts.weight) return "Only you see these, except your weight.";
  return who.kind === "one" ? `${ONLY_YOU} ${who.name} doesn't.` : `${ONLY_YOU} Your coaches don't.`;
}

export const whatTheySee = (who: NamedAudience) =>
  who.kind === "one" ? `What ${who.name} sees` : "What your coaches see";

/** Compact card cells (R5). */
export const CELL = { fast: "Fast", water: "Water", weight: "Weight", list: "Daily list" } as const;
export const NONE = "None";
export const START = "Start";
export const ADD_GLASS = "+ 1";
export const LOG = "Log";
export const OPEN = "Open";
export const ADD = "Add";
export const WEIGHT_NOT_YET = "Not yet";
export const listCount = (done: number, total: number) => `${done} of ${total}`;

// ─── "What Tunde sees" (R4, L3) ─────────────────────────────────────────────

export const sheetSeesHeading = (who: NamedAudience) => (who.kind === "one" ? `${who.name} sees` : "Your coaches see");

export interface SeesFacts {
  /** A task from the coach asks for a fast or water (L3). */
  linked: boolean;
  /** "Share progress with providers" is on (the default): own-card weight, and (a dietitian) own-card meals. */
  shareProgress: boolean;
  /** A task from the coach completes from a health app (steps, sleep). */
  healthTask: boolean;
  /** One coach, a dietitian. */
  dietitian: boolean;
}

/** What a coach can read, line by line as mobile (audited against the API's provider-side reads). */
export function coachSees(first: string | null, f: SeesFacts): string[] {
  const lines = [
    first ? `Tasks you tick on ${first}'s plan` : "Tasks you tick on their plans",
    first ? `Your answers to ${first}'s forms, and why you skip a task` : "Your answers to their forms, and why you skip a task",
    f.shareProgress
      ? "Weight you log, on a task or your own card"
      : first
        ? `Weight you log on a task from ${first}`
        : "Weight you log on a task from them",
    f.dietitian && f.shareProgress ? "Workouts and meals on the plan, and meals on your own card" : "Workouts and meals you log on the plan",
  ];
  if (f.linked) {
    lines.push(
      first
        ? `Fasts and water, only on days a task from ${first} asks: done or not, and the number`
        : "Fasts and water, only on days a task from them asks: done or not, and the number",
    );
  }
  if (f.healthTask) lines.push("Health app numbers a task asks for, like steps");
  lines.push(first ? `Your journal with ${first}` : "Your journal with them");
  if (f.linked) lines.push("Sessions you book and your messages");
  else lines.push("Sessions you book", first ? `Your messages with ${first}` : "Your messages with them");
  return lines;
}

export const GYM_SEES = ["Your check-ins", "Classes you book", "Your membership"];
export const ONLY_YOU_SEE = "Only you see";
export const onlyYouItems = (f: Pick<SeesFacts, "linked" | "shareProgress">) => [
  ...(f.linked ? ["Fasts and water on other days"] : ["Your fasts", "Your water"]),
  "Your daily list",
  ...(f.shareProgress ? [] : ["Weight you log on your own card"]),
];
/** Without a coach (a gym only): nothing of the member's own tracking is read. */
export const ONLY_YOU_ITEMS = ["Your fasts", "Your water", "Your daily list", "Weight you log on your own card"];
export const SHARE_PROGRESS_FOOT = "You can stop sharing weight and meals in Privacy.";
export const SHEET_FOOT_COACH = "It is the same for every coach, and a coach can't change it.";
export const SHEET_FOOT_GYM = "It is the same for every gym, and a gym can't change it.";
export const CLOSE = "Close";

// ─── Dark-card losers (R6) ──────────────────────────────────────────────────

export const fastEyebrow = (title: string) => `Fasting · ${title}`;
export const fastToGo = (left: string) => `${left} to go`;
export const FAST_GOAL_REACHED = "Goal reached";
export const fastEnds = (time: string) => `Ends ${time}`;
