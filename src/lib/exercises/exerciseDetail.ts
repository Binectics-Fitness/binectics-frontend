import type { StarterExercise, StarterTask } from "@/lib/starter/types";

/**
 * Links to an exercise's own page and the context that page shows. Web
 * counterpart of binectics-mobile src/utils/exerciseDetail.ts and
 * src/guided/exerciseLink.ts: mobile passes the context in navigation
 * params; on web the URL carries only ids (the session and the row) and
 * the page reads the rest from the member's program, so a reload or a
 * shared link still works.
 */

export const EXERCISE_DETAIL_BASE = "/dashboard/member/exercises";
const STARTER_HOME = "/dashboard/member/starter";

/** Where "back" goes from the exercise page. */
export type ExerciseBack = "session" | "guided" | "program";

export interface ExerciseLinkOptions {
  /** The Starter session (occurrence id) the exercise sits in. */
  session?: string;
  /** 0-based row of the exercise in that session. */
  index?: number;
  /** Default: "session" when a session is given, else "program". */
  back?: ExerciseBack;
}

/**
 * The exercise page for a library media id. The guided session's form-tips
 * link should use `{ session, index, back: "guided" }` so the way back is
 * "Back to guided session".
 */
export function exerciseDetailHref(mediaId: string, opts: ExerciseLinkOptions = {}): string {
  const qs = new URLSearchParams();
  if (opts.session) qs.set("session", opts.session);
  if (opts.session && opts.index != null && opts.index >= 0) qs.set("i", String(opts.index));
  if (opts.back && opts.back !== (opts.session ? "session" : "program")) qs.set("back", opts.back);
  const q = qs.toString();
  return `${EXERCISE_DETAIL_BASE}/${encodeURIComponent(mediaId)}${q ? `?${q}` : ""}`;
}

export interface ExerciseBackLink {
  href: string;
  label: string;
}

/** The way back from the exercise page. */
export function exerciseBackLink(session: string | null | undefined, back: string | null | undefined): ExerciseBackLink {
  const sessionHref = session ? `${STARTER_HOME}/session/${encodeURIComponent(session)}` : null;
  if (sessionHref && back === "guided") return { href: `${sessionHref}/guided`, label: "Back to guided session" };
  if (sessionHref && back !== "program") return { href: sessionHref, label: "Back to session" };
  return { href: STARTER_HOME, label: "Back to your program" };
}

/** Reads the 0-based row from the `i` query value; null when absent or not a whole number. */
export function parseRowIndex(raw: string | null | undefined): number | null {
  if (raw == null || !/^\d{1,3}$/.test(raw)) return null;
  return Number(raw);
}

export interface ExercisePlanContext {
  /** "Part of <workoutTitle>". */
  workoutTitle: string;
  /** 1-based position, for "Exercise 2 of 5"; null when the row is not known. */
  position: { index: number; total: number } | null;
  /** The plan's prescription for this exercise; null when the row is not known. */
  exercise: StarterExercise | null;
}

/**
 * The plan context for the exercise page: which session it belongs to and,
 * when the row matches this exercise, the prescription and the plan's own
 * cues. A row that names a different exercise (a stale or edited link) is
 * ignored rather than shown under the wrong name.
 */
export function resolveExercisePlanContext(
  tasks: readonly StarterTask[] | null | undefined,
  mediaId: string,
  session: string | null | undefined,
  index: number | null,
): ExercisePlanContext | null {
  if (!session || !tasks) return null;
  const task = tasks.find((t) => t.id === session);
  if (!task) return null;
  let row = index != null ? task.exercises[index] : undefined;
  let at = index;
  if (!row || row.mediaId !== mediaId) {
    // Fall back to the first row with this exercise.
    const found = task.exercises.findIndex((e) => e.mediaId === mediaId);
    row = found >= 0 ? task.exercises[found] : undefined;
    at = found >= 0 ? found : null;
  }
  return {
    workoutTitle: task.title,
    position: row && at != null ? { index: at + 1, total: task.exercises.length } : null,
    exercise: row ?? null,
  };
}

/**
 * The summary as shown: mobile's text describes its picture for some
 * exercises ("The picture is a still of the hold."). Where web has no art
 * for the exercise, that sentence would describe nothing, so it is dropped.
 */
export function displaySummary(summary: string, hasArt: boolean): string {
  if (hasArt) return summary;
  return summary.replace(/\s*The picture [^.]*\./g, "").trim();
}
