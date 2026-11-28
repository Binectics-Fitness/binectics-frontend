/**
 * Pure helpers for the provider exercise library (API contract:
 * binectics-plans/provider-library-contract.md). React-free so the picker
 * logic is unit-tested directly.
 *
 * The art is illustrated demo art.
 */

/** Program block exercises are capped at 80 characters, workout plans at 200. */
export const PROGRAM_EXERCISE_NAME_MAX = 80;
export const WORKOUT_EXERCISE_NAME_MAX = 200;
/** The API refuses more than this many inline exercises on one block. */
export const MAX_INLINE_EXERCISES = 30;

/** The neutral tag shown on provider-side art. Wording is an owner/lawyer decision (O-8). */
export const DEMO_TAG = "Demo";
export const DEMO_ART_NOTE = "Illustrated demo";

export interface LibraryExercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  variants: string[];
  /**
   * Written guidance, where the library has it. General guidance, not
   * medical advice, and not read by a coach (see MEMBER_GUIDANCE_FLAG).
   */
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  steps?: string[];
  cues?: string[];
  /**
   * True when the exercise is a hold or a timed effort (plank, stretch):
   * prescribe it in seconds, not reps. Absent on an older API.
   */
  timed?: boolean;
  /**
   * From the API's approved-text list: true only when the written text may be
   * shown to a member or client. Absent (an older API) reads as NOT approved,
   * so member display fails closed. Providers see all text regardless.
   */
  memberTextApproved?: boolean;
  /** The client builds the API says bundle art for this exercise. Informational: this app checks its own bundle. */
  artOn?: string[];
}

/**
 * The runtime flag that lets a member see the written steps and cues of an
 * exercise the Starter program does not already explain. Providers always
 * see them when picking.
 */
export const MEMBER_GUIDANCE_FLAG = "exercise_guidance_for_members";

/** Shown under any written guidance. */
export const GUIDANCE_NOTE = "General guidance, not medical advice.";

/** A library row's lines of text: strings only, trimmed, capped. */
function lines(v: unknown, max: number): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, max);
  return out.length ? out : undefined;
}

/** True when the exercise has steps or cues to read. */
export function hasGuidance(e: Pick<LibraryExercise, "steps" | "cues"> | null | undefined): boolean {
  return !!e && ((e.steps?.length ?? 0) > 0 || (e.cues?.length ?? 0) > 0);
}

/** "none" is how the library spells "needs nothing". */
export function equipmentLabel(equipment: string): string {
  return equipment === "none" ? "no equipment" : equipment;
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
    const exercise: LibraryExercise = {
      id,
      name,
      category: str(row.category) ?? "Other",
      equipment: str(row.equipment) ?? "none",
      variants: Array.isArray(row.variants)
        ? row.variants.filter((v): v is string => typeof v === "string" && v.length > 0)
        : [],
    };
    // Optional text: absent on an older API, so every reader copes without it.
    const primaryMuscles = lines(row.primary_muscles, 8);
    const secondaryMuscles = lines(row.secondary_muscles, 8);
    const steps = lines(row.steps, 12);
    const cues = lines(row.cues, 8);
    if (primaryMuscles) exercise.primaryMuscles = primaryMuscles;
    if (secondaryMuscles) exercise.secondaryMuscles = secondaryMuscles;
    if (steps) exercise.steps = steps;
    if (cues) exercise.cues = cues;
    if (row.timed === true) exercise.timed = true;
    if (row.member_text_approved === true) exercise.memberTextApproved = true;
    if (Array.isArray(row.art_on)) exercise.artOn = row.art_on.filter((v): v is string => typeof v === "string");
    exercises.push(exercise);
  }
  return { available: exercises.length > 0, exercises };
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

export interface LibraryFilter {
  query: string;
  category: string;
  equipment: string;
  /** Matches a primary or secondary muscle that contains this text. */
  muscle?: string;
}

export const ALL = "";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/** Search by name (every word must match), narrowed by category and equipment. */
export function filterLibrary(
  exercises: LibraryExercise[],
  { query, category, equipment, muscle }: LibraryFilter,
): LibraryExercise[] {
  const words = norm(query).split(" ").filter(Boolean);
  return exercises.filter((e) => {
    if (category && e.category !== category) return false;
    if (equipment && e.equipment !== equipment) return false;
    if (muscle && ![...(e.primaryMuscles ?? []), ...(e.secondaryMuscles ?? [])].some((m) => m === muscle)) return false;
    if (words.length === 0) return true;
    const hay = norm(`${e.name} ${e.id.replace(/-/g, " ")}`);
    return words.every((w) => hay.includes(w));
  });
}

/** Distinct primary muscles, sorted, for the Library's muscle filter. */
export function distinctMuscles(exercises: LibraryExercise[]): string[] {
  return [...new Set(exercises.flatMap((e) => e.primaryMuscles ?? []))].sort((a, b) => a.localeCompare(b));
}

/** The honest art tag every Library row carries. */
export type ArtTag = "Illustrated" | "Text only";

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

/** The runtime flag behind the web Library page (default off). */
export const LIBRARY_PAGE_FLAG = "exercise_library_page";

/** Shown with every Library listing: no claim of review or certification. */
export const LIBRARY_NOTE = "General guidance, not medical advice.";

/** Shown in the detail of an exercise whose text is not yet approved for members. */
export const WITHHELD_NOTE = "Members and clients do not see this written text yet.";
