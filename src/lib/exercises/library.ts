/**
 * Pure helpers for the provider exercise library (API contract:
 * binectics-plans/provider-library-contract.md). React-free so the picker
 * logic is unit-tested directly.
 *
 * The art is illustrated demo art, not professionally reviewed. Never call it
 * approved, cleared or reviewed.
 */

/** Program block exercises are capped at 80 characters, workout plans at 200. */
export const PROGRAM_EXERCISE_NAME_MAX = 80;
export const WORKOUT_EXERCISE_NAME_MAX = 200;
/** The API refuses more than this many inline exercises on one block. */
export const MAX_INLINE_EXERCISES = 30;

/** The neutral tag shown on provider-side art. Wording is an owner/lawyer decision (O-8). */
export const DEMO_TAG = "Demo";
export const DEMO_ART_NOTE = "Illustrated demo art, not professionally reviewed";

export interface LibraryExercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  variants: string[];
}

export interface ExerciseLibrary {
  /** false = the index is down: hide the picker, custom exercises still work. */
  available: boolean;
  exercises: LibraryExercise[];
}

/** The three optional fields every library-backed exercise carries. */
export interface LibraryRef {
  library_exercise_id?: string;
  library_variant?: string;
  media_id?: string;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v : undefined;

export const UNAVAILABLE_LIBRARY: ExerciseLibrary = { available: false, exercises: [] };

export function normalizeLibrary(raw: unknown): ExerciseLibrary {
  if (!isObj(raw) || raw.available !== true || !Array.isArray(raw.exercises)) {
    return UNAVAILABLE_LIBRARY;
  }
  const exercises: LibraryExercise[] = [];
  for (const row of raw.exercises) {
    if (!isObj(row)) continue;
    const id = str(row.id);
    const name = str(row.name);
    if (!id || !name) continue;
    exercises.push({
      id,
      name,
      category: str(row.category) ?? "Other",
      equipment: str(row.equipment) ?? "none",
      variants: Array.isArray(row.variants)
        ? row.variants.filter((v): v is string => typeof v === "string" && v.length > 0)
        : [],
    });
  }
  return { available: exercises.length > 0, exercises };
}

/** "Chair squat" for "chair-squat" variants such as "seat-high" -> "Seat high". */
export function variantLabel(variant: string): string {
  const t = variant.replace(/-/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Keep a snapshot name within the field's cap (adds an ellipsis when cut). */
export function truncateName(name: string, max: number): string {
  const t = name.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** The render key: the id, or `id--variant` when a variant is chosen. */
export function mediaKey(id: string, variant?: string): string {
  return variant ? `${id}--${variant}` : id;
}

/**
 * The fields to send for a library pick. Custom exercises send none of them
 * (this returns {}).
 */
export function libraryRef(id: string, variant?: string): Required<Pick<LibraryRef, "library_exercise_id" | "media_id">> & Pick<LibraryRef, "library_variant"> {
  const ref: Required<Pick<LibraryRef, "library_exercise_id" | "media_id">> & Pick<LibraryRef, "library_variant"> = {
    library_exercise_id: id,
    media_id: mediaKey(id, variant),
  };
  if (variant) ref.library_variant = variant;
  return ref;
}

/**
 * The art to show for a media key. Only the 24 default views are bundled on
 * web, so a variant falls back to its base exercise's art.
 */
export function artKey(mediaId: string | undefined, has: (id: string) => boolean): string | undefined {
  if (!mediaId) return undefined;
  if (has(mediaId)) return mediaId;
  const base = mediaId.split("--")[0];
  return has(base) ? base : undefined;
}

export interface LibraryFilter {
  query: string;
  category: string;
  equipment: string;
}

export const ALL = "";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/** Search by name (every word must match), narrowed by category and equipment. */
export function filterLibrary(
  exercises: LibraryExercise[],
  { query, category, equipment }: LibraryFilter,
): LibraryExercise[] {
  const words = norm(query).split(" ").filter(Boolean);
  return exercises.filter((e) => {
    if (category && e.category !== category) return false;
    if (equipment && e.equipment !== equipment) return false;
    if (words.length === 0) return true;
    const hay = norm(`${e.name} ${e.id.replace(/-/g, " ")}`);
    return words.every((w) => hay.includes(w));
  });
}

/** Distinct values for a filter dropdown, sorted. */
export function distinctValues(exercises: LibraryExercise[], key: "category" | "equipment"): string[] {
  return [...new Set(exercises.map((e) => e[key]))].sort((a, b) => a.localeCompare(b));
}

const BY_CODE: Record<string, string> = {
  EXERCISE_LIBRARY_UNKNOWN_EXERCISE:
    "One of the library exercises is no longer in the library. Remove it or replace it with a custom exercise, then save again.",
  EXERCISE_LIBRARY_UNKNOWN_VARIANT:
    "One of the chosen exercise views is no longer available. Pick the default view or another one, then save again.",
  PROGRAM_TASK_CONFLICTING_CONTENT:
    "A workout task can either link a workout plan or list its own exercises, not both.",
  PROGRAM_TASK_TOO_MANY_EXERCISES: `A workout task can list at most ${MAX_INLINE_EXERCISES} exercises.`,
};

/**
 * A plain sentence for a library-related save failure, or null when the code
 * is not one of ours (the caller then shows its normal message). The plan
 * refusal (403 BILLING_FEATURE_DISABLED) is shown through PlanGate instead.
 */
export function libraryErrorMessage(res: { code?: string }): string | null {
  return (res.code && BY_CODE[res.code]) || null;
}
