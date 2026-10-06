import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import type { ProgramInstanceStatus } from "./programs";

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

export const myProgramsService = {
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
