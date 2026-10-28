import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import type { ProgramInstanceStatus } from "./programs";
import { normalizeExercise } from "./starter";
import type { StarterExercise } from "@/lib/starter/types";

/**
 * The client's side of Programs: the programs assigned to the signed-in
 * member (GET /my-programs). Read-only and minimal: the member home uses it
 * for its "Day N of M" hero. The mobile app's src/api/myPrograms.ts is the
 * full client (agenda, complete/skip/log); add calls here as web needs them.
 * Hand-written, like programs.ts, so the UI doesn't wait on the schema.
 */

/** Where a program is today, computed by the API in the program's time zone. */
export interface MyProgramProgress {
  /** 1-based day of the program; null before the start date. */
  day: number | null;
  /** Length in days; null for an open-ended program. */
  total_days: number | null;
  /** Plain counts over the last 7 days including today. */
  last_7_days: {
    scheduled: number;
    done: number;
    done_late: number;
    skipped: number;
    missed: number;
    open: number;
  };
}

export interface MyProgram {
  _id: string;
  /**
   * 'one_off' is not a program: it holds tasks a provider sent on their own
   * ("From Ada"). It has no day count. Missing on older documents = program.
   */
  kind?: "program" | "one_off";
  name: string;
  status: ProgramInstanceStatus;
  started_at?: string;
  ends_at?: string | null;
  progress?: MyProgramProgress;
}

/** A workout task a provider wrote with its exercises inline (no linked plan). */
export interface ProgramWorkoutSession {
  id: string;
  title: string;
  scheduledFor: string;
  status: string;
  programName: string;
  exercises: StarterExercise[];
}

const isRec = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * The workout sessions in a program agenda that list their exercises inline.
 * Starter sessions (their own pages) and workouts that link a plan (shown
 * under "Workout plans") are left out; unreadable rows are skipped.
 */
export function inlineWorkoutSessions(programName: string, agenda: unknown): ProgramWorkoutSession[] {
  if (!Array.isArray(agenda)) return [];
  const out: ProgramWorkoutSession[] = [];
  for (const t of agenda) {
    if (!isRec(t) || t.component_type !== "workout_plan" || t.workout_plan_id || t.source === "starter") continue;
    const id = typeof t._id === "string" ? t._id : null;
    const scheduledFor = typeof t.scheduled_for === "string" ? t.scheduled_for : null;
    const exercises = (Array.isArray(t.exercises) ? t.exercises : [])
      .map(normalizeExercise)
      .filter((e): e is StarterExercise => e !== null);
    if (!id || !scheduledFor || exercises.length === 0) continue;
    out.push({
      id,
      title: typeof t.title === "string" && t.title.trim() ? t.title : "Workout",
      scheduledFor,
      status: typeof t.status === "string" ? t.status : "pending",
      programName,
      exercises,
    });
  }
  return out.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
}

export const myProgramsService = {
  /** One program's agenda, reduced to its inline-exercise workout sessions. */
  async inlineWorkouts(instanceId: string, programName: string): Promise<ApiResponse<ProgramWorkoutSession[]>> {
    const res = await apiClient.get<unknown>(`/my-programs/${encodeURIComponent(instanceId)}`);
    if (!res.success) return { ...res, data: undefined } as ApiResponse<ProgramWorkoutSession[]>;
    const d = res.data;
    return { ...res, data: inlineWorkoutSessions(programName, isRec(d) ? d.agenda : []) };
  },

  /** My programs, newest first, each with its progress summary. */
  listMine(): Promise<ApiResponse<MyProgram[]>> {
    return apiClient.get<MyProgram[]>("/my-programs");
  },
};

/** The program the home hero shows, and the numbers it draws. */
export interface ProgramDay {
  name: string;
  day: number;
  /** null when the program has no end date: "Day N", no bar. */
  totalDays: number | null;
  /** Last 7 days, only when anything was scheduled in them. */
  week: { done: number; scheduled: number } | null;
}

/**
 * The active program to headline, or null. Only a real program that has
 * started and hasn't run past its last day counts: one-off task holders have
 * no day count, and a paused, finished or not-yet-started program has no
 * "today". The API lists newest first, so the most recent one wins.
 */
export function currentProgramDay(programs: readonly MyProgram[]): ProgramDay | null {
  for (const p of programs) {
    if ((p.kind ?? "program") !== "program" || p.status !== "active") continue;
    const progress = p.progress;
    if (!progress || progress.day == null || progress.day < 1) continue;
    const total = progress.total_days && progress.total_days > 0 ? progress.total_days : null;
    if (total !== null && progress.day > total) continue;
    const w = progress.last_7_days;
    return {
      name: p.name,
      day: progress.day,
      totalDays: total,
      // Late completions count as done: they happened.
      week: w && w.scheduled > 0 ? { done: w.done, scheduled: w.scheduled } : null,
    };
  }
  return null;
}
