import type { WorkoutPlan, WorkoutExercise } from "@/lib/api/progress";
import type { StarterExercise } from "@/lib/starter/types";
import { exerciseDose, restLine } from "@/lib/starter/model";
import type { ClientExercise } from "@/components/workouts/ClientExerciseList";

/** An assigned workout plan's exercises, in the provider's order. */
export function planExerciseRows(exercises: readonly WorkoutExercise[] | undefined): ClientExercise[] {
  return [...(exercises ?? [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((e) => ({
      name: e.name,
      dose:
        [
          e.sets && e.reps ? `${e.sets} x ${e.reps}` : e.sets ? `${e.sets} sets` : null,
          e.duration_minutes ? `${e.duration_minutes} min` : null,
          e.rest_seconds ? `Rest ${e.rest_seconds} sec` : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
      notes: [e.notes || e.description || ""],
      mediaId: e.media_id,
      libraryExerciseId: e.library_exercise_id,
      libraryVariant: e.library_variant,
    }));
}

/** A program task's inline exercises. */
export function sessionExerciseRows(exercises: readonly StarterExercise[]): ClientExercise[] {
  return exercises.map((e) => ({
    name: e.name,
    dose: [exerciseDose(e), restLine(e)].filter(Boolean).join(" · ") || undefined,
    notes: e.cues,
    mediaId: e.mediaId,
    libraryExerciseId: e.libraryExerciseId,
    libraryVariant: e.libraryVariant,
  }));
}

export function authorName(plan: Pick<WorkoutPlan, "created_by">): string | null {
  const c = plan.created_by;
  if (typeof c === "object" && c !== null) return `${c.first_name} ${c.last_name}`.trim() || null;
  return null;
}
