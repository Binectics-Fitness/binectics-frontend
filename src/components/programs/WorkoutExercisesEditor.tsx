"use client";

import { useEffect, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import ExercisePicker, { DemoTag, ExerciseThumb } from "./ExercisePicker";
import { hasExerciseIllustration } from "@/components/ExerciseIllustration";
import { exerciseLibraryService } from "@/lib/api/exerciseLibrary";
import {
  MAX_INLINE_EXERCISES,
  PROGRAM_EXERCISE_NAME_MAX,
  UNAVAILABLE_LIBRARY,
  artKey,
  libraryRef,
  truncateName,
  variantLabel,
  type ExerciseLibrary,
  type LibraryExercise,
} from "@/lib/exercises/library";
import { emptyExerciseRow, type ExerciseFormRow } from "./mapper";

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
};

type LibraryState = { status: "loading" } | { status: "ready"; library: ExerciseLibrary } | { status: "failed" };

// One fetch per page load; the list changes only when the API redeploys.
let cached: Promise<LibraryState> | null = null;
function loadLibrary(): Promise<LibraryState> {
  cached ??= exerciseLibraryService.getLibrary().then<LibraryState>((res) =>
    res.success && res.data ? { status: "ready", library: res.data } : { status: "failed" },
  ).catch<LibraryState>(() => ({ status: "failed" }));
  // A failure is retried on the next editor that mounts.
  void cached.then((s) => {
    if (s.status === "failed") cached = null;
  });
  return cached;
}

/** Test hook: forget the cached library. */
export function resetExerciseLibraryCache() {
  cached = null;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
      {children}
    </span>
  );
}

const small = "h-[44px] sm:h-8 rounded-(--r-2) px-2 text-[13px] w-full";
const iconBtn = "w-[44px] h-[44px] sm:w-7 sm:h-7 shrink-0 rounded-(--r-2) disabled:opacity-30";
const num = { fontVariantNumeric: "tabular-nums" } as const;

/**
 * The inline exercise list of a workout task: library picks (with art) and
 * custom exercises side by side. The library is optional: when its index is
 * down the picker button is hidden and custom exercises still work.
 */
