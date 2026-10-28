import { hasExerciseIllustration } from "@/components/ExerciseIllustration";

/** Library fields a provider-assigned exercise may carry. */
export interface LibraryRef {
  mediaId?: string | null;
  libraryExerciseId?: string | null;
  libraryVariant?: string | null;
}

/** Shown under a list that has illustrations. Never claims review or approval. */
export const DEMO_ART_NOTE = "Illustrated demo art, not professionally reviewed.";

/**
 * The bundled illustration key for a provider-assigned exercise, or null.
 *
 * Tries the stored media id, then `library_exercise_id[--variant]`, and for
 * each falls back to the plain exercise id (only default views are bundled, so
 * a stored variant shows its exercise's default art). No art (not bundled,
 * unknown or later withdrawn, or a custom exercise) gives null and the caller
 * shows the plain text row.
 */
export function resolveClientArt(ref: LibraryRef): string | null {
  const keys: string[] = [];
  if (ref.mediaId) keys.push(ref.mediaId);
  if (ref.libraryExerciseId) {
    if (ref.libraryVariant) keys.push(`${ref.libraryExerciseId}--${ref.libraryVariant}`);
    keys.push(ref.libraryExerciseId);
  }
  for (const k of keys) {
    if (hasExerciseIllustration(k)) return k;
    const base = k.split("--")[0];
    if (base && hasExerciseIllustration(base)) return base;
  }
  return null;
}
