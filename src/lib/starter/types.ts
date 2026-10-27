/**
 * Starter Program (free, self-serve beginner workout program) types.
 * Contract: binectics-plans/starter-api-contract.md. Mirrors the mobile
 * app's src/types/starter.ts, with web-side camelCase names.
 */

export enum StarterGoal {
  LoseWeight = "lose_weight",
  BuildStrength = "build_strength",
  GetActive = "get_active",
}

export enum StarterEquipment {
  None = "none",
  Dumbbells = "dumbbells",
  Gym = "gym",
}

export enum StarterLeaveReason {
  TooHard = "too_hard",
  TooEasy = "too_easy",
  NoTime = "no_time",
  NoEquipment = "no_equipment",
  Other = "other",
}

export enum StarterStartOn {
  Today = "today",
  NextMonday = "next_monday",
}

export enum StarterExportFormat {
  Json = "json",
  Csv = "csv",
}

export enum StarterTaskStatus {
  Pending = "pending",
  Done = "done",
  Skipped = "skipped",
  Missed = "missed",
}

export type StarterDaysPerWeek = 2 | 3 | 4;

export interface StarterQuery {
  goal: StarterGoal;
  equipment: StarterEquipment;
  days: StarterDaysPerWeek;
}

export interface StarterExercise {
  name: string;
  sets?: number;
  reps?: number;
  seconds?: number;
  restSeconds?: number;
  /** Plain-language cues, in order. */
  cues: string[];
  /** Id of a bundled illustration (see ExerciseIllustration); absent for none. */
  mediaId?: string;
}

export interface StarterSessionOutline {
  title: string;
  detail?: string;
  exercises: StarterExercise[];
}

/** One row of GET /starter-programs/options: small, no sessions. */
export interface StarterOption {
  templateId: string;
  name: string;
  summary?: string;
  goalTags: StarterGoal[];
  equipment: StarterEquipment;
  daysPerWeek: number;
  sessionMinutes: number;
  durationWeeks: number;
}

export interface StarterOptions {
  /** False when nothing matched every answer and these are the nearest. */
  exact: boolean;
  /** Best match first, then up to two alternatives. Empty when nothing is published. */
  options: StarterOption[];
}

export interface StarterPreview extends StarterOption {
  cautions?: string;
  weekOne: StarterSessionOutline[];
  /** One line per later week. */
  laterWeeks: { week: number; name: string }[];
}

export interface StarterStartInput {
  templateId: string;
  /** Member-local YYYY-MM-DD, today..today+14. */
  startDate: string;
  /** IANA name. */
  timezone: string;
  adultConfirmed: boolean;
  safetyAck: boolean;
  /** Pre-participation answer: true = "yes". Only the flag is sent, never the answer. */
  screeningFlagged: boolean;
  remindersEnabled?: boolean;
}

export interface StarterSwapInput extends StarterStartInput {
  reason?: StarterLeaveReason;
}

export interface StarterStarted {
  instanceId: string;
  name?: string;
  startedAt?: string;
}

/** One scheduled session (an occurrence) of the member's starter program. */
export interface StarterTask {
  id: string;
  instanceId?: string;
  title: string;
  detail?: string;
  /** ISO date-time; the first 10 characters are the program-local day. */
  scheduledFor: string;
  status: StarterTaskStatus;
  completedLate: boolean;
  value?: number;
  sessionMinutes?: number;
  exercises: StarterExercise[];
}

export interface StarterProgress {
  /** 1-based day; null before the start date. */
  day: number | null;
  totalDays: number | null;
  last7: { scheduled: number; done: number } | null;
}

export interface StarterProgram {
  id: string;
  name: string;
  status: string;
  startedAt?: string;
  endsAt?: string | null;
  catchUpDays?: number;
  remindersEnabled: boolean;
  sharedWithProviderIds: string[];
  progress: StarterProgress | null;
}

export interface StarterProgramDetail {
  program: StarterProgram;
  tasks: StarterTask[];
}
