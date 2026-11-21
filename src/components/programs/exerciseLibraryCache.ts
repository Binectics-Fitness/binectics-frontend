import { exerciseLibraryService } from "@/lib/api/exerciseLibrary";
import type { ExerciseLibrary } from "@/lib/exercises/library";

export type LibraryState = { status: "loading" } | { status: "ready"; library: ExerciseLibrary } | { status: "failed" };

// One fetch per page load; the list changes only when the API redeploys.
let cached: Promise<LibraryState> | null = null;

/** The exercise library for the builder's workout task, fetched once per page load. */
export function loadLibrary(): Promise<LibraryState> {
  cached ??= exerciseLibraryService.getLibrary().then<LibraryState>((res) =>
    res.success && res.data ? { status: "ready", library: res.data } : { status: "failed" },
  ).catch<LibraryState>(() => ({ status: "failed" }));
  // A failure is retried on the next workout task that mounts.
  void cached.then((s) => {
    if (s.status === "failed") cached = null;
  });
  return cached;
}

/** Test hook: forget the cached library. */
export function resetExerciseLibraryCache() {
  cached = null;
}
