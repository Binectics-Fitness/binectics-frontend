import type {
  ClientSessionExercise,
  ClientSessionSummary,
  CoachSessionLog,
  LoggedExercise,
  LoggedSet,
  PainFlag,
} from "@/lib/api/coachSessions";

/**
 * Text for session logs, shared by the trainer's table and the client's
 * summary. Pure: no dates are formatted here (callers hold the org format).
 */

export const PAIN_AREA_LABEL: Record<string, string> = {
  neck: "Neck",
  shoulder_l: "Left shoulder",
  shoulder_r: "Right shoulder",
  back: "Back",
  hip: "Hip",
  knee_l: "Left knee",
  knee_r: "Right knee",
  ankle: "Ankle",
  wrist: "Wrist",
  other: "Other",
};

/** "52 min", "1 h 5 min". */
export function minutesLabel(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60_000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`;
}

/** Length of the session, or null when it has no end. */
export function sessionLength(log: { started_at: string; ended_at: string | null }): string | null {
  if (!log.ended_at) return null;
  const ms = Date.parse(log.ended_at) - Date.parse(log.started_at);
  return Number.isFinite(ms) && ms > 0 ? minutesLabel(ms) : null;
}

const countOf = (s: LoggedSet): string =>
  s.reps != null ? String(s.reps) : s.seconds != null ? `${s.seconds} s` : s.distance_m != null ? `${s.distance_m} m` : "✓";

const loaded = (s: LoggedSet): boolean => s.load_kg != null && s.load_kg > 0;

/** The trainer's table cell: each done set as "kg x reps", bodyweight sets as the count. */
export function setsCell(sets: LoggedSet[]): string {
  return sets
    .filter((s) => s.done)
    .map((s) => (loaded(s) ? `${s.load_kg} × ${countOf(s)}` : countOf(s)))
    .join(" · ");
}

/** "RPE 7, 8, 9" from the done sets that have one; empty when none do. */
export function rpeCell(sets: LoggedSet[]): string {
  const r = sets.filter((s) => s.done && s.rpe != null).map((s) => s.rpe);
  return r.length ? `RPE ${r.join(", ")}` : "";
}

/** The client's line: one load in front when it is shared ("16 kg x 10, 10, 9"). */
export function setsLine(sets: LoggedSet[]): string {
  const runs: { load: number | null; counts: string[] }[] = [];
  for (const s of sets.filter((x) => x.done)) {
    const load = loaded(s) ? s.load_kg : null;
    const last = runs[runs.length - 1];
    if (last && last.load === load) last.counts.push(countOf(s));
    else runs.push({ load, counts: [countOf(s)] });
  }
  return runs.map((r) => (r.load != null ? `${r.load} kg × ${r.counts.join(", ")}` : r.counts.join(", "))).join(" · ");
}

/** The note column: "Instead of ...", the exercise note, the skip reason. */
export function noteCell(e: LoggedExercise): string {
  return [e.swapped_from ? `Instead of ${e.swapped_from.toLowerCase()}` : null, e.note, e.skipped ? e.skip_reason : null]
    .filter(Boolean)
    .join(" · ");
}

/** "Best so far: 45 kg x 8" for the exercise's top loaded set. */
export function bestLine(e: ClientSessionExercise): string | null {
  if (!e.best_so_far) return null;
  let top: LoggedSet | null = null;
  for (const s of e.sets) {
    if (!s.done || !s.load_kg || !s.reps) continue;
    if (!top || s.load_kg * s.reps > (top.load_kg ?? 0) * (top.reps ?? 0)) top = s;
  }
  return top ? `Best so far: ${top.load_kg} kg × ${top.reps}` : null;
}

/** "Noted: left knee, goblet squat" */
export function painLine(f: PainFlag, exercises: Pick<LoggedExercise, "key" | "name">[]): string {
  const where = f.exercise_key ? exercises.find((e) => e.key === f.exercise_key)?.name.toLowerCase() : undefined;
  const area = (PAIN_AREA_LABEL[f.area] ?? "Other").toLowerCase();
  return `Noted: ${[area, where, f.note].filter(Boolean).join(", ")}`;
}

/** "Left knee (goblet squat)" for the trainer's readiness line. */
export function painShort(f: PainFlag, exercises: Pick<LoggedExercise, "key" | "name">[]): string {
  const where = f.exercise_key ? exercises.find((e) => e.key === f.exercise_key)?.name.toLowerCase() : undefined;
  return `${PAIN_AREA_LABEL[f.area] ?? "Other"}${where ? ` (${where})` : ""}${f.note ? `: ${f.note}` : ""}`;
}

export const ENERGY_LABEL: Record<string, string> = { low: "Energy low", ok: "Energy ok", good: "Energy good" };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Exercises with at least one ticked set, skipped ones, and kg x reps lifted. */
export function tally(log: { exercises: LoggedExercise[] }): { done: number; skipped: number; volumeKg: number } {
  let done = 0;
  let skipped = 0;
  let volume = 0;
  for (const e of log.exercises) {
    if (e.skipped) {
      skipped++;
      continue;
    }
    const ticked = e.sets.filter((s) => s.done);
    if (ticked.length) done++;
    for (const s of ticked) if (loaded(s)) volume += (s.load_kg ?? 0) * (s.reps ?? 0);
  }
  return { done, skipped, volumeKg: Math.round(volume) };
}

/** "6 exercises . 2,180 kg", or "5 exercises . 1 skipped". */
export function trainerRowMeta(log: CoachSessionLog, fmtNumber: (n: number) => string): string {
  const t = tally(log);
  return [plural(t.done, "exercise"), t.skipped ? `${t.skipped} skipped` : t.volumeKg > 0 ? `${fmtNumber(t.volumeKg)} kg` : null]
    .filter(Boolean)
    .join(" · ");
}

/** "5 exercises . Best so far on goblet squat" in the client's list. */
export function clientRowMeta(log: ClientSessionSummary): string {
  const best = log.exercises.find((e) => e.best_so_far);
  return [plural(tally(log).done, "exercise"), best ? `Best so far on ${best.name.toLowerCase()}` : null].filter(Boolean).join(" · ");
}

/** The coach's first name, or null. */
export function coachFirstName(log: ClientSessionSummary): string | null {
  return log.provider?.first_name?.trim() || null;
}

export function coachFullName(log: ClientSessionSummary): string {
  const p = log.provider;
  return [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim() || "Your coach";
}

/** When an open session becomes a no-show: the API's 7-day grace after the end. */
export const NO_SHOW_GRACE_DAYS = 7;
export function noShowDate(endsAt: string): Date {
  return new Date(Date.parse(endsAt) + NO_SHOW_GRACE_DAYS * 86_400_000);
}

/** "Thu 26 Nov", in the given time zone (the org's, as the rest of the page). */
export function dayLabel(iso: string | Date, timeZone?: string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone }).format(d).replace(",", "");
  } catch {
    return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(d).replace(",", "");
  }
}