export default function WorkoutExercisesEditor({
  exercises,
  onChange,
}: {
  exercises: ExerciseFormRow[];
  onChange: (next: ExerciseFormRow[]) => void;
}) {
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    let active = true;
    void loadLibrary().then((s) => active && setState(s));
    return () => {
      active = false;
    };
  }, []);

  const library = state.status === "ready" ? state.library : UNAVAILABLE_LIBRARY;
  const byId = new Map(library.exercises.map((e) => [e.id, e]));
  const full = exercises.length >= MAX_INLINE_EXERCISES;

  const patch = (i: number, p: Partial<ExerciseFormRow>) =>
    onChange(exercises.map((e, j) => (j === i ? { ...e, ...p } : e)));
  const remove = (i: number) => onChange(exercises.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const to = i + dir;
    if (to < 0 || to >= exercises.length) return;
    const next = [...exercises];
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  };
  const addFromLibrary = (e: LibraryExercise) => {
    onChange([
      ...exercises,
      emptyExerciseRow(truncateName(e.name, PROGRAM_EXERCISE_NAME_MAX), libraryRef(e.id)),
    ]);
  };
  const setVariant = (i: number, ex: ExerciseFormRow, variant: string) => {
    if (!ex.library_exercise_id) return;
    const ref = libraryRef(ex.library_exercise_id, variant || undefined);
    patch(i, {
      library_variant: ref.library_variant,
      media_id: ref.media_id,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>Exercises</FieldLabel>

      {exercises.length === 0 && (
        <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
          No exercises yet. Add some from the library or write your own.
        </div>
      )}

      {exercises.map((ex, i) => {
        const lib = ex.library_exercise_id ? byId.get(ex.library_exercise_id) : undefined;
        const art = artKey(ex.media_id, hasExerciseIllustration);
        const variants = lib?.variants ?? [];
        return (
          <div
            key={i}
            className="rounded-(--r-2) p-2.5 flex flex-col gap-2"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] tabular-nums w-4 shrink-0" style={{ color: "var(--fg-4)" }}>{i + 1}</span>
              {ex.library_exercise_id && <ExerciseThumb mediaId={art} />}
              <input
                value={ex.name}
                onChange={(e) => patch(i, { name: e.target.value })}
                maxLength={PROGRAM_EXERCISE_NAME_MAX}
                placeholder="Exercise name"
                aria-label={`Exercise ${i + 1} name`}
                className={`${small} order-last basis-full sm:order-none sm:basis-0 sm:flex-1 min-w-0`}
                style={{ ...fieldStyle, background: "var(--bg)" }}
              />
              {ex.library_exercise_id && art && <DemoTag />}
              <span className="flex-1 sm:hidden" />
              <button type="button" aria-label="Move exercise up" onClick={() => move(i, -1)} disabled={i === 0}
                className={iconBtn} style={{ border: "1px solid var(--border)", color: "var(--fg-3)" }}>
                <svg className="mx-auto" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6" /></svg>
              </button>
              <button type="button" aria-label="Move exercise down" onClick={() => move(i, 1)} disabled={i === exercises.length - 1}
                className={iconBtn} style={{ border: "1px solid var(--border)", color: "var(--fg-3)" }}>
                <svg className="mx-auto" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <button type="button" aria-label="Remove exercise" onClick={() => remove(i)}
                className={iconBtn} style={{ border: "1px solid var(--border)", color: "var(--fg-3)" }}>
                <svg className="mx-auto" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {variants.length > 0 && (
              <div className="flex flex-col gap-1">
                <FieldLabel>View</FieldLabel>
                <SearchableSelect
                  value={ex.library_variant ?? ""}
                  onChange={(v) => setVariant(i, ex, v)}
                  options={[{ label: "Default view", value: "" }, ...variants.map((v) => ({ label: variantLabel(v), value: v }))]}
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex flex-col gap-1">
                <FieldLabel>Sets</FieldLabel>
                <input type="number" min={1} max={20} value={ex.sets} onChange={(e) => patch(i, { sets: e.target.value })}
                  className={small} style={{ ...fieldStyle, ...num, background: "var(--bg)" }} />
              </label>
              <label className="flex flex-col gap-1">
                <FieldLabel>Reps</FieldLabel>
                <input type="number" min={1} max={100} value={ex.reps} onChange={(e) => patch(i, { reps: e.target.value })}
                  className={small} style={{ ...fieldStyle, ...num, background: "var(--bg)" }} />
              </label>
              <label className="flex flex-col gap-1">
                <FieldLabel>Seconds</FieldLabel>
                <input type="number" min={1} max={3600} value={ex.seconds} onChange={(e) => patch(i, { seconds: e.target.value })}
                  className={small} style={{ ...fieldStyle, ...num, background: "var(--bg)" }} />
              </label>
              <label className="flex flex-col gap-1">
                <FieldLabel>Rest (s)</FieldLabel>
                <input type="number" min={0} max={600} value={ex.rest_seconds} onChange={(e) => patch(i, { rest_seconds: e.target.value })}
                  className={small} style={{ ...fieldStyle, ...num, background: "var(--bg)" }} />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <FieldLabel>Cues (one per line, up to 6)</FieldLabel>
              <textarea value={ex.cues} onChange={(e) => patch(i, { cues: e.target.value })} rows={2}
                className="rounded-(--r-2) px-2 py-1.5 text-[13px] resize-none" style={{ ...fieldStyle, background: "var(--bg)" }} />
            </label>
          </div>
        );
      })}

      {picking && library.available && (
        <ExercisePicker
          exercises={library.exercises}
          onPick={(e) => {
            addFromLibrary(e);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {library.available && !picking && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            disabled={full}
            className="min-h-[44px] sm:min-h-0 font-mono text-[10.5px] uppercase tracking-[0.04em] px-3 sm:px-2.5 py-1.25 rounded-(--r-1) disabled:opacity-40"
            style={{ border: "1px solid var(--border)", color: "var(--fg-2)", background: "transparent" }}
          >
            + From library
          </button>
        )}
        <button
          type="button"
          onClick={() => onChange([...exercises, emptyExerciseRow()])}
          disabled={full}
          className="min-h-[44px] sm:min-h-0 font-mono text-[10.5px] uppercase tracking-[0.04em] px-3 sm:px-2.5 py-1.25 rounded-(--r-1) disabled:opacity-40"
          style={{ border: "1px dashed var(--border-2)", color: "var(--fg-3)", background: "transparent" }}
        >
          + Custom exercise
        </button>
        {full && (
          <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
            A workout task holds at most {MAX_INLINE_EXERCISES} exercises.
          </span>
        )}
      </div>
      {state.status === "failed" && (
        <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
          The exercise library didn&apos;t load. You can still add custom exercises.
        </div>
      )}
      {exercises.some((e) => e.library_exercise_id) && (
        <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
          Library art is illustrated demo art, not professionally reviewed.
        </div>
      )}
    </div>
  );
}
